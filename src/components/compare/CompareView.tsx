"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, GitCompareArrows, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { simulationService } from "@/services/simulation.service";
import { SimulationSummary } from "@/types/simulation";

const METRIC_ROWS: { label: string; render: (s: SimulationSummary) => string }[] = [
  { label: "Model", render: (s) => s.model_type },
  { label: "R₀", render: (s) => s.stats.r0.toFixed(2) },
  {
    label: "Herd immunity",
    render: (s) => `${(s.stats.herd_immunity_threshold * 100).toFixed(1)}%`,
  },
  { label: "Peak day", render: (s) => `Day ${s.stats.peak_day}` },
  { label: "Peak infected", render: (s) => Math.round(s.stats.peak_infected).toLocaleString() },
  { label: "Total infected", render: (s) => Math.round(s.stats.total_infected).toLocaleString() },
  { label: "Population", render: (s) => s.parameters.population.toLocaleString() },
  { label: "Duration", render: (s) => `${s.parameters.days} days` },
  { label: "Beta (β)", render: (s) => s.parameters.beta.toFixed(4) },
  { label: "Gamma (γ)", render: (s) => s.parameters.gamma.toFixed(4) },
];

export function CompareView({ ids }: { ids: number[] }) {
  const [simulations, setSimulations] = useState<SimulationSummary[]>([]);
  const [isLoading, setIsLoading] = useState(ids.length > 0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ids.length === 0) return;
    let active = true;
    simulationService
      .compare(ids)
      .then((res) => {
        if (active && res.data) setSimulations(res.data);
      })
      .catch(() => {
        if (active) setError("Failed to load simulations for comparison");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [ids]);

  function exportCsv() {
    const escape = (value: string) =>
      /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
    const header = ["Metric", ...simulations.map((s) => s.name)];
    const rows = METRIC_ROWS.map((row) => [
      row.label,
      ...simulations.map((s) => row.render(s)),
    ]);
    const csv = [header, ...rows].map((r) => r.map(escape).join(",")).join("\n");
    const url = window.URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "simulation_comparison.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }

  return (
    <div className="p-8 w-full">
      <div className="flex items-center gap-3 pb-6 mb-6 border-b border-border">
        <Link href="/history">
          <Button variant="ghost" size="icon" title="Back to history">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <GitCompareArrows className="h-6 w-6 text-muted-foreground" />
            Compare Simulations
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Side-by-side metrics for {simulations.length || ids.length} selected runs
          </p>
        </div>
        {simulations.length > 0 && (
          <Button variant="outline" size="sm" className="ml-auto" onClick={exportCsv}>
            <Download className="h-4 w-4 mr-1.5" />
            Export CSV
          </Button>
        )}
      </div>

      {ids.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed rounded-lg bg-muted/30">
          <GitCompareArrows className="h-12 w-12 text-muted-foreground/20 mb-4" />
          <p className="text-muted-foreground text-sm">
            Select two or more simulations from your history to compare them.
          </p>
          <Link href="/history">
            <Button variant="outline" className="mt-6">
              Go to history
            </Button>
          </Link>
        </div>
      ) : isLoading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-12 rounded-sm bg-card border border-border animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="py-24 text-center text-sm text-destructive">{error}</div>
      ) : simulations.length === 0 ? (
        <div className="py-24 text-center text-sm text-muted-foreground">
          No simulations found for the selected IDs.
        </div>
      ) : (
        <div className="overflow-x-auto border border-border rounded-lg">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left p-3 font-medium text-muted-foreground">Metric</th>
                {simulations.map((s) => (
                  <th key={s.id} className="text-left p-3 font-semibold whitespace-nowrap">
                    {s.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {METRIC_ROWS.map((row) => (
                <tr key={row.label} className="border-b border-border last:border-0">
                  <td className="p-3 text-muted-foreground whitespace-nowrap">{row.label}</td>
                  {simulations.map((s) => (
                    <td key={s.id} className="p-3 font-medium tabular-nums whitespace-nowrap">
                      {row.render(s)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
