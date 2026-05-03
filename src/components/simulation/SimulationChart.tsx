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
  interventionData?: SimulationData;
  merge?: boolean;
}

const CHART_COLORS = {
  susceptible: "var(--color-susceptible, #3b82f6)",
  infected: "var(--color-infected, #ef4444)",
  recovered: "var(--color-recovered, #22c55e)",
  exposed: "var(--color-exposed, #f59e0b)",
};

function formatPopulation(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return value.toString();
}

export function SimulationChart({ data, modelType, interventionData, merge }: SimulationChartProps) {
  // If we only have intervention data to show (merge is false), use it as main data
  const mainData = (interventionData && !merge) ? interventionData : data;
  
  const maxLength = Math.max(
    mainData.days.length,
    (merge && interventionData) ? interventionData.days.length : 0
  );

  const chartData = Array.from({ length: maxLength }).map((_, i) => {
    const day = i;
    const baseObj = {
      day,
      susceptible: Math.round(mainData.susceptible[i] ?? 0),
      infected: Math.round(mainData.infected[i] ?? 0),
      recovered: Math.round(mainData.recovered[i] ?? 0),
      ...(mainData.exposed ? { exposed: Math.round(mainData.exposed[i] ?? 0) } : {}),
    };

    if (interventionData && merge) {
      return {
        ...baseObj,
        i_susceptible: Math.round(interventionData.susceptible[i] ?? 0),
        i_infected: Math.round(interventionData.infected[i] ?? 0),
        i_recovered: Math.round(interventionData.recovered[i] ?? 0),
        ...(interventionData.exposed ? { i_exposed: Math.round(interventionData.exposed[i] ?? 0) } : {}),
      };
    }
    return baseObj;
  });

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
        {modelType === "SEIR" && (merge ? mainData.exposed || interventionData?.exposed : mainData.exposed) && (
          <Line
            type="monotone"
            name={merge ? "Exposed (Normal)" : "Exposed"}
            dataKey="exposed"
            stroke={CHART_COLORS.exposed}
            strokeWidth={1.5}
            dot={false}
            activeDot={{ r: 3 }}
          />
        )}
        <Line
          type="monotone"
          name={merge ? "Susceptible (Normal)" : "Susceptible"}
          dataKey="susceptible"
          stroke={CHART_COLORS.susceptible}
          strokeWidth={1.5}
          dot={false}
          activeDot={{ r: 3 }}
        />
        <Line
          type="monotone"
          name={merge ? "Infected (Normal)" : "Infected"}
          dataKey="infected"
          stroke={CHART_COLORS.infected}
          strokeWidth={1.5}
          dot={false}
          activeDot={{ r: 3 }}
        />
        <Line
          type="monotone"
          name={merge ? "Recovered (Normal)" : "Recovered"}
          dataKey="recovered"
          stroke={CHART_COLORS.recovered}
          strokeWidth={1.5}
          dot={false}
          activeDot={{ r: 3 }}
        />
        
        {merge && interventionData && (
          <>
            {modelType === "SEIR" && interventionData.exposed && (
              <Line
                type="monotone"
                name="Exposed (Intervention)"
                dataKey="i_exposed"
                stroke={CHART_COLORS.exposed}
                strokeWidth={1.5}
                strokeDasharray="5 5"
                dot={false}
                activeDot={{ r: 3 }}
              />
            )}
            <Line
              type="monotone"
              name="Susceptible (Intervention)"
              dataKey="i_susceptible"
              stroke={CHART_COLORS.susceptible}
              strokeWidth={1.5}
              strokeDasharray="5 5"
              dot={false}
              activeDot={{ r: 3 }}
            />
            <Line
              type="monotone"
              name="Infected (Intervention)"
              dataKey="i_infected"
              stroke={CHART_COLORS.infected}
              strokeWidth={1.5}
              strokeDasharray="5 5"
              dot={false}
              activeDot={{ r: 3 }}
            />
            <Line
              type="monotone"
              name="Recovered (Intervention)"
              dataKey="i_recovered"
              stroke={CHART_COLORS.recovered}
              strokeWidth={1.5}
              strokeDasharray="5 5"
              dot={false}
              activeDot={{ r: 3 }}
            />
          </>
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}