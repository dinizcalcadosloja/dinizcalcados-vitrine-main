import { createAPIFileRoute } from "@tanstack/react-start/api";

// This route handles /api/analytics in development (Vite dev server).
// In production (Cloudflare Worker), server.ts intercepts the request first
// and this route is never reached.
export const APIRoute = createAPIFileRoute("/api/analytics")({
  GET: async () => {
    return new Response(JSON.stringify({ error: "KV not configured" }), {
      status: 503,
      headers: { "content-type": "application/json" },
    });
  },
  POST: async () => {
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  },
});
