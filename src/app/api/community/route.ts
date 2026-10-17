import { book, cancel, CommunityError, finish, MAX_PHOTO_BYTES, rsvp, startNext, stateFor } from "@/server/community";
import { fail, PIN, viewer } from "@/server/community/http";

export const dynamic = "force-dynamic";

/** Everything this resident (or staff member) should see right now. */
export async function GET(req: Request) {
  try {
    return Response.json(await stateFor(viewer(req)));
  } catch (e) {
    return fail(e);
  }
}

type Action =
  | { type: "book"; service: string; location: string; neighborhood: string; note?: string; photo?: string }
  | { type: "cancel"; id: string }
  | { type: "start"; service: string }
  | { type: "finish"; id: string }
  | { type: "rsvp"; notice: string; people: number }
  | { type: "staff-login" };

/** Makes one change, then answers with the fresh state, plus a result for some actions. */
export async function POST(req: Request) {
  try {
    const v = viewer(req);
    // Room for one photo as base64, plus the rest of the form.
    if (Number(req.headers.get("content-length")) > MAX_PHOTO_BYTES * 1.4 + 10_000) throw new CommunityError("That photo is too large.", 413);
    const a = (await req.json()) as Action;
    const str = (x: unknown) => (typeof x === "string" ? x : "");
    let result: unknown = null;
    switch (a.type) {
      case "book":
        result = await book(v, {
          service: str(a.service),
          location: str(a.location),
          neighborhood: str(a.neighborhood),
          note: str(a.note),
          photo: str(a.photo),
        });
        break;
      case "cancel":
        await cancel(v, str(a.id));
        break;
      case "start":
        result = await startNext(v, str(a.service));
        break;
      case "finish":
        await finish(v, str(a.id));
        break;
      case "rsvp":
        await rsvp(v, str(a.notice), Number(a.people));
        break;
      case "staff-login":
        if (!v.staff) throw new CommunityError(PIN ? "That PIN isn't right." : "Staff access isn't set up yet (STAFF_PIN).", 401);
        break;
      default:
        throw new CommunityError("Unknown action.");
    }
    return Response.json({ ...(await stateFor(v)), result });
  } catch (e) {
    return fail(e);
  }
}
