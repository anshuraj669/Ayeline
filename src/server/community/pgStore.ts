import { randomUUID } from "node:crypto";
import { EventEmitter } from "node:events";
import pg from "pg";
import { SEED_JOBS, type Job, type JobStatus, type Neighborhood } from "@/lib/data";
import { canSeePhoto, errors, MAX_OPEN, rsvpTotals, tooMany, visibleNote, type CommunityStore, type Photo } from "./shared";

/**
 * Postgres storage, for deployments. Set DATABASE_URL and the tables are created (and the
 * demo's starting reports added) on first use. Safe with several app instances:
 * request numbers are handed out under a per-service lock, and every change is announced
 * with NOTIFY so each instance can push it to its own open pages.
 */

const CHANNEL = "ayeline_changes";

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS community_jobs (
    id           text PRIMARY KEY,
    service      text NOT NULL,
    location     text NOT NULL,
    neighborhood text NOT NULL,
    note         text NOT NULL DEFAULT '',
    token        integer NOT NULL,
    status       text NOT NULL CHECK (status IN ('queued', 'visiting', 'done', 'cancelled')),
    staff        text,
    owner        text,
    created_at   timestamptz NOT NULL DEFAULT now(),
    UNIQUE (service, token)
  );
  CREATE INDEX IF NOT EXISTS community_jobs_open ON community_jobs (service, status);
  CREATE INDEX IF NOT EXISTS community_jobs_owner ON community_jobs (owner);
  CREATE TABLE IF NOT EXISTS community_rsvps (
    notice_id text NOT NULL,
    device    text NOT NULL,
    people    integer NOT NULL CHECK (people BETWEEN 1 AND 10),
    PRIMARY KEY (notice_id, device)
  );
  CREATE TABLE IF NOT EXISTS community_photos (
    job_id text PRIMARY KEY REFERENCES community_jobs (id) ON DELETE CASCADE,
    mime   text NOT NULL,
    data   bytea NOT NULL
  );
  CREATE TABLE IF NOT EXISTS community_meta (
    key   text PRIMARY KEY,
    value integer NOT NULL
  );
`;

function config(): pg.PoolConfig {
  return {
    connectionString: process.env.DATABASE_URL,
    max: Number(process.env.DATABASE_POOL_MAX ?? 5),
    // Fail fast if the database is unreachable, rather than leaving requests hanging.
    connectionTimeoutMillis: 5_000,
    query_timeout: 10_000,
    // For hosts whose certificates can't be verified. Prefer ?sslmode=verify-full in DATABASE_URL.
    ssl: process.env.DATABASE_SSL === "no-verify" ? { rejectUnauthorized: false } : undefined,
  };
}

interface Shared {
  pool: pg.Pool;
  ready: Promise<void>;
  events: EventEmitter;
  /** True while this instance is LISTENing, so other instances' changes reach it. */
  listening: boolean;
}

// One pool per server process, surviving hot reloads in development.
const g = globalThis as unknown as { __communityPg?: Shared };

function shared(): Shared {
  if (!g.__communityPg) {
    const pool = new pg.Pool(config());
    // An idle client losing its connection shouldn't crash the server.
    pool.on("error", (e) => console.error("[community] idle Postgres client error:", e.message));
    const s: Shared = { pool, ready: Promise.resolve(), events: new EventEmitter().setMaxListeners(0), listening: false };
    s.ready = migrate(pool);
    // If the database can't be reached yet, start over on the next request.
    s.ready.catch(() => {
      if (g.__communityPg === s) g.__communityPg = undefined;
      pool.end().catch(() => {});
    });
    g.__communityPg = s;
    listen(s);
  }
  return g.__communityPg;
}

/** Creates the tables and, the very first time, adds the demo's starting reports. */
async function migrate(pool: pg.Pool) {
  await tx(pool, async (c) => {
    // Only one instance migrates at a time.
    await c.query("SELECT pg_advisory_xact_lock(hashtext('ayeline:migrate'))");
    await c.query(SCHEMA);
    const fresh = await c.query("INSERT INTO community_meta (key, value) VALUES ('version', 1) ON CONFLICT DO NOTHING RETURNING value");
    if (fresh.rowCount) {
      for (const j of SEED_JOBS) {
        await c.query(
          `INSERT INTO community_jobs (id, service, location, neighborhood, note, token, status, staff, owner)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NULL) ON CONFLICT DO NOTHING`,
          [j.id, j.service, j.location, j.neighborhood, j.note, j.token, j.status, j.staff ?? null],
        );
      }
    }
  });
}

/** Holds one connection open to LISTEN, reconnecting if it drops. */
function listen(s: Shared, delay = 1000) {
  const client = new pg.Client(config());
  let retried = false;
  const retry = () => {
    if (retried) return;
    retried = true;
    s.listening = false;
    client.removeAllListeners();
    client.end().catch(() => {});
    setTimeout(() => g.__communityPg === s && listen(s, Math.min(delay * 2, 30_000)), delay);
  };
  client.on("error", retry);
  client.on("notification", (msg) => s.events.emit("change", Number(msg.payload)));
  client
    .connect()
    .then(() => client.query(`LISTEN ${CHANNEL}`))
    .then(() => {
      s.listening = true;
      delay = 1000;
    })
    // Some poolers (e.g. PgBouncer in transaction mode) don't allow LISTEN. Then each
    // instance only hears its own changes, and pages fall back to polling for the rest.
    .catch((e) => {
      console.warn("[community] LISTEN unavailable, live updates limited to this instance:", e.message);
      retry();
    });
}

async function tx<T>(pool: pg.Pool, fn: (c: pg.PoolClient) => Promise<T>): Promise<T> {
  const c = await pool.connect();
  try {
    await c.query("BEGIN");
    const result = await fn(c);
    await c.query("COMMIT");
    return result;
  } catch (e) {
    await c.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    c.release();
  }
}

/** Runs one change in a transaction, bumps the version and announces it once committed. */
async function change<T>(fn: (c: pg.PoolClient) => Promise<T>): Promise<T> {
  const s = shared();
  await s.ready;
  let version = 0;
  const result = await tx(s.pool, async (c) => {
    const r = await fn(c);
    const v = await c.query<{ value: number }>("UPDATE community_meta SET value = value + 1 WHERE key = 'version' RETURNING value");
    version = v.rows[0].value;
    // NOTIFY inside the transaction is only delivered if it commits.
    await c.query("SELECT pg_notify($1, $2)", [CHANNEL, String(version)]);
    return r;
  });
  if (!s.listening) s.events.emit("change", version);
  return result;
}

/** Serializes changes to one service's queue across every instance, until the transaction ends. */
const lockService = (c: pg.PoolClient, service: string) => c.query("SELECT pg_advisory_xact_lock(hashtext($1))", [`ayeline:queue:${service}`]);

interface JobRow {
  id: string;
  service: string;
  location: string;
  neighborhood: Neighborhood;
  note: string;
  token: number;
  status: JobStatus;
  staff: string | null;
  owner: string | null;
  has_photo: boolean;
}

export const pgStore: CommunityStore = {
  async stateFor(v) {
    const s = shared();
    await s.ready;
    const [jobs, rsvps, meta] = await Promise.all([
      s.pool.query<JobRow>(
        `SELECT id, service, location, neighborhood, note, token, status, staff, owner,
                EXISTS (SELECT 1 FROM community_photos p WHERE p.job_id = community_jobs.id) AS has_photo
         FROM community_jobs
         WHERE status IN ('queued', 'visiting') OR (owner = $1 AND created_at > now() - interval '30 days')
         ORDER BY service, token`,
        [v.device],
      ),
      s.pool.query<{ notice: string; total: number; mine: number }>(
        `SELECT notice_id AS notice, sum(people)::int AS total,
                coalesce(max(people) FILTER (WHERE device = $1), 0)::int AS mine
         FROM community_rsvps GROUP BY notice_id`,
        [v.device],
      ),
      s.pool.query<{ value: number }>("SELECT value FROM community_meta WHERE key = 'version'"),
    ]);
    return {
      version: meta.rows[0]?.value ?? 0,
      jobs: jobs.rows.map((r): Job => {
        const mine = r.owner === v.device;
        return {
          id: r.id,
          service: r.service,
          location: r.location,
          neighborhood: r.neighborhood,
          token: r.token,
          status: r.status,
          staff: r.staff ?? undefined,
          note: visibleNote(r.note, mine, v),
          mine,
          photo: r.has_photo && canSeePhoto(r.owner, v),
        };
      }),
      rsvps: rsvpTotals(rsvps.rows),
      staff: v.staff,
    };
  },

  book(v, r) {
    return change(async (c) => {
      await lockService(c, r.service.id);
      const open = await c.query<{ n: number }>(
        "SELECT count(*)::int AS n FROM community_jobs WHERE owner = $1 AND service = $2 AND status IN ('queued', 'visiting')",
        [v.device, r.service.id],
      );
      if (open.rows[0].n >= MAX_OPEN) throw tooMany(r.service);
      const next = await c.query<{ token: number }>("SELECT coalesce(max(token), 0) + 1 AS token FROM community_jobs WHERE service = $1", [r.service.id]);
      const id = randomUUID();
      const token = next.rows[0].token;
      await c.query(
        `INSERT INTO community_jobs (id, service, location, neighborhood, note, token, status, owner)
         VALUES ($1, $2, $3, $4, $5, $6, 'queued', $7)`,
        [id, r.service.id, r.location, r.neighborhood, r.note, token, v.device],
      );
      if (r.photo) await c.query("INSERT INTO community_photos (job_id, mime, data) VALUES ($1, $2, $3)", [id, r.photo.mime, r.photo.data]);
      return { id, token };
    });
  },

  cancel(v, id) {
    return change(async (c) => {
      const job = await c.query<JobRow>("SELECT owner, status FROM community_jobs WHERE id = $1 FOR UPDATE", [id]);
      const row = job.rows[0];
      if (!row || row.owner !== v.device) throw errors.notYours();
      if (row.status !== "queued") throw errors.crewOnIt();
      await c.query("UPDATE community_jobs SET status = 'cancelled' WHERE id = $1", [id]);
    });
  },

  async photo(v, id) {
    const s = shared();
    await s.ready;
    const res = await s.pool.query<Photo & { owner: string | null }>(
      "SELECT p.mime, p.data, j.owner FROM community_photos p JOIN community_jobs j ON j.id = p.job_id WHERE p.job_id = $1",
      [id],
    );
    const row = res.rows[0];
    return row && canSeePhoto(row.owner, v) ? { mime: row.mime, data: row.data } : null;
  },

  startNext(service) {
    return change(async (c) => {
      await lockService(c, service.id);
      const busy = await c.query<{ staff: string }>("SELECT staff FROM community_jobs WHERE service = $1 AND status = 'visiting'", [service.id]);
      const taken = new Set(busy.rows.map((r) => r.staff));
      const free = service.team.find((t) => !taken.has(t));
      if (!free) throw errors.allBusy();
      const next = await c.query<JobRow>(
        "SELECT id, location FROM community_jobs WHERE service = $1 AND status = 'queued' ORDER BY token LIMIT 1",
        [service.id],
      );
      if (!next.rows[0]) throw errors.nobody();
      await c.query("UPDATE community_jobs SET status = 'visiting', staff = $2 WHERE id = $1", [next.rows[0].id, free]);
      return { staff: free, location: next.rows[0].location };
    });
  },

  finish(id) {
    return change(async (c) => {
      const done = await c.query("UPDATE community_jobs SET status = 'done' WHERE id = $1 AND status = 'visiting'", [id]);
      if (!done.rowCount) throw errors.notInProgress();
    });
  },

  rsvp(v, noticeId, people) {
    return change(async (c) => {
      if (people) {
        await c.query(
          `INSERT INTO community_rsvps (notice_id, device, people) VALUES ($1, $2, $3)
           ON CONFLICT (notice_id, device) DO UPDATE SET people = EXCLUDED.people`,
          [noticeId, v.device, people],
        );
      } else {
        await c.query("DELETE FROM community_rsvps WHERE notice_id = $1 AND device = $2", [noticeId, v.device]);
      }
    });
  },

  onChange(listener) {
    const s = shared();
    s.events.on("change", listener);
    return () => void s.events.off("change", listener);
  },
};
