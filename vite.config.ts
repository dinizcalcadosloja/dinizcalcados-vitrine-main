// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import type { Plugin } from "vite";
import type { IncomingMessage, ServerResponse } from "node:http";

// In-memory KV simulation for local dev.
// Data is lost on server restart — that's fine for development.
function analyticsDevPlugin(): Plugin {
  const kv = new Map<string, string>();

  function dayKey(storeId: string, date: string) {
    return `analytics:${storeId}:${date}`;
  }
  function getDayData(storeId: string, date: string) {
    const raw = kv.get(dayKey(storeId, date));
    if (!raw) return { visitors: 0, pageviews: 0 };
    try {
      return JSON.parse(raw) as { visitors: number; pageviews: number };
    } catch {
      return { visitors: 0, pageviews: 0 };
    }
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

  function readBody(req: IncomingMessage): Promise<string> {
    return new Promise((resolve) => {
      let body = "";
      req.on("data", (chunk: Buffer) => {
        body += chunk.toString();
      });
      req.on("end", () => resolve(body));
    });
  }

  return {
    name: "analytics-dev-api",
    configureServer(server) {
      server.middlewares.use(async (req, res: ServerResponse, next) => {
        const url = new URL(req.url ?? "/", "http://localhost");
        if (!url.pathname.startsWith("/api/analytics")) return next();

        res.setHeader("content-type", "application/json");
        res.setHeader("access-control-allow-origin", "*");

        // ── GET /api/analytics/products/top ────────────────────────────────
        if (url.pathname === "/api/analytics/products/top" && req.method === "GET") {
          const storeId = url.searchParams.get("storeId");
          const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "3", 10), 20);
          if (!storeId) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: "storeId required" }));
            return;
          }
          const prefix = `product:${storeId}:`;
          const viewsByProduct = new Map<string, number>();
          for (const [key, val] of kv.entries()) {
            if (!key.startsWith(prefix)) continue;
            const parts = key.split(":");
            if (parts.length < 4) continue;
            const productId = parts[2];
            try {
              const { views } = JSON.parse(val) as { views: number };
              viewsByProduct.set(productId, (viewsByProduct.get(productId) ?? 0) + views);
            } catch {
              /* ignore */
            }
          }
          const sorted = [...viewsByProduct.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([productId, views]) => ({ productId, views }));
          res.statusCode = 200;
          res.end(JSON.stringify(sorted));
          return;
        }

        // ── /api/analytics ──────────────────────────────────────────────────
        if (url.pathname !== "/api/analytics") return next();

        if (req.method === "POST") {
          const body = await readBody(req);
          const {
            storeId,
            isNewVisitor = false,
            productId,
            type,
          } = JSON.parse(body || "{}") as {
            storeId?: string;
            isNewVisitor?: boolean;
            productId?: string;
            type?: string;
          };

          if (!storeId) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: "storeId required" }));
            return;
          }

          // Product view tracking
          if (type === "product_view" && productId) {
            const today = new Date().toISOString().split("T")[0];
            const key = `product:${storeId}:${productId}:${today}`;
            const raw = kv.get(key);
            const cur = raw ? (JSON.parse(raw) as { views: number }) : { views: 0 };
            kv.set(key, JSON.stringify({ views: cur.views + 1 }));
            res.statusCode = 200;
            res.end(JSON.stringify({ ok: true }));
            return;
          }

          // Store visit tracking
          if (storeId) {
            const today = new Date().toISOString().split("T")[0];
            const cur = getDayData(storeId, today);
            kv.set(
              dayKey(storeId, today),
              JSON.stringify({
                visitors: cur.visitors + (isNewVisitor ? 1 : 0),
                pageviews: cur.pageviews + 1,
              }),
            );
          }
          res.statusCode = 200;
          res.end(JSON.stringify({ ok: true }));
          return;
        }

        // GET /api/analytics
        const storeId = url.searchParams.get("storeId");
        const period = url.searchParams.get("period") ?? "7d";
        if (!storeId) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: "storeId required" }));
          return;
        }
        const dates = getDateRange(period);
        const daily = dates.map((date) => ({ date, ...getDayData(storeId, date) }));
        const visitors = daily.reduce((s, d) => s + d.visitors, 0);
        const pageviews = daily.reduce((s, d) => s + d.pageviews, 0);
        const viewsPerVisit = visitors > 0 ? Math.round((pageviews / visitors) * 10) / 10 : 0;
        res.statusCode = 200;
        res.end(JSON.stringify({ visitors, pageviews, viewsPerVisit, daily }));
      });
    },
  };
}

// Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
// @cloudflare/vite-plugin builds from this — wrangler.jsonc main alone is insufficient.
export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  vite: {
    plugins: [analyticsDevPlugin()],
  },
});
