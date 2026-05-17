// Server-side KV helpers — used only inside Cloudflare Workers (server.ts)

export interface AnalyticsKV {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
}

export interface DayAnalytics {
  visitors: number;
  pageviews: number;
}

export function dayKey(storeId: string, date: string): string {
  return `analytics:${storeId}:${date}`;
}

export async function getDayData(
  kv: AnalyticsKV,
  storeId: string,
  date: string,
): Promise<DayAnalytics> {
  const raw = await kv.get(dayKey(storeId, date));
  if (!raw) return { visitors: 0, pageviews: 0 };
  try {
    return JSON.parse(raw) as DayAnalytics;
  } catch {
    return { visitors: 0, pageviews: 0 };
  }
}

export async function incrementDay(
  kv: AnalyticsKV,
  storeId: string,
  date: string,
  isNewVisitor: boolean,
): Promise<void> {
  const current = await getDayData(kv, storeId, date);
  const updated: DayAnalytics = {
    visitors: current.visitors + (isNewVisitor ? 1 : 0),
    pageviews: current.pageviews + 1,
  };
  await kv.put(dayKey(storeId, date), JSON.stringify(updated));
}

export function getDateRange(period: string): string[] {
  const now = new Date();
  now.setUTCHours(0, 0, 0, 0);

  let days: number;
  let startOffset = 0;

  switch (period) {
    case "today":
      days = 1;
      break;
    case "yesterday":
      days = 1;
      startOffset = 1;
      break;
    case "14d":
      days = 14;
      break;
    case "30d":
      days = 30;
      break;
    case "60d":
      days = 60;
      break;
    default: // "7d"
      days = 7;
  }

  const dates: string[] = [];
  for (let i = startOffset + days - 1; i >= startOffset; i--) {
    const d = new Date(now);
    d.setUTCDate(now.getUTCDate() - i);
    dates.push(d.toISOString().split("T")[0]);
  }
  return dates;
}
