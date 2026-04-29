"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { simulationService } from "@/services/simulation.service";
import { useSimulationStore } from "@/store/use-simulation-store";
import { RunSimulationRequest, ModelType } from "@/types/simulation";

export function SimulationForm() {
  const router = useRouter();
  const { addSimulation, setCurrentSimulation } = useSimulationStore();
  const [isLoading, setIsLoading] = useState(false);

  const [form, setForm] = useState<RunSimulationRequest>({
    name: "",
    model_type: "SIR",
    population: 1_000_000,
    initial_infected: 100,
    initial_exposed: null,
    days: 160,
    beta: 0.3,
    gamma: 0.05,
    sigma: null,
  });

  const r0 = form.gamma > 0 ? (form.beta / form.gamma).toFixed(2) : "—";
  const herdImmunity =
    form.gamma > 0
      ? ((1 - form.gamma / form.beta) * 100).toFixed(1)
      : "—";

  function handleChange(field: keyof RunSimulationRequest, value: unknown) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit() {
    if (!form.name.trim()) {
      toast.error("Give your simulation a name");
      return;
    }
    if (form.model_type === "SEIR" && !form.sigma) {
      toast.error("SEIR model requires sigma (incubation rate)");
      return;
    }

    setIsLoading(true);
    try {
      const response = await simulationService.run(form);
      if (response.data) {
        setCurrentSimulation(response.data);
        addSimulation({
          id: response.data.id,
          name: response.data.name,
          model_type: response.data.model_type,
          parameters: response.data.parameters,
          stats: response.data.stats,
          created_at: response.data.created_at,
        });
        toast.success("Simulation completed");
        router.push(`/simulations/${response.data.id}`);
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">

      {/* Name */}
      <div className="space-y-1.5">
        <Label>Simulation Name</Label>
        <Input
          placeholder="e.g. COVID baseline run"
          value={form.name}
          onChange={(e) => handleChange("name", e.target.value)}
        />
      </div>

      {/* Model type */}
      <div className="space-y-1.5">
        <Label>Model Type</Label>
        <div className="flex gap-2">
          {(["SIR", "SEIR"] as ModelType[]).map((type) => (
            <button
              key={type}
              onClick={() => handleChange("model_type", type)}
              className={`px-4 py-1.5 text-sm border rounded-sm transition-colors ${
                form.model_type === type
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-transparent text-muted-foreground border-border hover:border-foreground hover:text-foreground"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Core parameters */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Population</Label>
          <Input
            type="number"
            value={form.population}
            onChange={(e) => handleChange("population", Number(e.target.value))}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Initial Infected</Label>
          <Input
            type="number"
            value={form.initial_infected}
            onChange={(e) =>
              handleChange("initial_infected", Number(e.target.value))
            }
          />
        </div>
        <div className="space-y-1.5">
          <Label>Days</Label>
          <Input
            type="number"
            value={form.days}
            onChange={(e) => handleChange("days", Number(e.target.value))}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Beta (β) — transmission rate</Label>
          <Input
            type="number"
            step="0.01"
            value={form.beta}
            onChange={(e) => handleChange("beta", Number(e.target.value))}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Gamma (γ) — recovery rate</Label>
          <Input
            type="number"
            step="0.01"
            value={form.gamma}
            onChange={(e) => handleChange("gamma", Number(e.target.value))}
          />
        </div>

        {/* SEIR only fields */}
        {form.model_type === "SEIR" && (
          <>
            <div className="space-y-1.5">
              <Label>Sigma (σ) — incubation rate</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="e.g. 0.2"
                value={form.sigma ?? ""}
                onChange={(e) =>
                  handleChange(
                    "sigma",
                    e.target.value ? Number(e.target.value) : null
                  )
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Initial Exposed</Label>
              <Input
                type="number"
                placeholder="0"
                value={form.initial_exposed ?? ""}
                onChange={(e) =>
                  handleChange(
                    "initial_exposed",
                    e.target.value ? Number(e.target.value) : null
                  )
                }
              />
            </div>
          </>
        )}
      </div>

      {/* Live R0 display */}
      <div className="flex gap-6 p-4 border border-border rounded-sm bg-card">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-1">
            R₀
          </p>
          <p className="text-xl font-semibold tabular-nums">
            {r0}
          </p>
        </div>
        <div className="w-px bg-border" />
        <div>
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-1">
            Herd Immunity Threshold
          </p>
          <p className="text-xl font-semibold tabular-nums">
            {herdImmunity}%
          </p>
        </div>
        <div className="w-px bg-border" />
        <div>
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-1">
            Avg Recovery
          </p>
          <p className="text-xl font-semibold tabular-nums">
            {form.gamma > 0 ? (1 / form.gamma).toFixed(0) : "—"} days
          </p>
        </div>
        {form.model_type === "SEIR" && form.sigma && (
          <>
            <div className="w-px bg-border" />
            <div>
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-1">
                Avg Incubation
              </p>
              <p className="text-xl font-semibold tabular-nums">
                {(1 / form.sigma).toFixed(0)} days
              </p>
            </div>
          </>
        )}
      </div>

      <Button
        onClick={handleSubmit}
        disabled={isLoading}
        className="w-full"
      >
        {isLoading ? "Running simulation..." : "Run Simulation"}
      </Button>
    </div>
  );
}