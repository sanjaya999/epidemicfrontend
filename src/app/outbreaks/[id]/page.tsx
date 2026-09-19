"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, FileClock, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/error";
import { surveillanceService } from "@/services/surveillance.service";
import type { OutbreakDetail } from "@/types/surveillance";

function humanizeAction(action: string) {
  const labels: Record<string, string> = {
    "outbreak.detected": "Detection rule created this incident",
    "outbreak.evidence_updated": "Detection evidence was updated",
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

  return (
    <div className="w-full p-5 md:p-8">
      <Link href="/outbreaks" className="mb-5 inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to outbreak queue
      </Link>

      <header className="mb-6 flex flex-col gap-4 border-b border-border pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full border px-2.5 py-1 text-xs font-medium capitalize">{outbreak.status}</span>
            <span className="font-mono text-xs text-muted-foreground">Incident #{outbreak.id}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{outbreak.disease_name} in {outbreak.location_name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {outbreak.organization_name} · detected {new Date(outbreak.detected_at).toLocaleString()}
          </p>
        </div>
        {outbreak.status !== "resolved" && (
          <Button variant="outline" onClick={resolve} disabled={resolving}>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            {resolving ? "Resolving..." : "Resolve incident"}
          </Button>
        )}
      </header>

      <section className="mb-6 grid border bg-card md:grid-cols-4">
        <div className="border-b p-5 md:border-b-0 md:border-r">
          <p className="text-xs text-muted-foreground">Confirmed in window</p>
          <p className="mt-2 font-mono text-2xl font-semibold">{evidence.confirmed_cases.toLocaleString()}</p>
        </div>
        <div className="border-b p-5 md:border-b-0 md:border-r">
          <p className="text-xs text-muted-foreground">Configured threshold</p>
          <p className="mt-2 font-mono text-2xl font-semibold">{evidence.case_threshold.toLocaleString()}</p>
        </div>
        <div className="border-b p-5 md:border-b-0 md:border-r">
          <p className="text-xs text-muted-foreground">Detection window</p>
          <p className="mt-2 font-mono text-2xl font-semibold">{evidence.window_days} days</p>
        </div>
        <div className="p-5">
          <p className="text-xs text-muted-foreground">Incidence</p>
          <p className="mt-2 font-mono text-2xl font-semibold">{evidence.incidence_per_100k.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">per 100,000</p>
        </div>
      </section>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <section className="min-w-0 border bg-card">
          <div className="flex items-center gap-3 border-b px-5 py-4">
            <FileClock className="h-5 w-5 text-muted-foreground" />
            <div>
              <h2 className="font-semibold">Reports used by this incident</h2>
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
              <h2 className="font-semibold">Why it was detected</h2>
            </div>
            <div className="space-y-3 p-5 text-sm">
              <p>
                The system counted <strong>{evidence.confirmed_cases}</strong> confirmed cases from {evidence.window_start} through {evidence.window_end}.
              </p>
              <p className="text-muted-foreground">
                This reached the configured threshold of {evidence.case_threshold}. Forecast risk has not been calculated yet; that is added in the next phase.
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
