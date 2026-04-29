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
import { ArrowLeft, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { z } from "zod";

const simulationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  model_type: z.enum(["SIR", "SEIR"]),
  population: z.number().positive("Population must be positive").max(1000000000, "Too high"),
  initial_infected: z.number().min(0).max(1000000000),
  initial_exposed: z.number().min(0).nullish(),
  days: z.number().int().positive().max(1000),
  beta: z.number().min(0).max(1),
  gamma: z.number().min(0).max(1),
  sigma: z.number().min(0).max(1).nullish(),
}).refine(data => data.initial_infected <= data.population, {
  message: "Infected count cannot exceed population",
  path: ["initial_infected"]
});

type FormErrors = Partial<Record<keyof RunSimulationRequest, string>>;

export default function SimulatePage() {
  const router = useRouter();
  const { addSimulation, setCurrentSimulation } = useSimulationStore();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const [form, setForm] = useState({
    name: "",
    model_type: "SIR" as ModelType,
    population: "1000000",
    initial_infected: "100",
    initial_exposed: "" as string,
    days: "160",
    beta: "0.3",
    gamma: "0.05",
    sigma: "" as string,
  });

  const numBeta = parseFloat(form.beta) || 0;
  const numGamma = parseFloat(form.gamma) || 0;
  const r0 = numGamma > 0 ? (numBeta / numGamma).toFixed(2) : "—";
  const herdImmunity = numGamma > 0 ? ((1 - numGamma / numBeta) * 100).toFixed(1) : "—";

  function handleChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof RunSimulationRequest]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }

  async function handleSubmit() {
    const rawData = {
      ...form,
      population: parseFloat(form.population),
      initial_infected: parseFloat(form.initial_infected),
      initial_exposed: form.initial_exposed ? parseFloat(form.initial_exposed) : null,
      days: parseInt(form.days),
      beta: parseFloat(form.beta),
      gamma: parseFloat(form.gamma),
      sigma: form.sigma ? parseFloat(form.sigma) : null,
    };

    const result = simulationSchema.safeParse(rawData);
    
    if (!result.success) {
      const fieldErrors: FormErrors = {};
      result.error.issues.forEach(issue => {
        const path = issue.path[0] as keyof RunSimulationRequest;
        fieldErrors[path] = issue.message;
      });
      setErrors(fieldErrors);
      toast.error("Please fix the errors in the form");
      return;
    }

    setIsLoading(true);
    try {
      const response = await simulationService.run(result.data as RunSimulationRequest);
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
    <div className="flex-1 overflow-y-auto bg-background">
      <div className="p-8 w-full max-w-4xl mx-auto space-y-6">
        <div>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest mb-4"
          >
            <ArrowLeft size={14} />
            Back
          </button>
        </div>

        <div className="bg-card rounded-2xl p-8 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Simulation Name</Label>
                <Info size={12} className="text-muted-foreground/30" />
              </div>
              <Input
                placeholder="e.g. baseline_run_v1"
                value={form.name}
                className={cn(
                  "h-12 bg-muted/40 border-none px-4 focus-visible:ring-1 focus-visible:ring-primary/20",
                  errors.name && "ring-1 ring-destructive"
                )}
                onChange={(e) => handleChange("name", e.target.value)}
              />
              {errors.name && <p className="text-xs font-medium text-destructive/80">{errors.name}</p>}
            </div>

            <div className="space-y-3">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Mathematical Model</Label>
              <div className="flex p-1.5 bg-muted-foreground/10 rounded-xl h-12 border border-border/20 relative">
                {(["SIR", "SEIR"] as ModelType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => handleChange("model_type", type)}
                    className={cn(
                      "flex-1 rounded-lg text-xs font-bold transition-colors relative z-10",
                      form.model_type === type
                        ? "text-foreground"
                        : "text-muted-foreground/50 hover:text-foreground"
                    )}
                  >
                    {type}
                    {form.model_type === type && (
                      <motion.div
                        layoutId="activeModel"
                        className="absolute inset-0 bg-card rounded-lg shadow-sm ring-1 ring-border/20 z-[-1]"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/40"></div>
            </div>
            <div className="relative flex justify-start">
              <span className="bg-card pr-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                Configuration Parameters
              </span>
            </div>
          </div>

          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Population</Label>
                  <Info size={12} className="text-muted-foreground/30" />
                </div>
                <Input
                  value={form.population}
                  className={cn(
                    "h-12 bg-muted/40 border-none px-4 focus-visible:ring-1 focus-visible:ring-primary/20 font-mono",
                    errors.population && "ring-1 ring-destructive"
                  )}
                  onChange={(e) => handleChange("population", e.target.value)}
                />
                {errors.population && <p className="text-xs font-medium text-destructive/80">{errors.population}</p>}
              </div>
              <div className="space-y-3">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Initial Infected</Label>
                <Input
                  value={form.initial_infected}
                  className={cn(
                    "h-12 bg-muted/40 border-none px-4 focus-visible:ring-1 focus-visible:ring-primary/20 font-mono",
                    errors.initial_infected && "ring-1 ring-destructive"
                  )}
                  onChange={(e) => handleChange("initial_infected", e.target.value)}
                />
                {errors.initial_infected && <p className="text-xs font-medium text-destructive/80">{errors.initial_infected}</p>}
              </div>
              <div className="space-y-3">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Days to Simulate</Label>
                <Input
                  value={form.days}
                  className={cn(
                    "h-12 bg-muted/40 border-none px-4 focus-visible:ring-1 focus-visible:ring-primary/20 font-mono",
                    errors.days && "ring-1 ring-destructive"
                  )}
                  onChange={(e) => handleChange("days", e.target.value)}
                />
                {errors.days && <p className="text-xs font-medium text-destructive/80">{errors.days}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Beta (β) — Rate</Label>
                  <span className="text-xs font-bold font-mono px-2 py-1 bg-muted/40 rounded">{form.beta || "0"}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={form.beta || "0"}
                  className="w-full h-1.5 bg-muted-foreground/20 rounded-lg appearance-none cursor-pointer accent-primary"
                  onChange={(e) => handleChange("beta", e.target.value)}
                />
                {errors.beta && <p className="text-xs font-medium text-destructive/80">{errors.beta}</p>}
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Gamma (γ) — Rate</Label>
                  <span className="text-xs font-bold font-mono px-2 py-1 bg-muted/40 rounded">{form.gamma || "0"}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={form.gamma || "0"}
                  className="w-full h-1.5 bg-muted-foreground/20 rounded-lg appearance-none cursor-pointer accent-primary"
                  onChange={(e) => handleChange("gamma", e.target.value)}
                />
                {errors.gamma && <p className="text-xs font-medium text-destructive/80">{errors.gamma}</p>}
              </div>

              <AnimatePresence mode="popLayout">
                {form.model_type === "SEIR" && (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-4"
                  >
                    <div className="flex justify-between items-center">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Sigma (σ) — Rate</Label>
                      <span className="text-xs font-bold font-mono px-2 py-1 bg-muted/40 rounded">{form.sigma || "0.2"}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={form.sigma || "0.2"}
                      className="w-full h-1.5 bg-muted-foreground/20 rounded-lg appearance-none cursor-pointer accent-primary"
                      onChange={(e) => handleChange("sigma", e.target.value)}
                    />
                    {errors.sigma && <p className="text-xs font-medium text-destructive/80">{errors.sigma}</p>}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 p-8 bg-muted/30 rounded-2xl">
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Calculated R₀
              </p>
              <p className="text-4xl font-bold tabular-nums">
                {r0}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Herd Immunity
              </p>
              <p className="text-4xl font-bold tabular-nums">
                {herdImmunity}%
              </p>
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full h-14 text-base font-bold rounded-xl bg-primary text-primary-foreground transition-all active:scale-[0.99]"
          >
            {isLoading ? "Generating..." : "Generate Simulation Data"}
          </Button>
        </div>
      </div>
    </div>
  );
}