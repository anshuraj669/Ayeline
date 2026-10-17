import { timingSafeEqual } from "node:crypto";
import { CommunityError, type Viewer } from "./shared";

/** Request helpers shared by the community routes. */

// In development the PIN defaults to 1234 so the demo works out of the box.
// In production staff actions stay locked until STAFF_PIN is set.
export const PIN = process.env.STAFF_PIN ?? (process.env.NODE_ENV === "production" ? null : "1234");

function pinMatches(given: string | null) {
  if (!PIN || !given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(PIN);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function viewer(req: Request): Viewer {
  const device = req.headers.get("x-device-id") ?? "";
  if (!/^[\w-]{8,64}$/.test(device)) throw new CommunityError("Missing device id.");
  return { device, staff: pinMatches(req.headers.get("x-staff-pin")) };
}

export function fail(e: unknown) {
  if (e instanceof CommunityError) return Response.json({ error: e.message }, { status: e.status });
  console.error(e);
  return Response.json({ error: "Something went wrong. Please try again." }, { status: 500 });
}
