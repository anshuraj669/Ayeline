import { CommunityError, photo } from "@/server/community";
import { fail, viewer } from "@/server/community/http";

export const dynamic = "force-dynamic";

/** A report's photo, for the resident who sent it and for city staff. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const found = await photo(viewer(req), (await params).id);
    if (!found) throw new CommunityError("No photo.", 404);
    return new Response(new Uint8Array(found.data), {
      headers: {
        "content-type": found.mime,
        "cache-control": "private, no-store",
        "x-content-type-options": "nosniff",
        "content-security-policy": "default-src 'none'",
      },
    });
  } catch (e) {
    return fail(e);
  }
}
