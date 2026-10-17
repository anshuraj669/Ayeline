import { CommunityError, onChange } from "@/server/community";

export const dynamic = "force-dynamic";

/** Server-sent events: tells every open page when something changed, so it can refetch. */
export function GET(req: Request) {
  // Check the store is reachable before opening a stream that would just break.
  try {
    onChange(() => {})();
  } catch (e) {
    const status = e instanceof CommunityError ? e.status : 500;
    return new Response(e instanceof Error ? e.message : "Unavailable", { status });
  }
  const enc = new TextEncoder();
  let cleanup = () => {};
  const stream = new ReadableStream({
    start(controller) {
      const send = (chunk: string) => {
        try {
          controller.enqueue(enc.encode(chunk));
        } catch {
          cleanup();
        }
      };
      send("retry: 3000\n\n");
      const off = onChange((version) => send(`data: ${version}\n\n`));
      // Keeps proxies from closing a quiet connection.
      const ping = setInterval(() => send(": ping\n\n"), 25_000);
      cleanup = () => {
        off();
        clearInterval(ping);
      };
      req.signal.addEventListener("abort", () => {
        cleanup();
        try {
          controller.close();
        } catch {}
      });
    },
    cancel() {
      cleanup();
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
