import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

interface AnalyticsKV {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
  list(options: { prefix: string; limit?: number }): Promise<{
    keys: { name: string }[];
    list_complete: boolean;
    cursor?: string;
  }>;
}

interface Env {
  ANALYTICS_KV?: AnalyticsKV;
}

// ── KV helpers (inlined to avoid Vite dev-server resolution issues) ───────────
interface DayAnalytics {
  visitors: number;
  pageviews: number;
}
function dayKey(storeId: string, date: string) {
  return `analytics:${storeId}:${date}`;
}
async function getDayData(kv: AnalyticsKV, storeId: string, date: string): Promise<DayAnalytics> {
  const raw = await kv.get(dayKey(storeId, date));
  if (!raw) return { visitors: 0, pageviews: 0 };
  try {
    return JSON.parse(raw) as DayAnalytics;
  } catch {
    return { visitors: 0, pageviews: 0 };
  }
}
async function incrementDay(
  kv: AnalyticsKV,
  storeId: string,
  date: string,
  isNewVisitor: boolean,
): Promise<void> {
  const cur = await getDayData(kv, storeId, date);
  await kv.put(
    dayKey(storeId, date),
    JSON.stringify({
      visitors: cur.visitors + (isNewVisitor ? 1 : 0),
      pageviews: cur.pageviews + 1,
    }),
  );
}
function getDateRange(period: string): string[] {
  const now = new Date();
  now.setUTCHours(0, 0, 0, 0);
  let days = 7;
  let startOffset = 0;
  if (period === "today") {
    days = 1;
  } else if (period === "yesterday") {
    days = 1;
    startOffset = 1;
  } else if (period === "14d") {
    days = 14;
  } else if (period === "30d") {
    days = 30;
  } else if (period === "60d") {
    days = 60;
  }
  const dates: string[] = [];
  for (let i = startOffset + days - 1; i >= startOffset; i--) {
    const d = new Date(now);
    d.setUTCDate(now.getUTCDate() - i);
    dates.push(d.toISOString().split("T")[0]);
  }
  return dates;
}
// ─────────────────────────────────────────────────────────────────────────────

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m as { default?: ServerEntry }).default ?? (m as unknown as ServerEntry),
    );
  }
  return serverEntryPromise;
}

function brandedErrorResponse(): Response {
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isCatastrophicSsrErrorBody(body: string, responseStatus: number): boolean {
  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    return false;
  }

  if (!payload || Array.isArray(payload) || typeof payload !== "object") {
    return false;
  }

  const fields = payload as Record<string, unknown>;
  const expectedKeys = new Set(["message", "status", "unhandled"]);
  if (!Object.keys(fields).every((key) => expectedKeys.has(key))) {
    return false;
  }

  return (
    fields.unhandled === true &&
    fields.message === "HTTPError" &&
    (fields.status === undefined || fields.status === responseStatus)
  );
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isCatastrophicSsrErrorBody(body, response.status)) {
    return response;
  }

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return brandedErrorResponse();
}

export default {
  async fetch(request: Request, env: Env, ctx: unknown) {
    const url = new URL(request.url);

    // ── Analytics API ──────────────────────────────────────────────────────────
    if (url.pathname === "/api/analytics" || url.pathname === "/api/analytics/products/top") {
      const kv = env.ANALYTICS_KV;
      if (!kv) {
        return new Response(JSON.stringify({ error: "KV not configured" }), {
          status: 503,
          headers: { "content-type": "application/json" },
        });
      }

      // ── GET /api/analytics/products/top ──────────────────────────────────────
      if (url.pathname === "/api/analytics/products/top" && request.method === "GET") {
        const storeId = url.searchParams.get("storeId");
        const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "3", 10), 20);
        if (!storeId) {
          return new Response(JSON.stringify({ error: "storeId required" }), {
            status: 400,
            headers: { "content-type": "application/json" },
          });
        }
        const prefix = `product:${storeId}:`;
        const list = await kv.list({ prefix, limit: 1000 });
        const viewsByProduct = new Map<string, number>();
        await Promise.all(
          list.keys.map(async ({ name }) => {
            // key: product:{storeId}:{productId}:{date}
            const parts = name.split(":");
            if (parts.length < 4) return;
            const productId = parts[2];
            const raw = await kv.get(name);
            if (!raw) return;
            try {
              const { views } = JSON.parse(raw) as { views: number };
              viewsByProduct.set(productId, (viewsByProduct.get(productId) ?? 0) + views);
            } catch {
              /* ignore */
            }
          }),
        );
        const sorted = [...viewsByProduct.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, limit)
          .map(([productId, views]) => ({ productId, views }));
        return new Response(JSON.stringify(sorted), {
          headers: { "content-type": "application/json" },
        });
      }

      if (request.method === "POST") {
        try {
          const body = (await request.json()) as {
            storeId?: string;
            isNewVisitor?: boolean;
            productId?: string;
            type?: string;
          };
          const { storeId, isNewVisitor = false, productId, type } = body;
          if (!storeId) {
            return new Response(JSON.stringify({ error: "storeId required" }), {
              status: 400,
              headers: { "content-type": "application/json" },
            });
          }

          // Product view tracking
          if (type === "product_view" && productId) {
            const today = new Date().toISOString().split("T")[0];
            const key = `product:${storeId}:${productId}:${today}`;
            const raw = await kv.get(key);
            const cur = raw ? (JSON.parse(raw) as { views: number }) : { views: 0 };
            await kv.put(key, JSON.stringify({ views: cur.views + 1 }));
            return new Response(JSON.stringify({ ok: true }), {
              headers: { "content-type": "application/json" },
            });
          }

          // Store visit tracking
          const today = new Date().toISOString().split("T")[0];
          await incrementDay(kv, storeId, today, isNewVisitor);
          return new Response(JSON.stringify({ ok: true }), {
            headers: { "content-type": "application/json" },
          });
        } catch {
          return new Response(JSON.stringify({ error: "Bad request" }), {
            status: 400,
            headers: { "content-type": "application/json" },
          });
        }
      }

      if (request.method === "GET") {
        const storeId = url.searchParams.get("storeId");
        const period = url.searchParams.get("period") ?? "7d";
        if (!storeId) {
          return new Response(JSON.stringify({ error: "storeId required" }), {
            status: 400,
            headers: { "content-type": "application/json" },
          });
        }
        const dates = getDateRange(period);
        const dailyRaw = await Promise.all(dates.map((d) => getDayData(kv, storeId, d)));
        const daily = dates.map((date, i) => ({ date, ...dailyRaw[i] }));
        const visitors = daily.reduce((s, d) => s + d.visitors, 0);
        const pageviews = daily.reduce((s, d) => s + d.pageviews, 0);
        const viewsPerVisit = visitors > 0 ? Math.round((pageviews / visitors) * 10) / 10 : 0;
        return new Response(JSON.stringify({ visitors, pageviews, viewsPerVisit, daily }), {
          headers: { "content-type": "application/json" },
        });
      }

      return new Response("Method not allowed", { status: 405 });
    }
    // ── End Analytics API ──────────────────────────────────────────────────────

    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return brandedErrorResponse();
    }
  },
};
