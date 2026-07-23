"use client";

import { Check, FlaskConical, Loader2 } from "lucide-react";
import { SimulationSummary } from "@/types/simulation";
import { InterventionSimulation } from "@/services/intervention.service";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface ReplayPickerProps {
  sims: SimulationSummary[];
  selectedSimId: number | null;
  onSelectSim: (id: number) => void;
  interventions: InterventionSimulation[];
  selectedIntId: number | null;
  onSelectInt: (id: number | null) => void;
  dotCount: number;
  onDotCountChange: (n: number) => void;
  peoplePerDot: number;
  loadingSims: boolean;
  loadingDetail: boolean;
}

export function ReplayPicker({
  sims,
  selectedSimId,
  onSelectSim,
  interventions,
  selectedIntId,
  onSelectInt,
  dotCount,
  onDotCountChange,
  peoplePerDot,
  loadingSims,
  loadingDetail,
}: ReplayPickerProps) {
  return (
    <div className="space-y-6">
      {/* Simulation selector */}
      <div className="space-y-2">
        <Label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          Simulation
        </Label>
        {loadingSims ? (
          <div className="flex items-center gap-2 h-10 px-3 border border-border rounded-md bg-card text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading simulations…
          </div>
        ) : (
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={selectedSimId ?? ""}
            onChange={(e) => e.target.value && onSelectSim(Number(e.target.value))}
          >
            <option value="" disabled>
              Select a simulation…
            </option>
            {sims.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} · {s.model_type}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Run selector: base vs interventions */}
      {selectedSimId !== null && (
        <div className="space-y-2">
          <Label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            Run to replay
          </Label>
          {loadingDetail ? (
            <div className="flex items-center gap-2 h-9 px-3 border border-border rounded-md bg-card text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading runs…
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => onSelectInt(null)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-sm font-medium transition-colors",
                  selectedIntId === null
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-transparent text-muted-foreground border-border hover:border-foreground hover:text-foreground"
                )}
              >
                {selectedIntId === null && <Check className="w-3.5 h-3.5" />}
                <FlaskConical className="w-3.5 h-3.5" />
                Base run
              </button>
              {interventions.map((int) => (
                <button
                  key={int.id}
                  onClick={() => onSelectInt(int.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-sm font-medium transition-colors",
                    selectedIntId === int.id
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-transparent text-muted-foreground border-border hover:border-foreground hover:text-foreground"
                  )}
                >
                  {selectedIntId === int.id && <Check className="w-3.5 h-3.5" />}
                  {int.name}
                  <span className="text-[10px] opacity-70 tabular-nums">
                    {int.events?.length ?? 0} ev
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Dot density */}
      <div className="space-y-2 pt-2 border-t border-border">
        <div className="flex items-center justify-between">
          <Label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            Population dots
          </Label>
          <span className="text-sm font-semibold tabular-nums">{dotCount}</span>
        </div>
        <input
          type="range"
          min={100}
          max={800}
          step={50}
          value={dotCount}
          onChange={(e) => onDotCountChange(Number(e.target.value))}
          className="w-full h-1.5 cursor-pointer appearance-none rounded-full bg-border accent-foreground"
          aria-label="Number of dots"
        />
        <p className="text-[11px] text-muted-foreground">
          {peoplePerDot > 0 ? (
            <>
              1 dot ≈ <span className="font-semibold tabular-nums">{peoplePerDot.toLocaleString()}</span> people
            </>
          ) : (
            "Each dot represents a group of people"
          )}
        </p>
      </div>
    </div>
  );
}
