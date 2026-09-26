"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, ChevronRight, ClipboardCheck, Siren } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getErrorMessage } from "@/lib/error";
import { responsePlanService } from "@/services/response-plan.service";
import type { ResponsePlanStatus, ResponsePlanSummary } from "@/types/response-plan";

type Filter = "all" | ResponsePlanStatus;

const filters: Array<{ value: Filter; label: string }> = [
  { value: "all", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "approved", label: "Approved" },
  { value: "completed", label: "Completed" },
];

export default function ResponsePlansPage() {
  const [plans, setPlans] = useState<ResponsePlanSummary[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const response = await responsePlanService.getAll();
      setPlans(response.data);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to load response plans"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(
    () => (filter === "all" ? plans : plans.filter((plan) => plan.status === filter)),
    [filter, plans]
  );

  return (
    <div className="w-full p-5 md:p-8">
      <header className="mb-6 flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <ClipboardCheck className="h-6 w-6 text-muted-foreground" />
            Response plans
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Compare modeled interventions, approve a response and track field actions.
          </p>
        </div>
        <div className="flex border p-1">
          {filters.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setFilter(item.value)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium",
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

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-24 animate-pulse border bg-card" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="border border-dashed px-6 py-20 text-center">
          <Siren className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 font-medium">No response plans in this view</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            Open a forecasted outbreak and create its response plan from the incident workspace.
          </p>
          <Button asChild variant="outline" className="mt-5">
            <Link href="/outbreaks">Open outbreak queue</Link>
          </Button>
        </div>
      ) : (
        <div className="border bg-card">
          <div className="divide-y">
            {visible.map((plan) => {
              const progress = plan.action_count
                ? `${plan.completed_action_count}/${plan.action_count} actions closed`
                : "No actions assigned";
              return (
                <article key={plan.id} className="grid gap-4 p-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-full border px-2.5 py-1 text-xs font-medium capitalize">
                        {plan.status}
                      </span>
                      <span className="font-mono text-xs text-muted-foreground">
                        Incident #{plan.outbreak_id}
                      </span>
                    </div>
                    <h2 className="font-semibold">{plan.disease_name} in {plan.location_name}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {plan.organization_name} · {plan.scenario_count} candidate scenario{plan.scenario_count === 1 ? "" : "s"}
                    </p>
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                      {plan.status === "completed" && <CheckCircle2 className="h-3.5 w-3.5" />}
                      {plan.selected_scenario_name ?? "No scenario approved"} · {progress}
                    </p>
                  </div>
                  <Button asChild variant="outline">
                    <Link href={`/response-plans/${plan.id}`}>
                      Open plan <ChevronRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </article>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
