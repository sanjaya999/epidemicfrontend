"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { SimulationData, ModelType } from "@/types/simulation";

interface SimulationChartProps {
  data: SimulationData;
  modelType: ModelType;
}

const CHART_COLORS = {
  susceptible: "var(--color-susceptible)",
  infected: "var(--color-infected)",
  recovered: "var(--color-recovered)",
  exposed: "var(--color-exposed)",
};

function formatPopulation(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return value.toString();
}

export function SimulationChart({ data, modelType }: SimulationChartProps) {
  const chartData = data.days.map((day, i) => ({
    day,
    susceptible: Math.round(data.susceptible[i]),
    infected: Math.round(data.infected[i]),
    recovered: Math.round(data.recovered[i]),
    ...(data.exposed ? { exposed: Math.round(data.exposed[i]) } : {}),
  }));

  return (
    <ResponsiveContainer width="100%" height={380}>
      <LineChart
        data={chartData}
        margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="hsl(var(--border))"
          opacity={0.4}
        />
        <XAxis
          dataKey="day"
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
          axisLine={{ stroke: "hsl(var(--border))" }}
          tickLine={false}
          label={{
            value: "Days",
            position: "insideBottom",
            offset: -4,
            fill: "hsl(var(--muted-foreground))",
            fontSize: 11,
          }}
        />
        <YAxis
          tickFormatter={formatPopulation}
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={48}
        />
        <Tooltip
          contentStyle={{
            background: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "4px",
            fontSize: "12px",
            color: "hsl(var(--foreground))",
          }}
          formatter={(value, name) => [
            typeof value === "number" ? value.toLocaleString() : String(value ?? ""),
            String(name).charAt(0).toUpperCase() + String(name).slice(1),
          ]}
          labelFormatter={(label) => `Day ${label}`}
        />
        <Legend
          wrapperStyle={{
            fontSize: "12px",
            color: "hsl(var(--muted-foreground))",
            paddingTop: "16px",
          }}
        />
        {modelType === "SEIR" && data.exposed && (
          <Line
            type="monotone"
            dataKey="exposed"
            stroke={CHART_COLORS.exposed}
            strokeWidth={1.5}
            dot={false}
            activeDot={{ r: 3 }}
          />
        )}
        <Line
          type="monotone"
          dataKey="susceptible"
          stroke={CHART_COLORS.susceptible}
          strokeWidth={1.5}
          dot={false}
          activeDot={{ r: 3 }}
        />
        <Line
          type="monotone"
          dataKey="infected"
          stroke={CHART_COLORS.infected}
          strokeWidth={1.5}
          dot={false}
          activeDot={{ r: 3 }}
        />
        <Line
          type="monotone"
          dataKey="recovered"
          stroke={CHART_COLORS.recovered}
          strokeWidth={1.5}
          dot={false}
          activeDot={{ r: 3 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}