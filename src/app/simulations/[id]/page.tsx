"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SimulationChart } from "@/components/simulation/SimulationChart";
import { SimulationStats } from "@/components/simulation/SimulationStats";
import { simulationService } from "@/services/simulation.service";
import { interventionService, InterventionSimulation, Preset } from "@/services/intervention.service";
import { Simulation } from "@/types/simulation";
import { toast } from "sonner";

export default function SimulationDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [simulation, setSimulation] = useState<Simulation | null>(null);
  const [interventions, setInterventions] = useState<InterventionSimulation[]>([]);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [selectedIntervention, setSelectedIntervention] = useState<InterventionSimulation | null>(null);
  const [mergeChart, setMergeChart] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Intervention form state
  const [showInterventionForm, setShowInterventionForm] = useState(false);
  const [interventionName, setInterventionName] = useState("");
  
  const [events, setEvents] = useState([{
    presetType: "",
    startDay: 10,
    endDay: 30,
    intensity: 50
  }]);

  const [isRunningIntervention, setIsRunningIntervention] = useState(false);

  useEffect(() => {
    async function fetch() {
      try {
        const simId = Number(id);
        const [simRes, intRes, presetsRes] = await Promise.all([
          simulationService.getById(simId),
          interventionService.getBySimulationId(simId).catch(() => ({ data: [] })),
          interventionService.getPresets().catch(() => ({ data: [] })),
        ]);
        
        if (simRes.data) setSimulation(simRes.data);
        if (intRes?.data) {
          setInterventions(intRes.data);
        }
        if (presetsRes?.data) setPresets(presetsRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetch();
  }, [id]);

  const handleSelectIntervention = async (int: InterventionSimulation) => {
    if (selectedIntervention?.id === int.id) {
      setSelectedIntervention(null);
      return;
    }

    // If we already have the simulation data, just set it
    if (int.data && int.data.days) {
      setSelectedIntervention(int);
      return;
    }

    try {
      const res = await interventionService.getById(int.id);
      if (res.data) {
        setInterventions(prev => prev.map(item => item.id === int.id ? res.data! : item));
        setSelectedIntervention(res.data);
      }
    } catch (err) {
      toast.error("Failed to fetch intervention details");
    }
  };

  const handleRunIntervention = async () => {
    if (!simulation) return;
    
    const validEvents = events.filter(e => e.presetType);
    if (validEvents.length === 0) return;
    
    setIsRunningIntervention(true);
    try {
      const formattedEvents = validEvents.map(e => {
        const preset = presets.find(p => p.type === e.presetType)!;
        return {
          day: e.startDay,
          end_day: e.endDay,
          type: preset.type,
          label: preset.label,
          intensity: e.intensity,
          math_effect: preset.math_effect
        };
      });

      const res = await interventionService.run({
        name: interventionName || `${formattedEvents.length} Event Intervention`,
        simulation_id: simulation.id,
        events: formattedEvents
      });
      if (res.data) {
        setInterventions(prev => [...prev, res.data!]);
        setSelectedIntervention(res.data);
        setShowInterventionForm(false);
        setEvents([{ presetType: "", startDay: 10, endDay: 30, intensity: 50 }]);
        setInterventionName("");
        toast.success("Intervention applied successfully!");
      }
    } catch (err) {
      toast.error("Failed to run intervention");
    } finally {
      setIsRunningIntervention(false);
    }
  };

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
          stats={selectedIntervention && !mergeChart ? selectedIntervention.stats : simulation.stats}
          population={simulation.parameters.population}
        />

        {/* Interventions Section */}
        <div className="p-8 border border-border rounded-2xl bg-card space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
              Interventions
            </h3>
            <Button size="sm" onClick={() => setShowInterventionForm(!showInterventionForm)}>
              <Plus size={16} className="mr-2" />
              Add Intervention
            </Button>
          </div>

          {showInterventionForm && presets.length > 0 && (
            <div className="p-6 border border-border rounded-xl bg-muted/20 space-y-4">
              <div className="space-y-4">
                <div className="space-y-2 max-w-sm">
                  <Label>Intervention Set Name</Label>
                  <Input value={interventionName} onChange={e => setInterventionName(e.target.value)} placeholder="e.g. COVID + lockdown" />
                </div>
                
                <div className="space-y-4 border-t border-border pt-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold">Events</Label>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setEvents([...events, { presetType: "", startDay: 10, endDay: 30, intensity: 50 }])}
                    >
                      <Plus size={14} className="mr-1" /> Add Event
                    </Button>
                  </div>
                  
                  {events.map((event, index) => (
                    <div key={index} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 p-4 border border-border rounded-lg bg-card relative">
                      {events.length > 1 && (
                        <button 
                          className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs"
                          onClick={() => setEvents(events.filter((_, i) => i !== index))}
                        >×</button>
                      )}
                      <div className="space-y-2">
                        <Label>Preset</Label>
                        <select 
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={event.presetType}
                          onChange={(e) => {
                            const v = e.target.value;
                            const p = presets.find(x => x.type === v);
                            const newEvents = [...events];
                            newEvents[index].presetType = v;
                            if (p) newEvents[index].intensity = p.default_intensity;
                            setEvents(newEvents);
                          }}
                        >
                          <option value="">Select a preset...</option>
                          {presets.map(p => (
                            <option key={p.type} value={p.type}>{p.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label>Start Day</Label>
                        <Input 
                          type="number" 
                          value={event.startDay} 
                          onChange={e => {
                            const newEvents = [...events];
                            newEvents[index].startDay = Number(e.target.value);
                            setEvents(newEvents);
                          }} 
                          min={0} 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>End Day</Label>
                        <Input 
                          type="number" 
                          value={event.endDay} 
                          onChange={e => {
                            const newEvents = [...events];
                            newEvents[index].endDay = Number(e.target.value);
                            setEvents(newEvents);
                          }} 
                          min={event.startDay} 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Intensity (%)</Label>
                        <Input 
                          type="number" 
                          value={event.intensity} 
                          onChange={e => {
                            const newEvents = [...events];
                            newEvents[index].intensity = Number(e.target.value);
                            setEvents(newEvents);
                          }} 
                          min={0} max={100} 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end pt-4 border-t border-border">
                <Button onClick={handleRunIntervention} disabled={!events.some(e => e.presetType) || isRunningIntervention}>
                  {isRunningIntervention ? "Running..." : "Run Intervention"}
                </Button>
              </div>
            </div>
          )}

          {interventions.length > 0 && (
            <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-border">
              <span className="text-sm font-medium">Applied Interventions:</span>
              {interventions.map(int => (
                <Button 
                  key={int.id} 
                  variant={selectedIntervention?.id === int.id ? "default" : "outline"} 
                  size="sm"
                  onClick={() => handleSelectIntervention(int)}
                >
                  {selectedIntervention?.id === int.id && <Check size={14} className="mr-1.5" />}
                  {int.name}
                </Button>
              ))}

              <div className="ml-auto flex items-center gap-2">
                <Label htmlFor="merge-toggle" className="text-sm cursor-pointer">Compare with Base</Label>
                <input 
                  id="merge-toggle"
                  type="checkbox" 
                  className="w-4 h-4 rounded border-gray-300"
                  checked={mergeChart} 
                  onChange={e => setMergeChart(e.target.checked)} 
                />
              </div>
            </div>
          )}
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 gap-8">
          {/* Chart Section */}
          <div className="p-8 border border-border rounded-2xl bg-card space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                Epidemic Growth Curve {selectedIntervention && !mergeChart ? "(Intervention)" : ""}
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
                interventionData={selectedIntervention?.data}
                merge={mergeChart}
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