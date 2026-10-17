import { randomUUID } from "node:crypto";
import { EventEmitter } from "node:events";
import { promises as fs } from "node:fs";
import path from "node:path";
import { SEED_JOBS, type Job } from "@/lib/data";
import { canSeePhoto, errors, MAX_OPEN, rsvpTotals, tooMany, visibleNote, type CommunityStore, type Photo } from "./shared";

/**
 * A JSON file on disk, for local development without a database. It's written atomically
 * and changed one step at a time, but it only works for a single server process with a
 * lasting disk. Deployments use Postgres (pgStore.ts) by setting DATABASE_URL.
 */

interface Row extends Omit<Job, "mine" | "photo"> {
  /** The photo's type, if one was sent. The image itself is a file in PHOTOS. */
  photo?: Photo["mime"];
  /** The device that reported it, or null for the demo's neighbors. Never sent to other residents. */
  owner: string | null;
  createdAt: string;
}

interface Db {
  version: number;
  jobs: Row[];
  /** Notice id → device id → people coming. */
  rsvps: Record<string, Record<string, number>>;
}

const DIR = process.env.DATA_DIR ?? path.join(process.cwd(), ".data");
const FILE = path.join(DIR, "community.json");
const PHOTOS = path.join(DIR, "photos");
// Ids are UUIDs or seed ids; anything else never reaches the disk.
const photoFile = (id: string) => (/^[\w-]{1,64}$/.test(id) ? path.join(PHOTOS, id) : null);

// One instance per server process, surviving hot reloads in development.
const g = globalThis as unknown as { __communityFile?: { db: Promise<Db>; queue: Promise<unknown>; events: EventEmitter } };
const shared = (g.__communityFile ??= { db: load(), queue: Promise.resolve(), events: new EventEmitter().setMaxListeners(0) });

async function load(): Promise<Db> {
  try {
    return JSON.parse(await fs.readFile(FILE, "utf8")) as Db;
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
    const createdAt = new Date().toISOString();
    return {
      version: 1,
      jobs: SEED_JOBS.map((j) => ({
        id: j.id,
        service: j.service,
        location: j.location,
        neighborhood: j.neighborhood,
        note: j.note,
        token: j.token,
        status: j.status,
        staff: j.staff,
        owner: null,
        createdAt,
      })),
      rsvps: {},
    };
  }
}

async function save(db: Db) {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  const tmp = `${FILE}.${randomUUID()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(db));
  await fs.rename(tmp, FILE);
}

/** Runs one change at a time, saves it, and tells every open page. `fn` must throw before changing anything. */
function change<T>(fn: (db: Db) => T): Promise<T> {
  const run = shared.queue.then(async () => {
    const db = await shared.db;
    const result = fn(db);
    db.version++;
    await save(db);
    shared.events.emit("change", db.version);
    return result;
  });
  shared.queue = run.catch(() => {});
  return run;
}

export const fileStore: CommunityStore = {
  async stateFor(v) {
    const db = await shared.db;
    const jobs = db.jobs
      .filter((j) => j.status === "queued" || j.status === "visiting" || j.owner === v.device)
      .map((row): Job => {
        const mine = row.owner === v.device;
        const { id, service, location, neighborhood, token, status, staff } = row;
        const photo = !!row.photo && canSeePhoto(row.owner, v);
        return { id, service, location, neighborhood, token, status, staff, note: visibleNote(row.note, mine, v), mine, photo };
      });
    const rsvps = Object.entries(db.rsvps).map(([notice, people]) => ({
      notice,
      total: Object.values(people).reduce((a, b) => a + b, 0),
      mine: people[v.device] ?? 0,
    }));
    return { version: db.version, jobs, rsvps: rsvpTotals(rsvps), staff: v.staff };
  },

  async book(v, r) {
    const id = randomUUID();
    // Saved first so the photo exists by the time pages hear about the report.
    if (r.photo) {
      await fs.mkdir(PHOTOS, { recursive: true });
      await fs.writeFile(photoFile(id)!, r.photo.data);
    }
    return change((db) => {
      const open = db.jobs.filter((j) => j.owner === v.device && j.service === r.service.id && (j.status === "queued" || j.status === "visiting"));
      if (open.length >= MAX_OPEN) throw tooMany(r.service);
      const token = Math.max(0, ...db.jobs.filter((j) => j.service === r.service.id).map((j) => j.token)) + 1;
      db.jobs.push({
        id,
        service: r.service.id,
        location: r.location,
        neighborhood: r.neighborhood,
        note: r.note,
        token,
        status: "queued",
        owner: v.device,
        photo: r.photo?.mime,
        createdAt: new Date().toISOString(),
      });
      return { id, token };
    }).catch(async (e) => {
      if (r.photo) await fs.rm(photoFile(id)!, { force: true });
      throw e;
    });
  },

  async photo(v, id) {
    const row = (await shared.db).jobs.find((j) => j.id === id);
    const file = photoFile(id);
    if (!row?.photo || !file || !canSeePhoto(row.owner, v)) return null;
    try {
      return { mime: row.photo, data: await fs.readFile(file) };
    } catch {
      return null;
    }
  },

  cancel(v, id) {
    return change((db) => {
      const job = db.jobs.find((j) => j.id === id);
      if (!job || job.owner !== v.device) throw errors.notYours();
      if (job.status !== "queued") throw errors.crewOnIt();
      job.status = "cancelled";
    });
  },

  startNext(service) {
    return change((db) => {
      const jobs = db.jobs.filter((j) => j.service === service.id);
      const busy = new Set(jobs.filter((j) => j.status === "visiting").map((j) => j.staff));
      const free = service.team.find((t) => !busy.has(t));
      const next = jobs.filter((j) => j.status === "queued").sort((a, b) => a.token - b.token)[0];
      if (!free) throw errors.allBusy();
      if (!next) throw errors.nobody();
      next.status = "visiting";
      next.staff = free;
      return { staff: free, location: next.location };
    });
  },

  finish(id) {
    return change((db) => {
      const job = db.jobs.find((j) => j.id === id);
      if (!job || job.status !== "visiting") throw errors.notInProgress();
      job.status = "done";
    });
  },

  rsvp(v, noticeId, people) {
    return change((db) => {
      const forNotice = (db.rsvps[noticeId] ??= {});
      if (people) forNotice[v.device] = people;
      else delete forNotice[v.device];
    });
  },

  onChange(listener) {
    shared.events.on("change", listener);
    return () => void shared.events.off("change", listener);
  },
};
