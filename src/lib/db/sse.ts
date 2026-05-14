import { subscribe } from "./events";

// Wraps a topic into an SSE Response stream.
// Each published payload becomes an "data: <json>\n\n" event.
// Sends a keepalive comment every 25s to prevent proxies from closing.
export function createSseResponse(topics: string[]): Response {
  const encoder = new TextEncoder();
  const unsubs: Array<() => void> = [];

  const stream = new ReadableStream({
    start(controller) {
      const send = (event: string, payload: unknown) => {
        try {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`),
          );
        } catch {
          // controller already closed
        }
      };

      // initial hello
      send("ready", { topics });

      for (const topic of topics) {
        unsubs.push(
          subscribe(topic, (payload) => send("message", payload)),
        );
      }

      const keepalive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: keepalive\n\n`));
        } catch {
          clearInterval(keepalive);
        }
      }, 25_000);

      // attach cleanup to controller
      (controller as unknown as { _cleanup?: () => void })._cleanup = () => {
        clearInterval(keepalive);
        unsubs.forEach((u) => u());
      };
    },
    cancel(reason) {
      void reason;
      unsubs.forEach((u) => u());
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
