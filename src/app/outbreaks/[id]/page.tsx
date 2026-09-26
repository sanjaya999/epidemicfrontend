"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChartNoAxesCombined,
  CheckCircle2,
  FileClock,
  RefreshCw,
  ShieldAlert,
  BellRing,
  ClipboardCheck,
} from "lucide-react";
import { toast } from "sonner";
import { OutbreakForecastChart } from "@/components/outbreak-forecast-chart";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/error";
import { surveillanceService } from "@/services/surveillance.service";
import { responsePlanService } from "@/services/response-plan.service";
import type { OutbreakDetail } from "@/types/surveillance";

function humanizeAction(action: string) {
  const labels: Record<string, string> = {
    "outbreak.detected": "Detection rule created this incident",
    "outbreak.evidence_updated": "Detection evidence was updated",
    "forecast.generated": "Forecast and risk level were generated",
    "alert.created": "An internal alert was prepared",
    "alert.updated": "The internal alert was updated",
    "alert.published": "The alert was published",
    "alert.resolved": "The alert was resolved",
    "alert.expired": "The alert expired",
    "notification.acknowledged": "A recipient acknowledged the alert",
    "response_plan.created": "A response plan was opened",
    "response_scenario.created": "A response scenario was calculated",
    "response_plan.approved": "A response scenario was approved",
    "response_action.created": "A response action was assigned",
    "response_action.updated": "A response action was updated",
    "response_plan.completed": "All response actions were closed",
    "outbreak.resolved": "Incident was resolved",
  };
  return labels[action] ?? action.replaceAll(".", " ");
}

export default function OutbreakDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const outbreakId = Number(params.id);
  const [outbreak, setOutbreak] = useState<OutbreakDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [planning, setPlanning] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await surveillanceService.getOutbreak(outbreakId);
      setOutbreak(response.data ?? null);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to load outbreak"));
      router.replace("/outbreaks");
    } finally {
      setLoading(false);
    }
  }, [outbreakId, router]);

  useEffect(() => {
    if (Number.isFinite(outbreakId)) load();
  }, [load, outbreakId]);

  async function generateForecast() {
    setGenerating(true);
    try {
      const response = await surveillanceService.generateForecast(outbreakId);
      setOutbreak(response.data ?? null);
      toast.success(outbreak?.forecast ? "Forecast updated" : "Forecast generated");
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to generate forecast"));
    } finally {
      setGenerating(false);
    }
  }

  async function resolve() {
    setResolving(true);
    try {
      const response = await surveillanceService.resolveOutbreak(outbreakId);
      setOutbreak(response.data ?? null);
      toast.success("Outbreak resolved");
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to resolve outbreak"));
    } finally {
      setResolving(false);
    }
  }

  async function openResponsePlan() {
    setPlanning(true);
    try {
      const existing = await responsePlanService.getByOutbreak(outbreakId);
      if (existing.data.length > 0) {
        router.push(`/response-plans/${existing.data[0].id}`);
        return;
      }
      const response = await responsePlanService.create(outbreakId);
      if (response.data) {
        router.push(`/response-plans/${response.data.id}`);
      }
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to open response plan"));
    } finally {
      setPlanning(false);
    }
  }

  if (loading || !outbreak) {
    return (
      <div className="w-full space-y-5 p-5 md:p-8">
        <div className="h-8 w-64 animate-pulse rounded bg-muted" />
        <div className="h-40 animate-pulse border bg-card" />
        <div className="h-72 animate-pulse border bg-card" />
      </div>
    );
  }

  const evidence = outbreak.trigger_evidence;
  const latest = outbreak.reports[0];
  const forecast = outbreak.forecast;
  const risk = outbreak.risk_evidence;

  return (
    <div className="w-full p-5 md:p-8">
      <Link href="/outbreaks" className="mb-5 inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to outbreak queue
      </Link>

      <header className="mb-6 flex flex-col gap-4 border-b border-border pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {outbreak.risk_level && (
              <span className="rounded-full bg-primary px-2.5 py-1 text-xs font-semibold capitalize text-primary-foreground">
                {outbreak.risk_level} risk
              </span>
            )}
            <span className="rounded-full border px-2.5 py-1 text-xs font-medium capitalize">{outbreak.status}</span>
            <span className="font-mono text-xs text-muted-foreground">Incident #{outbreak.id}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{outbreak.disease_name} in {outbreak.location_name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {outbreak.organization_name} · detected {new Date(outbreak.detected_at).toLocaleString()}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {forecast && outbreak.status !== "resolved" && (
            <Button variant="outline" onClick={openResponsePlan} disabled={planning}>
              <ClipboardCheck className="mr-2 h-4 w-4" />
              {planning ? "Opening..." : "Response plan"}
            </Button>
          )}
          <Button asChild variant="outline">
            <Link href="/alerts">
              <BellRing className="mr-2 h-4 w-4" /> Manage alerts
            </Link>
          </Button>
          <Button onClick={generateForecast} disabled={generating}>
            <RefreshCw className={`mr-2 h-4 w-4 ${generating ? "animate-spin" : ""}`} />
            {generating ? "Generating..." : forecast ? "Update forecast" : "Generate forecast"}
          </Button>
          {outbreak.status !== "resolved" && (
            <Button variant="outline" onClick={resolve} disabled={resolving}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              {resolving ? "Resolving..." : "Resolve incident"}
            </Button>
          )}
        </div>
      </header>

      {forecast && risk ? (
        <>
          <section className="mb-6 border bg-primary text-primary-foreground">
            <div className="grid md:grid-cols-[minmax(0,1.35fr)_minmax(260px,0.65fr)]">
              <div className="border-b border-primary-foreground/20 p-6 md:border-b-0 md:border-r">
                <p className="text-sm font-semibold capitalize">{outbreak.risk_level} projected risk</p>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-primary-foreground/75">{risk.explanation}</p>
              </div>
              <div className="p-6">
                <p className="text-xs text-primary-foreground/60">Projected peak date</p>
                <p className="mt-2 font-mono text-xl font-semibold">{risk.projected_peak_date}</p>
              </div>
            </div>
          </section>

          <section className="mb-6 grid border bg-card md:grid-cols-4">
            <div className="border-b p-5 md:border-b-0 md:border-r">
              <p className="text-xs text-muted-foreground">Projected peak active</p>
              <p className="mt-2 font-mono text-2xl font-semibold">{Math.round(forecast.stats.peak_infected).toLocaleString()}</p>
            </div>
            <div className="border-b p-5 md:border-b-0 md:border-r">
              <p className="text-xs text-muted-foreground">Time to peak</p>
              <p className="mt-2 font-mono text-2xl font-semibold">{forecast.stats.peak_day} days</p>
            </div>
            <div className="border-b p-5 md:border-b-0 md:border-r">
              <p className="text-xs text-muted-foreground">Capacity use at peak</p>
              <p className="mt-2 font-mono text-2xl font-semibold">
                {risk.capacity_ratio === null ? "Not set" : `${(risk.capacity_ratio * 100).toFixed(0)}%`}
              </p>
            </div>
            <div className="p-5">
              <p className="text-xs text-muted-foreground">Projected ever infected</p>
              <p className="mt-2 font-mono text-2xl font-semibold">{Math.round(forecast.stats.total_infected).toLocaleString()}</p>
            </div>
          </section>

          <section className="mb-6 border bg-card">
            <div className="flex flex-col gap-2 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <ChartNoAxesCombined className="h-5 w-5 text-muted-foreground" />
                <div>
                  <h2 className="font-semibold">Projected active cases</h2>
                  <p className="text-xs text-muted-foreground">{forecast.model_type} baseline forecast from report #{forecast.input_snapshot.source_report_id}</p>
                </div>
              </div>
              <p className="font-mono text-xs text-muted-foreground">Generated {new Date(forecast.created_at).toLocaleString()}</p>
            </div>
            <div className="px-2 pb-3 pt-5 sm:px-5">
              <OutbreakForecastChart forecast={forecast} capacity={risk.response_capacity} />
            </div>
          </section>

          <section className="mb-6 border bg-card">
            <div className="border-b px-5 py-4">
              <h2 className="font-semibold">Forecast assumptions</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">Configurable assumptions, not measured clinical facts.</p>
            </div>
            <dl className="grid sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["Model", forecast.input_snapshot.model_type],
                ["Population", forecast.input_snapshot.population.toLocaleString()],
                ["Initial active", forecast.input_snapshot.initial_infected.toLocaleString()],
                ["Initial exposed", forecast.input_snapshot.initial_exposed?.toLocaleString() ?? "Not used"],
                ["Assumed R0", forecast.input_snapshot.assumed_r0.toFixed(2)],
                ["Infectious period", `${forecast.input_snapshot.infectious_days} days`],
                ["Incubation period", forecast.input_snapshot.incubation_days ? `${forecast.input_snapshot.incubation_days} days` : "Not used"],
                ["Forecast horizon", `${forecast.input_snapshot.forecast_days} days`],
              ].map(([label, value], index) => (
                <div key={label} className={`p-5 ${index < 4 ? "border-b" : ""} sm:border-r sm:[&:nth-child(2n)]:border-r-0 lg:[&:nth-child(2n)]:border-r lg:[&:nth-child(4n)]:border-r-0`}>
                  <dt className="text-xs text-muted-foreground">{label}</dt>
                  <dd className="mt-1 font-mono text-sm font-medium">{value}</dd>
                </div>
              ))}
            </dl>
          </section>
        </>
      ) : (
        <section className="mb-6 border border-dashed bg-card p-8 text-center">
          <ChartNoAxesCombined className="mx-auto h-8 w-8 text-muted-foreground" />
          <h2 className="mt-3 font-semibold">This incident has not been forecast yet</h2>
          <p className="mx-auto mt-1 max-w-lg text-sm text-muted-foreground">
            Generate a forecast using the latest active-case count and the configured disease assumptions.
          </p>
          <Button className="mt-5" onClick={generateForecast} disabled={generating}>
            {generating ? "Generating..." : "Generate forecast"}
          </Button>
        </section>
      )}

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <section className="min-w-0 border bg-card">
          <div className="flex items-center gap-3 border-b px-5 py-4">
            <FileClock className="h-5 w-5 text-muted-foreground" />
            <div>
              <h2 className="font-semibold">Reported case history</h2>
              <p className="text-xs text-muted-foreground">Latest report: {latest?.report_date ?? "No report"}</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-sm">
              <thead className="border-b bg-muted/50 text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 text-right font-medium">Suspected</th>
                  <th className="px-4 py-3 text-right font-medium">Confirmed</th>
                  <th className="px-4 py-3 text-right font-medium">Active</th>
                  <th className="px-4 py-3 text-right font-medium">Hospitalized</th>
                  <th className="px-4 py-3 text-right font-medium">Recovered</th>
                  <th className="px-4 py-3 text-right font-medium">Deaths</th>
                </tr>
              </thead>
              <tbody>
                {outbreak.reports.map((report) => (
                  <tr key={report.id} className="border-b last:border-0">
                    <td className="px-4 py-3 font-medium">{report.report_date}</td>
                    <td className="px-4 py-3 text-right font-mono">{report.new_suspected}</td>
                    <td className="px-4 py-3 text-right font-mono">{report.new_confirmed}</td>
                    <td className="px-4 py-3 text-right font-mono">{report.active_cases}</td>
                    <td className="px-4 py-3 text-right font-mono">{report.hospitalized}</td>
                    <td className="px-4 py-3 text-right font-mono">{report.new_recovered}</td>
                    <td className="px-4 py-3 text-right font-mono">{report.deaths}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="space-y-6">
          <section className="border bg-card">
            <div className="flex items-center gap-3 border-b px-5 py-4">
              <ShieldAlert className="h-5 w-5 text-muted-foreground" />
              <h2 className="font-semibold">Detection evidence</h2>
            </div>
            <div className="space-y-3 p-5 text-sm">
              <p>
                The system counted <strong>{evidence.confirmed_cases}</strong> confirmed cases from {evidence.window_start} through {evidence.window_end}.
              </p>
              <p className="text-muted-foreground">
                The configured rule triggers at {evidence.case_threshold} confirmed cases within {evidence.window_days} days.
              </p>
            </div>
          </section>

          <section className="border bg-card">
            <div className="border-b px-5 py-4">
              <h2 className="font-semibold">Activity</h2>
            </div>
            <div className="divide-y">
              {outbreak.activity.map((event) => (
                <div key={event.id} className="p-5 text-sm">
                  <p className="font-medium">{humanizeAction(event.action)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {event.actor_name ?? "System"} · {new Date(event.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
