"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SensitivityChart } from "@/components/simulation/SensitivityChart";

export default function SensitivityPage() {
  const params = useParams<{ id: string }>();
  const simulationId = Number(params?.id);
  const valid = Number.isFinite(simulationId) && simulationId > 0;

  return (
    <div className="p-8 w-full max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 pb-6 border-b border-border">
        {valid && (
          <Link href={`/simulations/${simulationId}`}>
            <Button variant="ghost" size="icon" title="Back to simulation">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
        )}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sensitivity Analysis</h1>
          <p className="text-sm text-muted-foreground mt-1">
            How R₀, peak, and total infections respond to parameter changes
          </p>
        </div>
      </div>

      {valid ? (
        <SensitivityChart simulationId={simulationId} />
      ) : (
        <p className="text-sm text-muted-foreground">Invalid simulation id.</p>
      )}
    </div>
  );
}
