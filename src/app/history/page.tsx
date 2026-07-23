"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Trash2,
  History as HistoryIcon,
  ArrowRight,
  Globe,
  Lock,
  Download,
  Search,
  Check,
  GitCompareArrows,
  Activity,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { simulationService } from "@/services/simulation.service";
import { useSimulationStore } from "@/store/use-simulation-store";
import { SimulationSummary, UserSimulationStats } from "@/types/simulation";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;

export default function HistoryPage() {
  const router = useRouter();
  const { simulations, setSimulations, removeSimulation, updateSimulation, isLoading, setLoading } =
    useSimulationStore();

  const [search, setSearch] = useState("");
  const [modelType, setModelType] = useState<"" | "SIR" | "SEIR">("");
  const [selected, setSelected] = useState<number[]>([]);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<UserSimulationStats | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  function toggleSelect(id: number, e: React.MouseEvent) {
    e.stopPropagation();
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  useEffect(() => {
    let active = true;
    simulationService
      .getStats()
      .then((res) => {
        if (active && res.data) setStats(res.data);
      })
      .catch(() => setStats(null));
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(
      async () => {
        // Show the full skeleton only for the initial / unfiltered load.
        if (search === "" && modelType === "" && page === 0) setLoading(true);
        try {
          const params: { search?: string; model_type?: string } = {};
          if (search) params.search = search;
          if (modelType) params.model_type = modelType;
          const response = await simulationService.getAll({
            ...params,
            skip: page * PAGE_SIZE,
            limit: PAGE_SIZE,
          });
          if (active) {
            if (response.data) setSimulations(response.data);
            if (response.meta) setTotal(response.meta.total);
          }
        } finally {
          if (active) setLoading(false);
        }
      },
      search || modelType ? 250 : 0
    );
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [search, modelType, page, refreshKey, setLoading, setSimulations, setTotal]);

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

  async function handleDuplicate(sim: SimulationSummary, e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await simulationService.run({
        name: `${sim.name} (copy)`,
        model_type: sim.model_type,
        population: sim.parameters.population,
        initial_infected: sim.parameters.initial_infected,
        initial_exposed: sim.parameters.initial_exposed,
        days: sim.parameters.days,
        beta: sim.parameters.beta,
        gamma: sim.parameters.gamma,
        sigma: sim.parameters.sigma,
        is_public: false,
      });
      toast.success("Simulation duplicated");
      setRefreshKey((key) => key + 1);
    } catch {
      toast.error("Failed to duplicate simulation");
    }
  }

  async function handleToggleVisibility(id: number, current: boolean | undefined, e: React.MouseEvent) {
    e.stopPropagation();
    try {
      const res = await simulationService.updateVisibility(id, !current);
      if (res.data) {
        updateSimulation(id, { is_public: res.data.is_public });
        toast.success(res.data.is_public ? "Simulation is now public" : "Simulation is now private");
      }
    } catch {
      toast.error("Failed to update visibility");
    }
  }

  async function handleExport(id: number, name: string, e: React.MouseEvent) {
    e.stopPropagation();
    try {
      const blob = await simulationService.exportCsv(id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${name.trim().replace(/\s+/g, "_").toLowerCase() || `simulation_${id}`}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("CSV exported");
    } catch {
      toast.error("Failed to export CSV");
    }
  }

  if (isLoading && simulations.length === 0) {
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
          <p className="text-2xl font-bold">{total}</p>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Total Runs</p>
          {stats && Object.keys(stats.by_model).length > 0 && (
            <p className="text-[11px] text-muted-foreground mt-1 tabular-nums">
              {Object.entries(stats.by_model)
                .map(([model, count]) => `${model}: ${count}`)
                .join(" · ")}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder="Search simulations by name..."
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-1 border border-border rounded-md p-1 self-start sm:self-auto">
          {(["", "SIR", "SEIR"] as const).map((mt) => (
            <button
              key={mt || "all"}
              onClick={() => {
                setModelType(mt);
                setPage(0);
              }}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded transition-colors",
                modelType === mt
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {mt === "" ? "All" : mt}
            </button>
          ))}
        </div>
      </div>

      {selected.length > 0 && (
        <div className="flex items-center justify-between mb-4 p-3 border border-primary/30 bg-primary/5 rounded-lg">
          <p className="text-sm font-medium">{selected.length} selected</p>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setSelected([])}>
              Clear
            </Button>
            <Button
              size="sm"
              disabled={selected.length < 2}
              onClick={() => router.push(`/compare?ids=${selected.join(",")}`)}
            >
              <GitCompareArrows className="h-4 w-4 mr-1.5" />
              Compare{selected.length >= 2 ? ` (${selected.length})` : ""}
            </Button>
          </div>
        </div>
      )}

      {!simulations.length ? (
        <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed rounded-lg bg-muted/30">
          <HistoryIcon className="h-12 w-12 text-muted-foreground/20 mb-4" />
          <p className="text-muted-foreground text-sm">
            {search || modelType
              ? "No simulations match your current filters"
              : "No simulations found in your history"}
          </p>
          {!search && !modelType && (
            <Button
              variant="outline"
              className="mt-6"
              onClick={() => router.push("/simulations")}
            >
              Create your first simulation
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-3">
          {simulations.map((sim) => (
            <div
              key={sim.id}
              onClick={() => router.push(`/simulations/${sim.id}`)}
              className={cn(
                "group flex items-center justify-between p-5 border rounded-lg bg-card hover:border-primary/50 hover:shadow-sm transition-all cursor-pointer",
                selected.includes(sim.id) ? "border-primary/60 bg-primary/5" : "border-border"
              )}
            >
              <div className="flex items-center gap-5">
                <button
                  onClick={(e) => toggleSelect(sim.id, e)}
                  className={cn(
                    "h-5 w-5 rounded border flex items-center justify-center shrink-0 transition-colors",
                    selected.includes(sim.id)
                      ? "bg-primary border-primary text-primary-foreground"
                      : "border-border hover:border-primary/60"
                  )}
                  title="Select for comparison"
                >
                  {selected.includes(sim.id) && <Check size={12} strokeWidth={3} />}
                </button>
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
                  <button
                    onClick={(e) => handleToggleVisibility(sim.id, sim.is_public, e)}
                    className={cn(
                      "h-9 w-9 flex items-center justify-center rounded-md transition-colors",
                      sim.is_public
                        ? "text-green-500 hover:text-green-600 hover:bg-green-50"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                    title={sim.is_public ? "Set private" : "Set public"}
                  >
                    {sim.is_public ? <Globe size={15} /> : <Lock size={15} />}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/simulations/${sim.id}/sensitivity`);
                    }}
                    className="h-9 w-9 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    title="Sensitivity analysis"
                  >
                    <Activity size={15} />
                  </button>
                  <button
                    onClick={(e) => handleExport(sim.id, sim.name, e)}
                    className="h-9 w-9 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    title="Export CSV"
                  >
                    <Download size={15} />
                  </button>
                  <button
                    onClick={(e) => handleDuplicate(sim, e)}
                    className="h-9 w-9 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    title="Duplicate simulation"
                  >
                    <Copy size={15} />
                  </button>
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

      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Page {page + 1} of {Math.max(1, Math.ceil(total / PAGE_SIZE))}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={(page + 1) * PAGE_SIZE >= total}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
