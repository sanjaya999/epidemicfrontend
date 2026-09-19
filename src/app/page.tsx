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
        const response = await simulationService.getPublic();
        const simulationsWithData = await Promise.all(
          (response.data ?? []).map(async ({ id }) => {
            try {
              return (await simulationService.getById(id)).data ?? null;
            } catch {
              return null;
            }
          })
        );
        setSimulations(simulationsWithData.filter(Boolean) as Simulation[]);
      } catch (error) {
        toast.error(getErrorMessage(error, "Failed to load public simulations"));
        setSimulations([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPublicSimulations();
  }, []);

  if (isLoading) {
    return (
      <div className="w-full space-y-4 p-8">
        <div className="h-10 w-48 animate-pulse rounded-sm bg-muted" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {[...Array(4)].map((_, index) => (
            <div
              key={index}
              className="h-[340px] animate-pulse rounded-2xl border border-border bg-card"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-8">
      <div className="mb-6 flex items-center justify-between border-b border-border pb-6">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Activity className="h-6 w-6 text-muted-foreground" />
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Public epidemic simulations from the community
          </p>
        </div>
      </div>

      {!simulations.length ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted/30 py-24 text-center">
          <Activity className="mb-4 h-12 w-12 text-muted-foreground/20" />
          <p className="text-sm text-muted-foreground">No public simulations available</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {simulations.map((simulation) => (
            <button
              key={simulation.id}
              type="button"
              onClick={() => router.push(`/simulations/${simulation.id}`)}
              className="group space-y-4 rounded-2xl border border-border bg-card p-6 text-left transition-all hover:border-primary/50 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "rounded-md border px-2.5 py-0.5 text-[11px] font-bold tracking-wider",
                    simulation.model_type === "SIR"
                      ? "border-blue-500/20 bg-blue-500/5 text-blue-500"
                      : "border-orange-500/20 bg-orange-500/5 text-orange-500"
                  )}
                >
                  {simulation.model_type}
                </span>
                <h2 className="truncate text-base font-semibold transition-colors group-hover:text-primary">
                  {simulation.name}
                </h2>
              </div>

              <SimulationChart
                data={simulation.data}
                modelType={simulation.model_type}
                height={200}
              />

              <div className="flex items-center gap-4 border-t border-border pt-3 text-xs text-muted-foreground">
                <span>R₀ {simulation.stats.r0.toFixed(2)}</span>
                <span className="h-1 w-1 rounded-full bg-border" />
                <span>Peak day {simulation.stats.peak_day}</span>
                <span className="h-1 w-1 rounded-full bg-border" />
                <span>{simulation.stats.total_infected.toLocaleString()} infected</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
