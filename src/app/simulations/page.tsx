"use client";

import { useRouter } from "next/navigation";
import { Plus, FlaskConical, LineChart } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SimulationsLandingPage() {
  const router = useRouter();

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 w-full">
      <div className="text-center space-y-6 max-w-2xl">
        <div className="inline-flex items-center justify-center p-4 rounded-3xl bg-primary/10 mb-2">
          <FlaskConical className="h-10 w-10 text-primary" />
        </div>
        
        <h1 className="text-4xl font-medium tracking-tight sm:text-5xl font-sans">
          Simulate Epidemic Models
        </h1>
        
        <p className="text-xl text-muted-foreground">
          Run sophisticated SIR and SEIR models to predict disease spread, analyze peaks, and understand herd immunity thresholds.
        </p>

        <div className="grid sm:grid-cols-2 gap-4 pt-8">
          <div className="p-6 rounded-2xl bg-card text-left space-y-4">
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <LineChart className="h-5 w-5 text-blue-500" />
            </div>
            <h3 className="font-bold text-lg">Predict Trends</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Visualize susceptible, infected, and recovered populations over time with high-precision charts.
            </p>
          </div>
          
          <div className="p-6 rounded-2xl bg-card text-left space-y-4">
            <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <FlaskConical className="h-5 w-5 text-orange-500" />
            </div>
            <h3 className="font-bold text-lg">Compare Models</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Switch between standard SIR and more complex SEIR models with incubation periods.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-10">
          <Button 
            size="lg" 
            className="h-14 px-8 text-lg font-bold gap-2 rounded-xl"
            onClick={() => router.push("/simulate")}
          >
            <Plus className="h-6 w-6" />
            New Simulation
          </Button>
        </div>
      </div>
    </div>
  );
}