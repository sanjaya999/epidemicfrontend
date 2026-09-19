"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { OutbreakForecast } from "@/types/surveillance";

interface OutbreakForecastChartProps {
  forecast: OutbreakForecast;
  capacity: number | null;
}

function compactNumber(value: number) {
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

export function OutbreakForecastChart({ forecast, capacity }: OutbreakForecastChartProps) {
  const points = forecast.data.days.map((day, index) => ({
    day,
    active: Math.round(forecast.data.infected[index] ?? 0),
    exposed: forecast.data.exposed ? Math.round(forecast.data.exposed[index] ?? 0) : undefined,
  }));

  return (
    <ResponsiveContainer width="100%" height={340}>
      <LineChart data={points} margin={{ top: 12, right: 18, left: 4, bottom: 8 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis
          dataKey="day"
          tickLine={false}
          axisLine={{ stroke: "var(--border)" }}
          tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
          label={{ value: "Days from latest report", position: "insideBottom", offset: -3, fill: "var(--muted-foreground)", fontSize: 11 }}
        />
        <YAxis
          width={52}
          tickLine={false}
          axisLine={false}
          tickFormatter={compactNumber}
          tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
        />
        <Tooltip
          labelFormatter={(label) => `Day ${label}`}
          formatter={(value, name) => [
            Number(value ?? 0).toLocaleString(),
            name === "active" ? "Projected active" : "Projected exposed",
          ]}
          contentStyle={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: 6,
            color: "var(--foreground)",
            fontSize: 12,
          }}
        />
        {capacity !== null && capacity > 0 && (
          <ReferenceLine
            y={capacity}
            stroke="var(--muted-foreground)"
            strokeDasharray="6 5"
            label={{ value: `Capacity ${capacity.toLocaleString()}`, position: "insideTopRight", fill: "var(--muted-foreground)", fontSize: 11 }}
          />
        )}
        {forecast.model_type === "SEIR" && forecast.data.exposed && (
          <Line
            type="monotone"
            dataKey="exposed"
            stroke="var(--muted-foreground)"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            dot={false}
          />
        )}
        <Line
          type="monotone"
          dataKey="active"
          stroke="var(--foreground)"
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 3, fill: "var(--foreground)" }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
