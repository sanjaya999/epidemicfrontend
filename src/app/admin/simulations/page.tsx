"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import {
  FlaskConical,
  Search,
  Globe,
  Lock,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminService } from "@/services/admin.service";
import type { AdminSimulation } from "@/types/admin";
import { cn } from "@/lib/utils";
import { getErrorMessage } from "@/lib/error";

const PAGE_SIZE = 15;

export default function AdminSimulationsPage() {
  const [simulations, setSimulations] = useState<AdminSimulation[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [modelType, setModelType] = useState<"" | "SIR" | "SEIR">("");
  const [loading, setLoading] = useState(true);

  const fetchSimulations = useCallback(async () => {
    try {
      const params: Record<string, unknown> = {
        skip: page * PAGE_SIZE,
        limit: PAGE_SIZE,
      };
      if (search) params.search = search;
      if (modelType) params.model_type = modelType;

      const res = await adminService.getSimulations(params as any);
      if (res.data) setSimulations(res.data);
      setTotal(res.total);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to fetch simulations"));
    } finally {
      setLoading(false);
    }
  }, [page, search, modelType]);

  useEffect(() => {
    const timer = setTimeout(fetchSimulations, search ? 250 : 0);
    return () => clearTimeout(timer);
  }, [fetchSimulations, search]);

  async function handleToggleVisibility(sim: AdminSimulation) {
    try {
      const res = await adminService.toggleSimulationVisibility(sim.id, !sim.is_public);
      if (res.data?.[0]) {
        setSimulations((prev) =>
          prev.map((s) => (s.id === sim.id ? res.data![0] : s))
        );
      }
      toast.success(sim.is_public ? "Simulation made private" : "Simulation made public");
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to update visibility"));
    }
  }

  async function handleDelete(sim: AdminSimulation) {
    if (!confirm(`Delete simulation "${sim.name}" by ${sim.username}? This cannot be undone.`)) return;
    try {
      await adminService.deleteSimulation(sim.id);
      setSimulations((prev) => prev.filter((s) => s.id !== sim.id));
      setTotal((t) => t - 1);
      toast.success("Simulation deleted");
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to delete simulation"));
    }
  }

  return (
    <div className="p-8 w-full">
      <div className="flex items-center justify-between pb-6 mb-6 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FlaskConical className="h-6 w-6 text-orange-500" />
            Simulation Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            View and manage all simulations across users
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold tabular-nums">{total}</p>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Total Sims</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-6">
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

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 rounded-lg bg-card border border-border animate-pulse" />
          ))}
        </div>
      ) : !simulations.length ? (
        <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed rounded-lg bg-muted/30">
          <FlaskConical className="h-12 w-12 text-muted-foreground/20 mb-4" />
          <p className="text-muted-foreground text-sm">No simulations found</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Simulation</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Owner</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Model</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Visibility</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Created</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {simulations.map((sim) => (
                <tr key={sim.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium truncate max-w-[200px]">{sim.name}</p>
                    <p className="text-[11px] text-muted-foreground">ID: {sim.id}</p>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-muted-foreground">{sim.username}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={cn(
                        "inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold border",
                        sim.model_type === "SIR"
                          ? "bg-blue-50 text-blue-600 border-blue-100"
                          : "bg-orange-50 text-orange-600 border-orange-100"
                      )}
                    >
                      {sim.model_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleToggleVisibility(sim)}
                      className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors",
                        sim.is_public
                          ? "bg-green-50 text-green-700 border border-green-200 hover:bg-green-100"
                          : "bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100"
                      )}
                      title={sim.is_public ? "Make private" : "Make public"}
                    >
                      {sim.is_public ? <Globe size={11} /> : <Lock size={11} />}
                      {sim.is_public ? "Public" : "Private"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                    {new Date(sim.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(sim)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
