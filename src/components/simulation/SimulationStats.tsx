import { SimulationStats as SimulationStatsType } from "@/types/simulation";

interface SimulationStatsProps {
  stats: SimulationStatsType;
  population: number;
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 border border-border rounded-sm bg-card">
      <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest mb-2">
        {label}
      </p>
      <p className="text-2xl font-semibold tabular-nums tracking-tight">
        {value}
      </p>
    </div>
  );
}

export function SimulationStats({ stats, population }: SimulationStatsProps) {
  const totalPct = ((stats.total_infected / population) * 100).toFixed(1);
  const peakPct = ((stats.peak_infected / population) * 100).toFixed(1);

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard
        label="R₀"
        value={stats.r0.toFixed(2)}
      />
      <StatCard
        label="Peak Day"
        value={`Day ${stats.peak_day}`}
      />
      <StatCard
        label="Peak Infected"
        value={`${stats.peak_infected.toLocaleString()} (${peakPct}%)`}
      />
      <StatCard
        label="Total Infected"
        value={`${stats.total_infected.toLocaleString()} (${totalPct}%)`}
      />
    </div>
  );
}