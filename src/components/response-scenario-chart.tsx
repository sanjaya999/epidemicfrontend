"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SimulationData } from "@/types/simulation";

const CHART_COLORS = {
  infected: "var(--color-infected, #ef4444)",
  capacity: "#64748b",
};

interface ResponseScenarioChartProps {
  baseline: SimulationData;
  scenario?: SimulationData;
  capacity: number | null;
}

function compactNumber(value: number) {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function ResponseScenarioChart({
  baseline,
  scenario,
  capacity,
}: ResponseScenarioChartProps) {
  const points = baseline.days.map((day, index) => ({
    day,
    baseline: Math.round(baseline.infected[index] ?? 0),
    scenario: scenario ? Math.round(scenario.infected[index] ?? 0) : undefined,
  }));

  return (
    <ResponsiveContainer width="100%" height={380}>
      <LineChart data={points} margin={{ top: 12, right: 18, left: 14, bottom: 24 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis
          dataKey="day"
          tickLine={false}
          axisLine={{ stroke: "var(--border)" }}
          tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
          label={{
            value: "Days from latest case report",
            position: "insideBottom",
            offset: -10,
            fill: "var(--muted-foreground)",
            fontSize: 11,
          }}
          height={48}
        />
        <YAxis
          width={72}
          tickLine={false}
          axisLine={false}
          tickFormatter={compactNumber}
          tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
          label={{
            value: "Number of active cases",
            angle: -90,
            position: "insideLeft",
            fill: "var(--muted-foreground)",
            fontSize: 11,
            style: { textAnchor: "middle" },
          }}
        />
        <Tooltip
          labelFormatter={(label) => `Day ${label}`}
          formatter={(value, name) => [
            Number(value ?? 0).toLocaleString(),
            String(name),
          ]}
          contentStyle={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: 4,
            color: "var(--foreground)",
            fontSize: 12,
          }}
        />
        <Legend
          verticalAlign="bottom"
          wrapperStyle={{
            fontSize: 12,
            color: "var(--muted-foreground)",
            paddingTop: 14,
          }}
        />
        {capacity !== null && capacity > 0 && (
          <ReferenceLine
            y={capacity}
            stroke={CHART_COLORS.capacity}
            strokeDasharray="6 5"
            label={{
              value: `Response capacity: ${capacity.toLocaleString()}`,
              position: "insideTopRight",
              fill: CHART_COLORS.capacity,
              fontSize: 11,
            }}
          />
        )}
        <Line
          type="monotone"
          name="Active cases — no intervention"
          dataKey="baseline"
          stroke={CHART_COLORS.infected}
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 3, fill: CHART_COLORS.infected }}
        />
        {scenario && (
          <Line
            type="monotone"
            name="Active cases — response scenario"
            dataKey="scenario"
            stroke={CHART_COLORS.infected}
            strokeWidth={2}
            strokeDasharray="6 5"
            dot={false}
            activeDot={{ r: 3, fill: CHART_COLORS.infected }}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}
