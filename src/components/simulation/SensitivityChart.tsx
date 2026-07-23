"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { simulationService } from "@/services/simulation.service";
import { ModelType, SweepPoint } from "@/types/simulation";
import { cn } from "@/lib/utils";

type SweepParam = "beta" | "gamma" | "sigma";
type Metric = "r0" | "peak_infected" | "total_infected";

const PARAM_RANGES: Record<SweepParam, { min: number; max: number }> = {
  beta: { min: 0.05, max: 1.0 },
  gamma: { min: 0.02, max: 0.5 },
  sigma: { min: 0.05, max: 0.5 },
};

const METRICS: { key: Metric; label: string }[] = [
  { key: "r0", label: "R₀" },
  { key: "peak_infected", label: "Peak infected" },
  { key: "total_infected", label: "Total infected" },
];

export function SensitivityChart({ simulationId }: { simulationId: number }) {
  const [modelType, setModelType] = useState<ModelType>("SIR");
  const [param, setParam] = useState<SweepParam>("beta");
  const [metric, setMetric] = useState<Metric>("r0");
  const [points, setPoints] = useState<SweepPoint[]>([]);

  useEffect(() => {
    let active = true;
    simulationService
      .getById(simulationId)
      .then((res) => {
        if (active && res.data) setModelType(res.data.model_type);
      })
      .catch(() => setModelType("SIR"));
    return () => {
      active = false;
    };
  }, [simulationId]);

  useEffect(() => {
    let active = true;
    const range = PARAM_RANGES[param];
    simulationService
      .sweep(simulationId, { parameter: param, min: range.min, max: range.max, steps: 20 })
      .then((res) => {
        if (active && res.data) setPoints(res.data.points);
      })
      .catch(() => {
        if (active) setPoints([]);
      });
    return () => {
      active = false;
    };
  }, [simulationId, param]);

  const availableParams: SweepParam[] =
    modelType === "SEIR" ? ["beta", "gamma", "sigma"] : ["beta", "gamma"];
  const metricLabel = METRICS.find((m) => m.key === metric)?.label ?? "";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1 border border-border rounded-md p-1">
          {availableParams.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setParam(p)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded transition-colors",
                param === p
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {p}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 border border-border rounded-md p-1">
          {METRICS.map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => setMetric(m.key)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded transition-colors",
                metric === m.key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-72">
        {points.length === 0 ? (
          <div className="h-full flex items-center justify-center text-sm text-muted-foreground border border-border rounded-lg">
            Loading sensitivity data…
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={points} margin={{ top: 8, right: 16, left: 0, bottom: 12 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="value"
                tickFormatter={(v) => Number(v).toFixed(2)}
                tick={{ fontSize: 11 }}
                label={{ value: param, position: "insideBottom", offset: -6, fontSize: 11 }}
              />
              <YAxis tick={{ fontSize: 11 }} width={52} />
              <Tooltip
                formatter={(value) => [Number(value).toLocaleString(), metricLabel]}
                labelFormatter={(label) => `${param} = ${Number(label).toFixed(3)}`}
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "4px",
                  fontSize: "12px",
                }}
              />
              <Line
                type="monotone"
                dataKey={metric}
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
