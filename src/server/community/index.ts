import { fileStore } from "./fileStore";
import { pgStore } from "./pgStore";
import { checkRsvp, CommunityError, parseReport, parseService, type Viewer } from "./shared";

export { CommunityError, MAX_PHOTO_BYTES, type Viewer } from "./shared";

/**
 * The community API the routes call. Permission checks and input rules live here; the
 * store only saves. Postgres is used whenever DATABASE_URL is set. Without it, local
 * development falls back to a JSON file, and production refuses to start the feature,
 * because a file wouldn't survive on most hosts.
 */
function store() {
  if (process.env.DATABASE_URL) return pgStore;
  if (process.env.NODE_ENV === "production") {
    throw new CommunityError("The service desk isn't connected to a database yet (DATABASE_URL).", 503);
  }
  return fileStore;
}

export const stateFor = (v: Viewer) => store().stateFor(v);

export const onChange = (listener: (version: number) => void) => store().onChange(listener);

export const book = (v: Viewer, input: { service: string; location: string; neighborhood: string; note: string; photo: string }) =>
  store().book(v, parseReport(input));

export const cancel = (v: Viewer, id: string) => store().cancel(v, id);

export const photo = (v: Viewer, id: string) => store().photo(v, id);

function staffOnly(v: Viewer) {
  if (!v.staff) throw new CommunityError("Staff PIN required.", 401);
}

export function startNext(v: Viewer, serviceId: string) {
  staffOnly(v);
  return store().startNext(parseService(serviceId));
}

export function finish(v: Viewer, id: string) {
  staffOnly(v);
  return store().finish(id);
}

export function rsvp(v: Viewer, noticeId: string, people: number) {
  checkRsvp(noticeId, people);
  return store().rsvp(v, noticeId, people);
}
