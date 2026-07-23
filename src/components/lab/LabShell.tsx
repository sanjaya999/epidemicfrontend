"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CircleDot, Info } from "lucide-react";
import { simulationService } from "@/services/simulation.service";
import { interventionService, InterventionSimulation } from "@/services/intervention.service";
import { Simulation, SimulationSummary } from "@/types/simulation";
import { DotReplayEngine } from "@/lib/dot-engine";
import { ReplayPicker } from "@/components/lab/ReplayPicker";
import { DotCanvas } from "@/components/lab/DotCanvas";

export function LabShell() {
  const searchParams = useSearchParams();
  const initialSimId = searchParams.get("sim");
  const initialIntId = searchParams.get("intervention");

  const [sims, setSims] = useState<SimulationSummary[]>([]);
  const [loadingSims, setLoadingSims] = useState(true);
  const [selectedSimId, setSelectedSimId] = useState<number | null>(
    initialSimId ? Number(initialSimId) : null
  );
  const [fullSim, setFullSim] = useState<Simulation | null>(null);
  const [interventions, setInterventions] = useState<InterventionSimulation[]>([]);
  const [selectedIntId, setSelectedIntId] = useState<number | null>(null);
  const [activeInt, setActiveInt] = useState<InterventionSimulation | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [dotCount, setDotCount] = useState(400);

  /** Deep-linked intervention id, applied once when the sim first loads. */
  const pendingIntRef = useRef<number | null>(initialIntId ? Number(initialIntId) : null);

  // Load the simulation list once.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await simulationService.getAll();
        if (cancelled) return;
        const list = res.data ?? [];
        setSims(list);
        setSelectedSimId((prev) => {
          if (prev !== null) return prev;
          return list[0]?.id ?? null;
        });
      } catch {
        // leave list empty; empty state renders below
      } finally {
        if (!cancelled) setLoadingSims(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const activateIntervention = useCallback(
    async (id: number | null, list: InterventionSimulation[]) => {
      setSelectedIntId(id);
      if (id === null) {
        setActiveInt(null);
        return;
      }
      const found = list.find((i) => i.id === id);
      if (!found) {
        setActiveInt(null);
        return;
      }
      if (found.data && found.data.days) {
        setActiveInt(found);
        return;
      }
      try {
        const res = await interventionService.getById(id);
        if (res.data) {
          setActiveInt(res.data);
          setInterventions((prev) => prev.map((i) => (i.id === id ? res.data! : i)));
        }
      } catch {
        setActiveInt(null);
      }
    },
    []
  );

  // Load full simulation + its interventions whenever the selection changes.
  useEffect(() => {
    if (selectedSimId === null) return;
    let cancelled = false;
    setLoadingDetail(true);
    setActiveInt(null);
    (async () => {
      try {
        const [simRes, intRes] = await Promise.all([
          simulationService.getById(selectedSimId),
          interventionService.getBySimulationId(selectedSimId).catch(() => ({ data: [] })),
        ]);
        if (cancelled) return;
        if (simRes.data) setFullSim(simRes.data);
        const list = intRes?.data ?? [];
        setInterventions(list);

        if (pendingIntRef.current !== null) {
          const pid = pendingIntRef.current;
          pendingIntRef.current = null;
          await activateIntervention(pid, list);
        } else {
          setSelectedIntId(null);
          setActiveInt(null);
        }
      } catch {
        if (!cancelled) setFullSim(null);
      } finally {
        if (!cancelled) setLoadingDetail(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedSimId, activateIntervention]);

  const engine = useMemo(() => {
    if (!fullSim) return null;
    const data = activeInt?.data ?? fullSim.data;
    const events = activeInt?.events ?? [];
    return new DotReplayEngine({
      data,
      modelType: fullSim.model_type,
      population: fullSim.parameters.population,
      initialInfected: fullSim.parameters.initial_infected,
      initialExposed: fullSim.parameters.initial_exposed,
      events,
      dotCount,
      width: 1000,
      height: 600,
      seed: (fullSim.id * 7919 + (activeInt?.id ?? 0) * 104729 + dotCount) % 2147483647,
    });
  }, [fullSim, activeInt, dotCount]);

  const stats = activeInt?.stats ?? fullSim?.stats ?? null;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-8 w-full space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-8 border-b border-border">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <CircleDot className="w-7 h-7 text-muted-foreground" />
              Outbreak Lab
            </h1>
            <p className="text-sm text-muted-foreground max-w-xl">
              Watch a saved simulation replay as a living population. Every dot is a group of
              people — the colors track the exact curve your model produced.
            </p>
          </div>
          {fullSim && (
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span
                className={
                  "px-2.5 py-0.5 rounded-md border text-[11px] font-bold tracking-wider " +
                  (fullSim.model_type === "SIR"
                    ? "text-blue-500 bg-blue-500/5 border-blue-500/20"
                    : "text-orange-500 bg-orange-500/5 border-orange-500/20")
                }
              >
                {fullSim.model_type} MODEL
              </span>
              <span className="font-medium text-foreground truncate max-w-[220px]">
                {activeInt ? activeInt.name : fullSim.name}
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8">
          {/* Left rail */}
          <div className="space-y-6 min-w-0">
            <div className="p-6 border border-border rounded-2xl bg-card">
              <ReplayPicker
                sims={sims}
                selectedSimId={selectedSimId}
                onSelectSim={setSelectedSimId}
                interventions={interventions}
                selectedIntId={selectedIntId}
                onSelectInt={(id) => activateIntervention(id, interventions)}
                dotCount={dotCount}
                onDotCountChange={setDotCount}
                peoplePerDot={engine?.peoplePerDot ?? 0}
                loadingSims={loadingSims}
                loadingDetail={loadingDetail}
              />
            </div>

            {/* Legend */}
            <div className="p-6 border border-border rounded-2xl bg-card space-y-3">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                Legend
              </h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                <LegendItem color="var(--color-susceptible)" label="Susceptible" />
                <LegendItem color="var(--color-exposed)" label="Exposed" />
                <LegendItem color="var(--color-infected)" label="Infected" />
                <LegendItem color="var(--color-recovered)" label="Recovered" />
              </div>
              <div className="pt-2 border-t border-border space-y-1.5 text-[11px] text-muted-foreground">
                <p>
                  <span className="inline-block w-2.5 h-2.5 rounded-full border-2 border-teal-500 mr-1.5 align-middle" />
                  Teal ring — vaccinated
                </p>
                <p>
                  <span className="inline-block w-2.5 h-2.5 rounded-full border border-muted-foreground mr-1.5 align-middle" />
                  Faint bubble — staying home
                </p>
                <p>
                  <span className="inline-block w-2.5 h-2.5 rounded-full border-2 border-dashed border-orange-500 mr-1.5 align-middle" />
                  Dashed ring — quarantined
                </p>
              </div>
            </div>

            {/* Fidelity note */}
            <div className="p-4 border border-border rounded-xl bg-muted/20 flex gap-2.5 text-[11px] leading-relaxed text-muted-foreground">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <p>
                The replay is faithful to the saved run: compartment counts match the curve exactly
                each day. New infections seed near infectious dots so the spread reads as
                contact-driven.
              </p>
            </div>
          </div>

          {/* Stage */}
          <div className="min-w-0">
            {engine && stats ? (
              <DotCanvas engine={engine} stats={stats} />
            ) : (
              <div className="flex flex-col items-center justify-center h-[480px] border border-dashed border-border rounded-xl bg-muted/20 text-center">
                <CircleDot className="w-12 h-12 text-muted-foreground/20 mb-4" />
                <p className="text-sm text-muted-foreground">
                  {loadingSims || loadingDetail
                    ? "Loading simulation…"
                    : "Select a simulation to begin the replay"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}
