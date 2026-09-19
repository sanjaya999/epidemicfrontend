"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowRight, Siren } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getErrorMessage } from "@/lib/error";
import { surveillanceService } from "@/services/surveillance.service";
import type { Outbreak, OutbreakStatus } from "@/types/surveillance";

const filters: Array<{ label: string; value: "" | OutbreakStatus }> = [
  { label: "Open", value: "suspected" },
  { label: "Active", value: "active" },
  { label: "Monitoring", value: "monitoring" },
  { label: "Resolved", value: "resolved" },
  { label: "All", value: "" },
];

function statusLabel(status: OutbreakStatus) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export default function OutbreaksPage() {
  const [outbreaks, setOutbreaks] = useState<Outbreak[]>([]);
  const [filter, setFilter] = useState<"" | OutbreakStatus>("suspected");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await surveillanceService.getOutbreaks(
        filter ? { status: filter } : undefined
      );
      setOutbreaks(response.data);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to load outbreaks"));
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="w-full p-5 md:p-8">
      <header className="mb-6 flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Siren className="h-6 w-6 text-muted-foreground" />
            Outbreaks
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Incidents created automatically when submitted reports reach a configured detection rule.
          </p>
        </div>
        <div className="flex flex-wrap gap-1 rounded-md border p-1">
          {filters.map((item) => (
            <button
              key={item.label}
              onClick={() => setFilter(item.value)}
              className={cn(
                "rounded px-3 py-1.5 text-xs font-medium transition-colors",
                filter === item.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </header>

      <section className="overflow-hidden border bg-card">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h2 className="font-semibold">Incident queue</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Review the evidence before moving into forecasting and response.
            </p>
          </div>
          <span className="font-mono text-sm text-muted-foreground">{outbreaks.length}</span>
        </div>

        {loading ? (
          <div className="space-y-3 p-5">
            {[0, 1, 2].map((item) => <div key={item} className="h-16 animate-pulse rounded bg-muted" />)}
          </div>
        ) : outbreaks.length === 0 ? (
          <div className="px-6 py-20 text-center">
            <p className="font-medium">No {filter || "recorded"} outbreaks</p>
            <p className="mt-1 text-sm text-muted-foreground">
              New incidents will appear when a case report reaches its disease threshold.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="border-b bg-muted/50 text-left text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">Incident</th>
                  <th className="px-5 py-3 font-medium">Location</th>
                  <th className="px-5 py-3 font-medium">Organization</th>
                  <th className="px-5 py-3 text-right font-medium">Detection evidence</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 text-right font-medium">Review</th>
                </tr>
              </thead>
              <tbody>
                {outbreaks.map((outbreak) => (
                  <tr key={outbreak.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-5 py-4">
                      <p className="font-medium">{outbreak.disease_name}</p>
                      <p className="mt-0.5 font-mono text-xs text-muted-foreground">Incident #{outbreak.id}</p>
                    </td>
                    <td className="px-5 py-4">{outbreak.location_name}</td>
                    <td className="px-5 py-4 text-muted-foreground">{outbreak.organization_name}</td>
                    <td className="px-5 py-4 text-right tabular-nums">
                      <p className="font-medium">{outbreak.trigger_evidence.confirmed_cases} confirmed</p>
                      <p className="text-xs text-muted-foreground">
                        threshold {outbreak.trigger_evidence.case_threshold} / {outbreak.trigger_evidence.window_days} days
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-medium">
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {statusLabel(outbreak.status)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/outbreaks/${outbreak.id}`}>
                          Open <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
