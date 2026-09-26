"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarClock,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Plus,
  Scale,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { ResponseScenarioChart } from "@/components/response-scenario-chart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { getErrorMessage } from "@/lib/error";
import { interventionService, type Preset } from "@/services/intervention.service";
import { responsePlanService } from "@/services/response-plan.service";
import type {
  ResponseActionStatus,
  ResponseAssignee,
  ResponsePlan,
  ResponseScenario,
} from "@/types/response-plan";

const actionStatuses: Array<{ value: ResponseActionStatus; label: string }> = [
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

function displayRole(role: string) {
  return role.replaceAll("_", " ");
}

function metric(value: number) {
  return Math.round(value).toLocaleString();
}

export default function ResponsePlanDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const planId = Number(params.id);
  const [plan, setPlan] = useState<ResponsePlan | null>(null);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [assignees, setAssignees] = useState<ResponseAssignee[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState<string | null>(null);
  const [scenario, setScenario] = useState({
    name: "",
    presetType: "",
    startDay: "1",
    endDay: "30",
    intensity: "",
  });
  const [action, setAction] = useState({
    title: "",
    description: "",
    assignedTo: "",
    dueDate: "",
  });

  const load = useCallback(async () => {
    try {
      const [planResponse, presetResponse, assigneeResponse] = await Promise.all([
        responsePlanService.get(planId),
        interventionService.getPresets(),
        responsePlanService.getAssignees(),
      ]);
      const loadedPlan = planResponse.data ?? null;
      const loadedPresets = presetResponse.data ?? [];
      setPlan(loadedPlan);
      setPresets(loadedPresets);
      setAssignees(assigneeResponse.data);
      if (loadedPlan) {
        setSelectedScenarioId(
          loadedPlan.selected_scenario_id ?? loadedPlan.scenarios[0]?.id ?? null
        );
      }
      if (loadedPresets.length > 0) {
        const first = loadedPresets[0];
        setScenario((current) => ({
          ...current,
          name: first.label,
          presetType: first.type,
          intensity: String(Math.round(first.default_intensity * 100)),
        }));
      }
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to load response plan"));
      router.replace("/response-plans");
    } finally {
      setLoading(false);
    }
  }, [planId, router]);

  useEffect(() => {
    if (Number.isFinite(planId)) load();
  }, [load, planId]);

  const selectedPreset = useMemo(
    () => presets.find((item) => item.type === scenario.presetType),
    [presets, scenario.presetType]
  );
  const selectedScenario = useMemo(
    () => plan?.scenarios.find((item) => item.id === selectedScenarioId),
    [plan, selectedScenarioId]
  );
  const approvedScenario = useMemo(
    () => plan?.scenarios.find((item) => item.id === plan.selected_scenario_id),
    [plan]
  );

  function choosePreset(type: string) {
    const preset = presets.find((item) => item.type === type);
    if (!preset) return;
    setScenario((current) => ({
      ...current,
      name: preset.label,
      presetType: preset.type,
      intensity: String(Math.round(preset.default_intensity * 100)),
    }));
  }

  async function createScenario() {
    if (!plan || !selectedPreset || !scenario.name.trim()) {
      toast.error("Choose an intervention and name the scenario");
      return;
    }
    const startDay = Number(scenario.startDay);
    const endDay = Number(scenario.endDay);
    const intensity = Number(scenario.intensity) / 100;
    const horizon = plan.baseline.data.days[plan.baseline.data.days.length - 1] ?? 0;
    if (!Number.isFinite(startDay) || startDay < 0 || startDay >= horizon) {
      toast.error(`Start day must be between 0 and ${Math.max(0, horizon - 1)}`);
      return;
    }
    if (!Number.isFinite(intensity) || intensity <= 0 || intensity >= 1) {
      toast.error("Intensity must be between 1% and 99%");
      return;
    }
    const isVaccination = selectedPreset.math_effect === "vaccination";
    if (!isVaccination && (!Number.isFinite(endDay) || endDay <= startDay || endDay > horizon)) {
      toast.error(`End day must be after the start and no later than day ${horizon}`);
      return;
    }

    setWorking("scenario");
    try {
      const response = await responsePlanService.addScenario(plan.id, {
        name: scenario.name.trim(),
        events: [
          {
            day: startDay,
            type: selectedPreset.type,
            label: selectedPreset.label,
            intensity,
            ...(isVaccination ? {} : { end_day: endDay }),
            math_effect: selectedPreset.math_effect,
          },
        ],
      });
      if (response.data) {
        setPlan(response.data);
        const newest = response.data.scenarios[response.data.scenarios.length - 1];
        if (newest) setSelectedScenarioId(newest.id);
      }
      toast.success("Response scenario calculated");
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to calculate scenario"));
    } finally {
      setWorking(null);
    }
  }

  async function approveScenario() {
    if (!plan || !selectedScenarioId) return;
    setWorking("approve");
    try {
      const response = await responsePlanService.approve(plan.id, selectedScenarioId);
      if (response.data) setPlan(response.data);
      toast.success("Response plan approved");
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to approve response plan"));
    } finally {
      setWorking(null);
    }
  }

  async function createAction() {
    if (!plan || action.title.trim().length < 3) {
      toast.error("Enter an action title");
      return;
    }
    setWorking("action");
    try {
      const response = await responsePlanService.addAction(plan.id, {
        title: action.title.trim(),
        description: action.description.trim() || null,
        assigned_to: action.assignedTo ? Number(action.assignedTo) : null,
        due_date: action.dueDate || null,
      });
      if (response.data) setPlan(response.data);
      setAction({ title: "", description: "", assignedTo: "", dueDate: "" });
      toast.success("Response action added");
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to add response action"));
    } finally {
      setWorking(null);
    }
  }

  async function updateAction(
    actionId: number,
    change: { status?: ResponseActionStatus; assigned_to?: number | null }
  ) {
    if (!plan) return;
    setWorking(`action-${actionId}`);
    try {
      await responsePlanService.updateAction(actionId, change);
      const response = await responsePlanService.get(plan.id);
      if (response.data) setPlan(response.data);
      toast.success("Response action updated");
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to update response action"));
    } finally {
      setWorking(null);
    }
  }

  if (loading || !plan) {
    return (
      <div className="w-full space-y-5 p-5 md:p-8">
        <div className="h-8 w-64 animate-pulse bg-muted" />
        <div className="h-36 animate-pulse border bg-card" />
        <div className="h-80 animate-pulse border bg-card" />
      </div>
    );
  }

  const interventionRange = selectedPreset?.intensity_range;
  const terminalActions = plan.actions.filter(
    (item) => item.status === "completed" || item.status === "cancelled"
  ).length;

  return (
    <div className="w-full p-5 md:p-8">
      <Link
        href="/response-plans"
        className="mb-5 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to response plans
      </Link>

      <header className="mb-6 flex flex-col gap-4 border-b pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full border px-2.5 py-1 text-xs font-medium capitalize">
              {plan.status}
            </span>
            <span className="font-mono text-xs text-muted-foreground">Plan #{plan.id}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            {plan.disease_name} response in {plan.location_name}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {plan.organization_name} · baseline from report #{plan.baseline.source_report_id ?? "unknown"}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href={`/outbreaks/${plan.outbreak_id}`}>Open incident #{plan.outbreak_id}</Link>
        </Button>
      </header>

      <section className="mb-6 grid border bg-card sm:grid-cols-2 lg:grid-cols-4">
        <div className="border-b p-5 sm:border-r lg:border-b-0">
          <p className="text-xs text-muted-foreground">No-action peak</p>
          <p className="mt-2 font-mono text-2xl font-semibold">
            {metric(plan.baseline.stats.peak_infected)}
          </p>
        </div>
        <div className="border-b p-5 lg:border-b-0 lg:border-r">
          <p className="text-xs text-muted-foreground">No-action total infected</p>
          <p className="mt-2 font-mono text-2xl font-semibold">
            {metric(plan.baseline.stats.total_infected)}
          </p>
        </div>
        <div className="border-b p-5 sm:border-b-0 sm:border-r">
          <p className="text-xs text-muted-foreground">Candidate scenarios</p>
          <p className="mt-2 font-mono text-2xl font-semibold">{plan.scenarios.length}</p>
        </div>
        <div className="p-5">
          <p className="text-xs text-muted-foreground">Response actions closed</p>
          <p className="mt-2 font-mono text-2xl font-semibold">
            {terminalActions}/{plan.actions.length}
          </p>
        </div>
      </section>

      {plan.status === "draft" && (
        <section className="mb-6 border bg-card">
          <div className="flex items-center gap-3 border-b px-5 py-4">
            <Scale className="h-5 w-5 text-muted-foreground" />
            <div>
              <h2 className="font-semibold">Add a candidate response</h2>
              <p className="text-xs text-muted-foreground">
                The model reruns the same outbreak forecast with the selected intervention.
              </p>
            </div>
          </div>
          <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-6">
            <div className="space-y-2 xl:col-span-2">
              <Label htmlFor="scenario-name">Scenario name</Label>
              <Input
                id="scenario-name"
                value={scenario.name}
                onChange={(event) => setScenario((current) => ({ ...current, name: event.target.value }))}
              />
            </div>
            <div className="space-y-2 xl:col-span-2">
              <Label htmlFor="scenario-type">Intervention</Label>
              <select
                id="scenario-type"
                value={scenario.presetType}
                onChange={(event) => choosePreset(event.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {presets.map((preset) => (
                  <option key={preset.type} value={preset.type}>{preset.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="scenario-start">Start day</Label>
              <Input
                id="scenario-start"
                type="number"
                min="0"
                value={scenario.startDay}
                onChange={(event) => setScenario((current) => ({ ...current, startDay: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="scenario-end">End day</Label>
              <Input
                id="scenario-end"
                type="number"
                min="1"
                disabled={selectedPreset?.math_effect === "vaccination"}
                value={scenario.endDay}
                onChange={(event) => setScenario((current) => ({ ...current, endDay: event.target.value }))}
              />
            </div>
            <div className="space-y-2 xl:col-span-2">
              <Label htmlFor="scenario-intensity">Intensity (%)</Label>
              <Input
                id="scenario-intensity"
                type="number"
                min={interventionRange?.[0] ? interventionRange[0] * 100 : 1}
                max={interventionRange?.[1] ? interventionRange[1] * 100 : 99}
                value={scenario.intensity}
                onChange={(event) => setScenario((current) => ({ ...current, intensity: event.target.value }))}
              />
            </div>
            <div className="flex items-end xl:col-span-4">
              <p className="text-sm leading-6 text-muted-foreground">
                {selectedPreset?.description}
              </p>
            </div>
            <div className="flex items-end justify-end xl:col-span-6">
              <Button onClick={createScenario} disabled={working === "scenario" || presets.length === 0}>
                <Plus className="mr-2 h-4 w-4" />
                {working === "scenario" ? "Calculating..." : "Calculate scenario"}
              </Button>
            </div>
          </div>
        </section>
      )}

      <section className="mb-6 border bg-card">
        <div className="flex flex-col gap-3 border-b px-5 py-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-semibold">Scenario comparison</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Select a candidate to compare against no intervention.
            </p>
          </div>
          {plan.status === "draft" && plan.scenarios.length > 0 && (
            <Button onClick={approveScenario} disabled={!selectedScenarioId || working === "approve"}>
              <Check className="mr-2 h-4 w-4" />
              {working === "approve" ? "Approving..." : "Approve selected scenario"}
            </Button>
          )}
          {approvedScenario && (
            <span className="inline-flex items-center gap-2 text-sm font-medium">
              <CheckCircle2 className="h-4 w-4" /> Approved: {approvedScenario.name}
            </span>
          )}
        </div>

        {plan.scenarios.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <ClipboardCheck className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 font-medium">No response scenarios yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Add an intervention above to compare it with the no-action forecast.
            </p>
          </div>
        ) : (
          <>
            <div className="divide-y">
              {plan.scenarios.map((item) => {
                const selected = item.id === selectedScenarioId;
                const approved = item.id === plan.selected_scenario_id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedScenarioId(item.id)}
                    className={cn(
                      "grid w-full gap-4 p-5 text-left lg:grid-cols-[minmax(180px,1fr)_repeat(4,minmax(110px,0.55fr))] lg:items-center",
                      selected && "bg-muted/50"
                    )}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={cn("h-3 w-3 rounded-full border", selected && "border-primary bg-primary")} />
                        <span className="font-semibold">{item.name}</span>
                        {approved && <span className="rounded-full border px-2 py-0.5 text-[10px] font-medium">Approved</span>}
                      </div>
                      <p className="mt-1 pl-5 text-xs text-muted-foreground">
                        {item.events[0]?.label} · {Math.round((item.events[0]?.intensity ?? 0) * 100)}% intensity
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Cases avoided</p>
                      <p className="mt-1 font-mono font-semibold">{metric(item.impact.cases_avoided)}</p>
                      <p className="text-xs text-muted-foreground">{item.impact.cases_avoided_percent.toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Peak reduction</p>
                      <p className="mt-1 font-mono font-semibold">{metric(item.impact.peak_reduction)}</p>
                      <p className="text-xs text-muted-foreground">{item.impact.peak_reduction_percent.toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Peak delay</p>
                      <p className="mt-1 font-mono font-semibold">
                        {item.impact.peak_delay_days > 0 ? "+" : ""}{item.impact.peak_delay_days} days
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Capacity</p>
                      <p className={cn(
                        "mt-1 font-medium",
                        item.impact.scenario_exceeds_capacity === true && "text-[#b42318]"
                      )}>
                        {item.impact.scenario_exceeds_capacity === null
                          ? "Not configured"
                          : item.impact.scenario_exceeds_capacity
                            ? "Still exceeded"
                            : "Within capacity"}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="border-t px-2 pb-3 pt-5 sm:px-5">
              <ResponseScenarioChart
                baseline={plan.baseline.data}
                scenario={selectedScenario?.data}
                capacity={plan.baseline.response_capacity}
              />
            </div>
          </>
        )}
      </section>

      {(plan.status === "approved" || plan.status === "completed") && (
        <section className="border bg-card">
          <div className="flex items-center gap-3 border-b px-5 py-4">
            <ClipboardCheck className="h-5 w-5 text-muted-foreground" />
            <div>
              <h2 className="font-semibold">Response action register</h2>
              <p className="text-xs text-muted-foreground">
                Assign operational work and keep its current status visible.
              </p>
            </div>
          </div>

          <div className="grid gap-4 border-b p-5 lg:grid-cols-2 xl:grid-cols-6">
            <div className="space-y-2 xl:col-span-2">
              <Label htmlFor="action-title">Action</Label>
              <Input
                id="action-title"
                value={action.title}
                onChange={(event) => setAction((current) => ({ ...current, title: event.target.value }))}
              />
            </div>
            <div className="space-y-2 xl:col-span-2">
              <Label htmlFor="action-assignee">Assigned to</Label>
              <select
                id="action-assignee"
                value={action.assignedTo}
                onChange={(event) => setAction((current) => ({ ...current, assignedTo: event.target.value }))}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Unassigned</option>
                {assignees.map((assignee) => (
                  <option key={assignee.id} value={assignee.id}>
                    {assignee.username} · {displayRole(assignee.role)}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="action-due">Due date</Label>
              <Input
                id="action-due"
                type="date"
                value={action.dueDate}
                onChange={(event) => setAction((current) => ({ ...current, dueDate: event.target.value }))}
              />
            </div>
            <div className="flex items-end justify-end">
              <Button onClick={createAction} disabled={working === "action"}>
                <Plus className="mr-2 h-4 w-4" />
                {working === "action" ? "Adding..." : "Add action"}
              </Button>
            </div>
            <div className="space-y-2 xl:col-span-6">
              <Label htmlFor="action-description">Operational details</Label>
              <textarea
                id="action-description"
                rows={2}
                maxLength={2000}
                value={action.description}
                onChange={(event) => setAction((current) => ({ ...current, description: event.target.value }))}
                className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>

          {plan.actions.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <p className="font-medium">No response actions assigned</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Add the first operational action for the approved scenario.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {plan.actions.map((item) => (
                <article key={item.id} className="grid gap-4 p-5 xl:grid-cols-[minmax(260px,1fr)_220px_170px_150px] xl:items-center">
                  <div>
                    <p className="font-semibold">{item.title}</p>
                    {item.description && (
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.description}</p>
                    )}
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <UserRound className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <select
                      aria-label={`Assignee for ${item.title}`}
                      value={item.assigned_to ?? ""}
                      disabled={working === `action-${item.id}`}
                      onChange={(event) => updateAction(item.id, {
                        assigned_to: event.target.value ? Number(event.target.value) : null,
                      })}
                      className="h-9 min-w-0 flex-1 rounded-md border border-input bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="">Unassigned</option>
                      {assignees.map((assignee) => (
                        <option key={assignee.id} value={assignee.id}>{assignee.username}</option>
                      ))}
                    </select>
                  </label>
                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CalendarClock className="h-4 w-4" />
                    {item.due_date ?? "No due date"}
                  </p>
                  <select
                    aria-label={`Status for ${item.title}`}
                    value={item.status}
                    disabled={working === `action-${item.id}`}
                    onChange={(event) => updateAction(item.id, {
                      status: event.target.value as ResponseActionStatus,
                    })}
                    className="h-9 rounded-md border border-input bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {actionStatuses.map((status) => (
                      <option key={status.value} value={status.value}>{status.label}</option>
                    ))}
                  </select>
                </article>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
