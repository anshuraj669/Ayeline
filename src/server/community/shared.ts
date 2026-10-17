import { NEIGHBORHOODS, NOTICES, SERVICES, type Job, type Neighborhood, type Service } from "@/lib/data";

/** The rules every store follows, so the file and Postgres stores behave the same. */

export interface Viewer {
  device: string;
  staff: boolean;
}

/** What one viewer is allowed to see. */
export interface CommunityState {
  version: number;
  jobs: Job[];
  rsvps: Record<string, { total: number; mine: number }>;
  staff: boolean;
}

export interface Photo {
  mime: "image/jpeg" | "image/png" | "image/webp";
  data: Buffer;
}

export interface Report {
  service: Service;
  location: string;
  neighborhood: Neighborhood;
  note: string;
  photo?: Photo;
}

/** Storage for service requests and RSVPs. Rules and permission checks happen before these are called. */
export interface CommunityStore {
  stateFor(v: Viewer): Promise<CommunityState>;
  /** Must refuse past MAX_OPEN open reports per device per service, and number requests without gaps or repeats. */
  book(v: Viewer, r: Report): Promise<{ id: string; token: number }>;
  cancel(v: Viewer, id: string): Promise<void>;
  /** A report's photo, or null if there isn't one or this viewer may not see it. */
  photo(v: Viewer, id: string): Promise<Photo | null>;
  startNext(service: Service): Promise<{ staff: string; location: string }>;
  finish(id: string): Promise<void>;
  rsvp(v: Viewer, noticeId: string, people: number): Promise<void>;
  onChange(listener: (version: number) => void): () => void;
}

export class CommunityError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

/** Most open reports one device can have for a single kind of problem, to keep the queue honest. */
export const MAX_OPEN = 3;

export const tooMany = (service: Service) =>
  new CommunityError(`You already have ${MAX_OPEN} open ${service.label.toLowerCase()} reports.`, 429);

export function parseReport(input: { service: string; location: string; neighborhood: string; note: string; photo: string }): Report {
  const service = SERVICES.find((s) => s.id === input.service);
  if (!service) throw new CommunityError("Unknown service.");
  if (!NEIGHBORHOODS.includes(input.neighborhood as Neighborhood)) throw new CommunityError("Pick a neighborhood.");
  const location = input.location.trim().slice(0, 80);
  if (location.length < 3) throw new CommunityError("Tell the crew where to go.");
  return {
    service,
    location,
    neighborhood: input.neighborhood as Neighborhood,
    note: input.note.trim().slice(0, 300),
    photo: parsePhoto(input.photo),
  };
}

/** Largest photo accepted. The app shrinks photos to well under this before sending. */
export const MAX_PHOTO_BYTES = 1_500_000;

// What each image type's file starts with, so a renamed file can't pass as a photo.
const SIGNATURES: [Photo["mime"], (b: Buffer) => boolean][] = [
  ["image/jpeg", (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff],
  ["image/png", (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))],
  ["image/webp", (b) => b.toString("latin1", 0, 4) === "RIFF" && b.toString("latin1", 8, 12) === "WEBP"],
];

/** An optional photo sent as a data URL. Empty means no photo. */
export function parsePhoto(dataUrl: string): Photo | undefined {
  if (!dataUrl) return undefined;
  const m = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/.exec(dataUrl);
  if (!m) throw new CommunityError("Photos must be JPG, PNG or WebP.");
  const data = Buffer.from(m[2], "base64");
  if (data.length > MAX_PHOTO_BYTES) throw new CommunityError("That photo is too large.", 413);
  const mime = m[1] as Photo["mime"];
  if (!SIGNATURES.some(([type, matches]) => type === mime && matches(data))) throw new CommunityError("That file isn't a photo.");
  return { mime, data };
}

export function parseService(id: string): Service {
  const service = SERVICES.find((s) => s.id === id);
  if (!service) throw new CommunityError("Unknown service.");
  return service;
}

export function checkRsvp(noticeId: string, people: number) {
  const notice = NOTICES.find((n) => n.id === noticeId);
  if (!notice || notice.going === 0) throw new CommunityError("You can't RSVP to that notice.");
  if (!Number.isInteger(people) || people < 0 || people > 10) throw new CommunityError("Between 0 and 10 people.");
}

/** Photos follow the same rule as notes. */
export const canSeePhoto = (ownerDevice: string | null, v: Viewer) => ownerDevice === v.device || v.staff;

/** Hides other people's notes: only the resident who wrote one and city staff see it. */
export function visibleNote(note: string, mine: boolean, v: Viewer) {
  return mine || v.staff ? note : "";
}

/** Adds the demo's starting headcounts to the RSVPs in the store. */
export function rsvpTotals(rows: { notice: string; total: number; mine: number }[]): CommunityState["rsvps"] {
  const out: CommunityState["rsvps"] = {};
  for (const n of NOTICES) out[n.id] = { total: n.going, mine: 0 };
  for (const r of rows) {
    if (!out[r.notice]) continue;
    out[r.notice].total += r.total;
    out[r.notice].mine = r.mine;
  }
  return out;
}

/** Errors thrown inside a store, re-exported so routes can tell them apart from crashes. */
export const errors = {
  notYours: () => new CommunityError("That report isn't yours to withdraw.", 403),
  crewOnIt: () => new CommunityError("A crew is already on it.", 409),
  allBusy: () => new CommunityError("Every crew for that service is already out on a job.", 409),
  nobody: () => new CommunityError("Nobody is waiting.", 409),
  notInProgress: () => new CommunityError("That job isn't in progress.", 409),
};
