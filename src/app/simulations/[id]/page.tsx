"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SimulationChart } from "@/components/simulation/SimulationChart";
import { SimulationStats } from "@/components/simulation/SimulationStats";
import { simulationService } from "@/services/simulation.service";
import { Simulation } from "@/types/simulation";

export default function SimulationDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [simulation, setSimulation] = useState<Simulation | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const response = await simulationService.getById(Number(id));
        if (response.data) setSimulation(response.data);
      } finally {
        setIsLoading(false);
      }
    }
    fetch();
  }, [id]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-card border border-border rounded-sm animate-pulse" />
        <div className="h-96 bg-card border border-border rounded-sm animate-pulse" />
      </div>
    );
  }

  if (!simulation) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <p className="text-muted-foreground text-sm">Simulation not found</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push("/simulations")}
        >
          Back to history
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-8 w-full space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-8 border-b border-border">
          <div className="space-y-4">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest"
            >
              <ArrowLeft size={14} />
              Back to History
            </button>
            <div className="flex items-center gap-4">
              <div className={cn(
                "px-2.5 py-0.5 rounded-md border text-[11px] font-bold tracking-wider",
                simulation.model_type === "SIR"
                  ? "text-blue-500 bg-blue-500/5 border-blue-500/20"
                  : "text-orange-500 bg-orange-500/5 border-orange-500/20"
              )}>
                {simulation.model_type} MODEL
              </div>
              <h1 className="text-3xl font-bold tracking-tight font-sans">
                {simulation.name}
              </h1>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-border" />
                {new Date(simulation.created_at).toLocaleString()}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-border" />
                {simulation.parameters.population.toLocaleString()} pop.
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-border" />
                {simulation.parameters.days} days duration
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <SimulationStats
          stats={simulation.stats}
          population={simulation.parameters.population}
        />

        {/* Main Content Area */}
        <div className="grid grid-cols-1 gap-8">
          {/* Chart Section */}
          <div className="p-8 border border-border rounded-2xl bg-card space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                Epidemic Growth Curve
              </h3>
              <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#3b82f6]" /> Susceptible
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" /> Infected
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#22c55e]" /> Recovered
                </div>
                {simulation.data.exposed && (
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" /> Exposed
                  </div>
                )}
              </div>
            </div>
            
            <div className="h-[400px]">
              <SimulationChart
                data={simulation.data}
                modelType={simulation.model_type}
              />
            </div>
          </div>

          {/* Parameters Section */}
          <div className="p-8 border border-border rounded-2xl bg-card">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground mb-8">
              Input Parameters
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-10">
              {Object.entries(simulation.parameters)
                .filter(([, v]) => v !== null)
                .map(([key, value]) => (
                  <div key={key} className="space-y-1.5">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      {key.replace(/_/g, " ")}
                    </p>
                    <p className="text-lg font-bold tabular-nums">
                      {typeof value === "number"
                        ? value.toLocaleString()
                        : String(value)}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>

  );
}

// Helper for cn
function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}