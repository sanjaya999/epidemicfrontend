"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2, History as HistoryIcon, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { simulationService } from "@/services/simulation.service";
import { useSimulationStore } from "@/store/use-simulation-store";

export default function HistoryPage() {
  const router = useRouter();
  const { simulations, setSimulations, removeSimulation, isLoading, setLoading } =
    useSimulationStore();

  useEffect(() => {
    async function fetch() {
      setLoading(true);
      try {
        const response = await simulationService.getAll();
        if (response.data) setSimulations(response.data);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, []);

  async function handleDelete(id: number, e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await simulationService.delete(id);
      removeSimulation(id);
      toast.success("Simulation deleted");
    } catch {
      toast.error("Failed to delete simulation");
    }
  }

  if (isLoading) {
    return (
      <div className="p-8 w-full space-y-4">
        <div className="h-10 w-48 bg-muted animate-pulse rounded-sm" />
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-24 rounded-sm bg-card border border-border animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="p-8 w-full">
      <div className="flex items-center justify-between pb-6 mb-6 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <HistoryIcon className="h-6 w-6 text-muted-foreground" />
            Simulation History
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Browse and manage your past epidemic models
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold">{simulations.length}</p>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Total Runs</p>
        </div>
      </div>

      {!simulations.length ? (
        <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed rounded-lg bg-muted/30">
          <HistoryIcon className="h-12 w-12 text-muted-foreground/20 mb-4" />
          <p className="text-muted-foreground text-sm">No simulations found in your history</p>
          <Button
            variant="outline"
            className="mt-6"
            onClick={() => router.push("/simulations")}
          >
            Create your first simulation
          </Button>
        </div>
      ) : (
        <div className="grid gap-3">
          {simulations.map((sim) => (
            <div
              key={sim.id}
              onClick={() => router.push(`/simulations/${sim.id}`)}
              className="group flex items-center justify-between p-5 border border-border rounded-lg bg-card hover:border-primary/50 hover:shadow-sm transition-all cursor-pointer"
            >
              <div className="flex items-center gap-5">
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center border font-bold text-xs",
                  sim.model_type === "SIR" 
                    ? "bg-blue-50 text-blue-600 border-blue-100" 
                    : "bg-orange-50 text-orange-600 border-orange-100"
                )}>
                  {sim.model_type}
                </div>
                <div>
                  <h3 className="text-base font-semibold group-hover:text-primary transition-colors">{sim.name}</h3>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                    <span>R₀ {sim.stats.r0.toFixed(2)}</span>
                    <span className="w-1 h-1 rounded-full bg-border" />
                    <span>Peak day {sim.stats.peak_day}</span>
                    <span className="w-1 h-1 rounded-full bg-border" />
                    <span>{sim.stats.total_infected.toLocaleString()} infected</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-medium">{new Date(sim.created_at).toLocaleDateString()}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-tighter">Created</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => handleDelete(sim.id, e)}
                    className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 size={16} />
                  </Button>
                  <div className="h-9 w-9 flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                    <ArrowRight size={18} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
