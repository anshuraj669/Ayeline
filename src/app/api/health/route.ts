import { stateFor } from "@/server/community";

export const dynamic = "force-dynamic";

/**
 * For the host's health check. Always 200 while the server is up, because the agenda pages
 * work without a database; `database` says whether the shared service desk is connected.
 */
export async function GET() {
  let database: "connected" | "not configured" | "unreachable" = "not configured";
  if (process.env.DATABASE_URL) {
    try {
      await stateFor({ device: "health-check", staff: false });
      database = "connected";
    } catch {
      database = "unreachable";
    }
  }
  return Response.json({ ok: true, database, staffPin: Boolean(process.env.STAFF_PIN) });
}
