"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Activity } from "lucide-react";
import { toast } from "sonner";
import { SimulationChart } from "@/components/simulation/SimulationChart";
import { simulationService } from "@/services/simulation.service";
import { Simulation } from "@/types/simulation";
import { cn } from "@/lib/utils";
import { getErrorMessage } from "@/lib/error";

export default function DashboardPage() {
  const router = useRouter();
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchPublicSimulations() {
      try {
        const res = await simulationService.getPublic();
        const ids = (res.data ?? []).map(entry => entry.id);

        const sims = await Promise.all(
          ids.map(async (id) => {
            try {
              const simRes = await simulationService.getById(id);
              return simRes.data ?? null;
            } catch {
              return null;
            }
          })
        );
        setSimulations(sims.filter(Boolean) as Simulation[]);
      } catch (err) {
        toast.error(getErrorMessage(err, "Failed to load public simulations"));
        setSimulations([]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchPublicSimulations();
  }, []);

  if (isLoading) {
    return (
      <div className="p-8 w-full space-y-4">
        <div className="h-10 w-48 bg-muted animate-pulse rounded-sm" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-[340px] rounded-2xl bg-card border border-border animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 w-full">
      <div className="flex items-center justify-between pb-6 mb-6 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Activity className="h-6 w-6 text-muted-foreground" />
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Public epidemic simulations from the community
          </p>
        </div>
      </div>

      {!simulations.length ? (
        <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed rounded-lg bg-muted/30">
          <Activity className="h-12 w-12 text-muted-foreground/20 mb-4" />
          <p className="text-muted-foreground text-sm">No public simulations available</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {simulations.map((sim) => (
            <div
              key={sim.id}
              onClick={() => router.push(`/simulations/${sim.id}`)}
              className="group p-6 border border-border rounded-2xl bg-card hover:border-primary/50 hover:shadow-sm transition-all cursor-pointer space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "px-2.5 py-0.5 rounded-md border text-[11px] font-bold tracking-wider",
                  sim.model_type === "SIR"
                    ? "text-blue-500 bg-blue-500/5 border-blue-500/20"
                    : "text-orange-500 bg-orange-500/5 border-orange-500/20"
                )}>
                  {sim.model_type}
                </div>
                <h3 className="text-base font-semibold group-hover:text-primary transition-colors truncate">
                  {sim.name}
                </h3>
              </div>

              <SimulationChart
                data={sim.data}
                modelType={sim.model_type}
                height={200}
              />

              <div className="flex items-center gap-4 text-xs text-muted-foreground pt-3 border-t border-border">
                <span>R₀ {sim.stats.r0.toFixed(2)}</span>
                <span className="w-1 h-1 rounded-full bg-border" />
                <span>Peak day {sim.stats.peak_day}</span>
                <span className="w-1 h-1 rounded-full bg-border" />
                <span>{sim.stats.total_infected.toLocaleString()} infected</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
