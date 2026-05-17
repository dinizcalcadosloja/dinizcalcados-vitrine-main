import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Users, Eye, BarChart2, RefreshCw, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { type Period, type DayData, useAnalytics } from "@/hooks/use-analytics";
import { AnalyticsTooltip } from "@/components/analytics/AnalyticsTooltip";

// ─── Period Filter ─────────────────────────────────────────────────────────────

const PERIODS: { value: Period; label: string }[] = [
  { value: "today", label: "Hoje" },
  { value: "yesterday", label: "Ontem" },
  { value: "7d", label: "7 dias" },
  { value: "14d", label: "14 dias" },
  { value: "30d", label: "30 dias" },
  { value: "60d", label: "60 dias" },
];

function PeriodFilter({ value, onChange }: { value: Period; onChange: (p: Period) => void }) {
  return (
    <div className="flex items-center gap-1 bg-muted rounded-xl p-1 border border-border/60">
      {PERIODS.map((p) => (
        <button
          key={p.value}
          onClick={() => onChange(p.value)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            value === p.value
              ? "bg-background text-foreground shadow-sm border border-border/60"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  icon: Icon,
  iconClass,
  loading,
  tooltip,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  iconClass: string;
  loading: boolean;
  tooltip?: string;
}) {
  return (
    <Card className="border-border/60 shadow-sm overflow-hidden group hover:border-primary/30 transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${iconClass}`}>
            <Icon className="h-5 w-5" />
          </div>
          <TrendingUp className="h-4 w-4 text-emerald-500" />
        </div>
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            {tooltip && <AnalyticsTooltip text={tooltip} />}
          </div>
          {loading ? (
            <div className="h-8 w-20 bg-muted rounded-lg animate-pulse mt-1" />
          ) : (
            <h3 className="text-2xl font-bold tracking-tight">{value}</h3>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Chart ────────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  const [, month, day] = dateStr.split("-");
  return `${day}/${month}`;
}

function AnalyticsLineChart({ daily, loading }: { daily: DayData[]; loading: boolean }) {
  if (loading) {
    return <div className="h-64 bg-muted/40 rounded-xl animate-pulse" />;
  }

  const chartData = daily.map((d) => ({
    date: formatDate(d.date),
    Visitantes: d.visitors,
    Pageviews: d.pageviews,
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            background: "hsl(var(--background))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "12px",
            fontSize: 13,
            color: "hsl(var(--foreground))",
          }}
          labelStyle={{ color: "hsl(var(--muted-foreground))", marginBottom: 4 }}
          cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1 }}
        />
        <Line
          type="monotone"
          dataKey="Visitantes"
          stroke="#10b981"
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 5, fill: "#10b981", strokeWidth: 2 }}
        />
        <Line
          type="monotone"
          dataKey="Pageviews"
          stroke="#6366f1"
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 5, fill: "#6366f1", strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center">
        <TrendingUp className="h-8 w-8 text-muted-foreground" />
      </div>
      <div className="text-center">
        <p className="text-foreground font-semibold">Nenhum dado ainda</p>
        <p className="text-muted-foreground text-sm mt-1">
          As visitas aparecerão aqui conforme os clientes acessarem a loja.
        </p>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export function AnalyticsDashboard({ storeId }: { storeId: string }) {
  const [period, setPeriod] = useState<Period>("7d");
  const { data, loading, error, refetch } = useAnalytics(storeId, period);

  const hasData = data && (data.visitors > 0 || data.pageviews > 0);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Analytics</h1>
          <p className="text-muted-foreground text-sm mt-1">Monitoramento de visitas da sua loja</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={loading}
            className="h-9 w-9 rounded-xl"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <PeriodFilter value={period} onChange={setPeriod} />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-xl px-5 py-4 text-sm">
          <strong>Erro ao carregar analytics:</strong> {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard
          label="Visitantes Únicos"
          value={data?.visitors ?? 0}
          icon={Users}
          iconClass="bg-emerald-500/10 text-emerald-600"
          loading={loading}
          tooltip="Quantidade de pessoas únicas que visitaram sua vitrine."
        />
        <KpiCard
          label="Pageviews"
          value={data?.pageviews ?? 0}
          icon={Eye}
          iconClass="bg-indigo-500/10 text-indigo-600"
          loading={loading}
          tooltip="Quantidade total de páginas visualizadas pelos visitantes."
        />
        <KpiCard
          label="Views por Visita"
          value={data?.viewsPerVisit ?? 0}
          icon={BarChart2}
          iconClass="bg-amber-500/10 text-amber-600"
          loading={loading}
          tooltip="Média de páginas visualizadas por visitante."
        />
      </div>

      {/* Chart */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold">Visitas diárias</CardTitle>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />
                Visitantes
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-indigo-500" />
                Pageviews
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!loading && !hasData ? (
            <EmptyState />
          ) : (
            <AnalyticsLineChart daily={data?.daily ?? []} loading={loading} />
          )}
        </CardContent>
      </Card>

      {/* Daily table */}
      {hasData && (
        <Card className="border-border/60 shadow-sm overflow-hidden">
          <CardHeader className="border-b border-border/40 pb-4">
            <CardTitle className="text-base font-bold">Detalhamento por dia</CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/40 bg-muted/30">
                  <th className="px-6 py-3 text-left text-muted-foreground font-semibold">Data</th>
                  <th className="px-6 py-3 text-right text-muted-foreground font-semibold">
                    Visitantes
                  </th>
                  <th className="px-6 py-3 text-right text-muted-foreground font-semibold">
                    Pageviews
                  </th>
                  <th className="px-6 py-3 text-right text-muted-foreground font-semibold">
                    Ratio
                  </th>
                </tr>
              </thead>
              <tbody>
                {[...(data?.daily ?? [])].reverse().map((d) => {
                  const ratio = d.visitors > 0 ? (d.pageviews / d.visitors).toFixed(1) : "—";
                  return (
                    <tr
                      key={d.date}
                      className="border-b border-border/30 hover:bg-muted/20 transition-colors"
                    >
                      <td className="px-6 py-3 font-medium text-foreground">
                        {new Date(d.date + "T12:00:00").toLocaleDateString("pt-BR", {
                          weekday: "short",
                          day: "2-digit",
                          month: "short",
                        })}
                      </td>
                      <td className="px-6 py-3 text-right text-emerald-600 font-bold">
                        {d.visitors.toLocaleString("pt-BR")}
                      </td>
                      <td className="px-6 py-3 text-right text-indigo-600 font-bold">
                        {d.pageviews.toLocaleString("pt-BR")}
                      </td>
                      <td className="px-6 py-3 text-right text-muted-foreground">{ratio}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <p className="text-center text-muted-foreground text-xs pb-4">
        Dados armazenados no Cloudflare KV · Atualização em tempo real
      </p>
    </div>
  );
}
