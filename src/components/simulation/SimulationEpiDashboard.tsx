"use client";

import { useState, useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, ResponsiveContainer,
  ReferenceLine, ReferenceDot, Tooltip,
} from "recharts";
import { Sparkles, X, AlertCircle, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { simulationService } from "@/services/simulation.service";
import { SimulationData, Simulation } from "@/types/simulation";
import { InterventionSimulation } from "@/services/intervention.service";
import { toast } from "sonner";

interface SimulationEpiDashboardProps {
  simulation: Simulation;
  interventions?: InterventionSimulation[];
}

function computeNewCases(data: SimulationData) {
  return data.days.map((day, i) => {
    if (i === 0) return { day, new_cases: Math.round(data.infected[0]) };
    const prevTotal = data.infected[i - 1] + data.recovered[i - 1];
    const curTotal = data.infected[i] + data.recovered[i];
    return { day, new_cases: Math.max(0, Math.round(curTotal - prevTotal)) };
  });
}

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toLocaleString();
}

const COMPARTMENT_COLORS: Record<string, string> = {
  Susceptible: "#3b82f6",
  Infected: "#ef4444",
  Recovered: "#22c55e",
  Exposed: "#f59e0b",
};

const INTERVENTION_DOT_COLORS = [
  "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#06b6d4", "#84cc16",
];

export function SimulationEpiDashboard({ simulation, interventions = [] }: SimulationEpiDashboardProps) {
  const { stats, parameters, data, id } = simulation;

  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setError(null);
    try {
      const res = await simulationService.analyze(id);
      if (res.success && res.data) {
        setAnalysis(res.data.analysis);
        setShowAnalysis(true);
      } else {
        setError(res.message || "Failed to get AI analysis");
        toast.error(res.message || "Failed to get AI analysis");
      }
    } catch {
      setError("Failed to connect to AI service");
      toast.error("Failed to connect to AI service");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const newCasesChart = useMemo(() => computeNewCases(data), [data]);
  const peakIdx = data.days.indexOf(stats.peak_day);
  const todayIdx = peakIdx >= 0 ? peakIdx : data.days.length - 1;
  const todayDay = data.days[todayIdx];

  const activeCasesToday = Math.round(data.infected[todayIdx]);
  const yesterdayCases = todayIdx > 0 ? Math.round(data.infected[todayIdx - 1]) : activeCasesToday;
  const pctChange = yesterdayCases > 0
    ? (((activeCasesToday - yesterdayCases) / yesterdayCases) * 100).toFixed(1)
    : "0.0";
  const isGrowing = Number(pctChange) >= 0;

  const peakNewCases = Math.max(...newCasesChart.map(d => d.new_cases));

  const totalPct = ((stats.total_infected / parameters.population) * 100).toFixed(1);

  const compartments = useMemo(() => {
    const s = Math.round(data.susceptible[todayIdx]);
    const i = Math.round(data.infected[todayIdx]);
    const r = Math.round(data.recovered[todayIdx]);
    const pop = parameters.population;
    const items: { label: string; value: number; pct: string }[] = [
      { label: "Susceptible", value: s, pct: ((s / pop) * 100).toFixed(1) },
      { label: "Infected", value: i, pct: ((i / pop) * 100).toFixed(1) },
      { label: "Recovered", value: r, pct: ((r / pop) * 100).toFixed(1) },
    ];
    if (data.exposed) {
      const e = Math.round(data.exposed[todayIdx]);
      items.splice(1, 0, { label: "Exposed", value: e, pct: ((e / pop) * 100).toFixed(1) });
    }
    return items;
  }, [data, todayIdx, parameters.population]);

  return (
    <div className="space-y-3">
      {/* Section label */}
      <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.2em] pb-1">
        KEY METRICS
      </p>

      {/* Row 1 — 4 metric cards */}
      <div className="grid grid-cols-4 gap-3">
        <MetricCard
          label="Active Cases"
          value={formatCompact(activeCasesToday)}
          subtitle={
            <span className={isGrowing ? "text-rose-500" : "text-green-500"}>
              {isGrowing ? "↑" : "↓"} {Math.abs(Number(pctChange))}% from peak
            </span>
          }
          accent="text-rose-500"
        />
        <MetricCard
          label={<span>R<tspan fontSize="10" dy="2">t</tspan></span>}
          value={stats.r0.toFixed(2)}
          subtitle={stats.r0 > 1 ? "Above threshold" : "Under control"}
          accent="text-amber-500"
        />
        <MetricCard
          label="Peak Day"
          value={`Day ${stats.peak_day}`}
          subtitle={`${formatCompact(stats.peak_infected)} at peak`}
          accent="text-sky-500"
        />
        <MetricCard
          label="Total Infected"
          value={formatCompact(stats.total_infected)}
          subtitle={`${totalPct}% of population`}
          accent="text-violet-500"
        />
      </div>

      {/* Row 2 — left wide / right narrow */}
      <div className="grid grid-cols-3 gap-3">
        {/* Epi curve card */}
        <div className="col-span-2 p-5 border border-border rounded-xl bg-card space-y-4">
          <p className="text-[13px] font-medium text-foreground/80">
            Epi curve &mdash; daily new cases
          </p>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={newCasesChart} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                <defs>
                  <linearGradient id="fillNewCases" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="day"
                  ticks={[data.days[0], data.days[data.days.length - 1]]}
                  tickFormatter={(v) => `Day ${v}`}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                  tickLine={false}
                />
                <YAxis hide />
                <Tooltip
                  formatter={(value) => [typeof value === "number" ? value.toLocaleString() : String(value), "New cases"]}
                  labelFormatter={(label) => `Day ${label}`}
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "4px",
                    fontSize: "11px",
                    color: "hsl(var(--foreground))",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="new_cases"
                  stroke="#ef4444"
                  strokeWidth={2}
                  fill="url(#fillNewCases)"
                  dot={false}
                  activeDot={{ r: 3 }}
                />
                <ReferenceDot
                  x={stats.peak_day}
                  y={peakNewCases}
                  r={4}
                  fill="#ef4444"
                  stroke="#fff"
                  strokeWidth={2}
                />
                <ReferenceLine
                  x={todayDay}
                  stroke="hsl(var(--muted-foreground))"
                  strokeDasharray="4 3"
                  strokeWidth={1}
                  label={{
                    value: "Today",
                    position: "top",
                    fill: "hsl(var(--muted-foreground))",
                    fontSize: 10,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Active interventions card */}
        <div className="col-span-1 p-5 border border-border rounded-xl bg-card space-y-4">
          <p className="text-[13px] font-medium text-foreground/80">
            Active interventions
          </p>
          <div className="space-y-1">
            {interventions.length === 0 && (
              <p className="text-xs text-muted-foreground py-6 text-center">
                No interventions applied
              </p>
            )}
            {interventions.slice(0, 8).map((int, idx) => {
              const firstEvent = int.events?.[0];
              const isLast = idx === Math.min(interventions.length - 1, 7);
              return (
                <div
                  key={int.id}
                  className={`flex items-center gap-3 py-2.5 border-b border-border/40 ${isLast && interventions.length > 8 ? "opacity-40" : ""}`}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: INTERVENTION_DOT_COLORS[idx % INTERVENTION_DOT_COLORS.length] }}
                  />
                  <span className="text-xs text-foreground/80 truncate flex-1">
                    {int.name}
                  </span>
                  <span className="text-[11px] text-muted-foreground tabular-nums shrink-0">
                    {firstEvent ? `Day ${firstEvent.day}` : ""}
                  </span>
                </div>
              );
            })}
            {interventions.length > 8 && (
              <p className="text-[11px] text-muted-foreground text-center pt-2">
                +{interventions.length - 8} more
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Row 3 — 2 equal columns */}
      <div className="grid grid-cols-2 gap-3">
        {/* Compartment breakdown */}
        <div className="p-5 border border-border rounded-xl bg-card space-y-4">
          <p className="text-[13px] font-medium text-foreground/80">
            Compartment breakdown
          </p>
          <div className="space-y-3">
            {compartments.map((comp) => {
              const maxVal = Math.max(...compartments.map(c => c.value));
              const barPct = maxVal > 0 ? (comp.value / maxVal) * 100 : 0;
              return (
                <div key={comp.label} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-20 shrink-0">
                    {comp.label}
                  </span>
                  <div className="flex-1 h-2 bg-muted/30 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.max(barPct, 0.5)}%`,
                        backgroundColor: COMPARTMENT_COLORS[comp.label] || "#6b7280",
                      }}
                    />
                  </div>
                  <span className="text-xs font-medium tabular-nums text-foreground/80 w-20 text-right shrink-0">
                    {formatCompact(comp.value)} ({comp.pct}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Epidemic parameters */}
        <div className="p-5 border border-border rounded-xl bg-card space-y-4">
          <p className="text-[13px] font-medium text-foreground/80">
            Epidemic parameters
          </p>
          <div className="space-y-2.5 divide-y divide-border/40">
            <ParamRow label="Basic rep. number" value={stats.r0.toFixed(2)} />
            <ParamRow label="Beta (transmission)" value={parameters.beta.toFixed(4)} />
            <ParamRow label="Gamma (recovery)" value={parameters.gamma.toFixed(4)} />
            {parameters.sigma !== null && parameters.sigma !== undefined && (
              <ParamRow label="Sigma (incubation)" value={Number(parameters.sigma).toFixed(4)} />
            )}
            <ParamRow label="Herd immunity" value={`${(stats.herd_immunity_threshold * 100).toFixed(1)}%`} />
            <ParamRow label="Population" value={parameters.population.toLocaleString()} />
            <ParamRow label="Duration" value={`${parameters.days} days`} />
            <div className="flex items-center justify-between pt-2.5">
              <span className="text-xs text-muted-foreground">Current phase</span>
              <span
                className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                  isGrowing
                    ? "text-rose-600 bg-rose-50 border-rose-200 dark:text-rose-400 dark:bg-rose-950 dark:border-rose-900"
                    : "text-green-600 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-950 dark:border-green-900"
                }`}
              >
                {isGrowing ? "Growing" : "Declining"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* AI Analysis section */}
      <div className="p-5 border border-border rounded-xl bg-card space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain size={15} className="text-muted-foreground" />
            <p className="text-[13px] font-medium text-foreground/80">
              AI Epidemiologist Analysis
            </p>
          </div>
          <div className="flex items-center gap-2">
            {showAnalysis && (
              <Button size="sm" variant="ghost" onClick={() => setShowAnalysis(false)}>
                <X size={14} className="mr-1" /> Hide
              </Button>
            )}
            <Button size="sm" onClick={handleAnalyze} disabled={isAnalyzing}>
              <Sparkles size={14} className="mr-1.5" />
              {isAnalyzing ? "Analyzing..." : "Analyze"}
            </Button>
          </div>
        </div>

        {isAnalyzing && (
          <div className="space-y-2.5 py-2">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs text-muted-foreground">Generating analysis...</span>
            </div>
            {[100, 93, 86, 100, 90, 78, 95, 82].map((w, i) => (
              <div key={i} className="h-2.5 rounded-sm bg-muted-foreground/8 animate-pulse" style={{ width: `${w}%` }} />
            ))}
          </div>
        )}

        {error && !isAnalyzing && (
          <div className="p-4 border border-border rounded-lg bg-destructive/5 space-y-2">
            <div className="flex items-center gap-2">
              <AlertCircle size={14} className="text-destructive" />
              <span className="text-xs font-medium text-destructive">Analysis failed</span>
            </div>
            <p className="text-xs text-muted-foreground">{error}</p>
          </div>
        )}

        {showAnalysis && analysis && !isAnalyzing && (
          <div className="p-4 border border-border rounded-lg bg-muted/20">
            <p className="text-xs leading-relaxed whitespace-pre-line text-foreground/85">
              {analysis}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  subtitle,
  accent,
}: {
  label: React.ReactNode;
  value: string;
  subtitle: React.ReactNode;
  accent: string;
}) {
  return (
    <div className="p-4 border border-border rounded-xl bg-card">
      <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
        {label}
      </p>
      <p className={`text-3xl font-bold tabular-nums tracking-tight ${accent}`}>
        {value}
      </p>
      <p className="text-[11px] text-muted-foreground mt-1.5">
        {subtitle}
      </p>
    </div>
  );
}

function ParamRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between pt-2.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-medium text-foreground/80 tabular-nums">{value}</span>
    </div>
  );
}
