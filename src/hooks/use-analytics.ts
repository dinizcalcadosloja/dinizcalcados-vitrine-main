import { useState, useEffect, useCallback } from "react";

export type Period = "today" | "yesterday" | "7d" | "14d" | "30d" | "60d";

export interface DayData {
  date: string;
  visitors: number;
  pageviews: number;
}

export interface AnalyticsData {
  visitors: number;
  pageviews: number;
  viewsPerVisit: number;
  daily: DayData[];
}

export function useAnalytics(storeId: string | undefined, period: Period) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!storeId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/analytics?storeId=${encodeURIComponent(storeId)}&period=${period}`,
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as AnalyticsData;
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }, [storeId, period]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, refetch: load };
}
