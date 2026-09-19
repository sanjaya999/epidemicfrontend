"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ClipboardPlus, Pencil, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getErrorMessage } from "@/lib/error";
import { configurationService } from "@/services/configuration.service";
import { surveillanceService } from "@/services/surveillance.service";
import type { DiseaseProfile, Location, Organization } from "@/types/configuration";
import type { CaseReport, DetectionResult } from "@/types/surveillance";

function today() {
  const current = new Date();
  const offset = current.getTimezoneOffset() * 60_000;
  return new Date(current.getTime() - offset).toISOString().slice(0, 10);
}

const emptyForm = () => ({
  organization_id: "",
  location_id: "",
  disease_profile_id: "",
  report_date: today(),
  new_suspected: "0",
  new_confirmed: "0",
  active_cases: "0",
  new_recovered: "0",
  hospitalized: "0",
  deaths: "0",
  notes: "",
});

const countFields = [
  ["new_suspected", "New suspected", "People meeting the suspected-case definition"],
  ["new_confirmed", "New confirmed", "New confirmations on this date"],
  ["active_cases", "Active cases", "Currently ill; used as the forecast starting point"],
  ["new_recovered", "New recovered", "New recoveries on this date"],
  ["hospitalized", "Hospitalized", "Current hospitalized cases"],
  ["deaths", "Deaths", "New deaths reported on this date"],
] as const;

export default function ReportsPage() {
  const [reports, setReports] = useState<CaseReport[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [diseases, setDiseases] = useState<DiseaseProfile[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<CaseReport | null>(null);
  const [detection, setDetection] = useState<DetectionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [reportResponse, organizationResponse, locationResponse, diseaseResponse] =
        await Promise.all([
          surveillanceService.getReports(),
          configurationService.getOrganizations(),
          configurationService.getLocations(),
          configurationService.getDiseaseProfiles(),
        ]);
      setReports(reportResponse.data);
      setOrganizations(organizationResponse.data);
      setLocations(locationResponse.data);
      setDiseases(diseaseResponse.data);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to load case reporting"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const availableLocations = useMemo(
    () => locations.filter((item) => String(item.organization_id) === form.organization_id),
    [form.organization_id, locations]
  );
  const availableDiseases = useMemo(
    () =>
      diseases.filter(
        (item) =>
          item.organization_id === null || String(item.organization_id) === form.organization_id
      ),
    [diseases, form.organization_id]
  );
  const selectedDisease = diseases.find(
    (item) => String(item.id) === form.disease_profile_id
  );

  function resetForm() {
    setEditing(null);
    setDetection(null);
    setForm(emptyForm());
  }

  function editReport(report: CaseReport) {
    setEditing(report);
    setDetection(null);
    setForm({
      organization_id: String(report.organization_id),
      location_id: String(report.location_id),
      disease_profile_id: String(report.disease_profile_id),
      report_date: report.report_date,
      new_suspected: String(report.new_suspected),
      new_confirmed: String(report.new_confirmed),
      active_cases: String(report.active_cases),
      new_recovered: String(report.new_recovered),
      hospitalized: String(report.hospitalized),
      deaths: String(report.deaths),
      notes: report.notes ?? "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function save() {
    if (!form.organization_id || !form.location_id || !form.disease_profile_id || !form.report_date) {
      toast.error("Organization, location, disease, and report date are required");
      return;
    }
    const counts = {
      new_suspected: Number(form.new_suspected || 0),
      new_confirmed: Number(form.new_confirmed || 0),
      active_cases: Number(form.active_cases || 0),
      new_recovered: Number(form.new_recovered || 0),
      hospitalized: Number(form.hospitalized || 0),
      deaths: Number(form.deaths || 0),
      notes: form.notes.trim() || null,
    };
    setSaving(true);
    try {
      const response = editing
        ? await surveillanceService.correctReport(editing.id, counts)
        : await surveillanceService.createReport({
            organization_id: Number(form.organization_id),
            location_id: Number(form.location_id),
            disease_profile_id: Number(form.disease_profile_id),
            report_date: form.report_date,
            ...counts,
          });
      setDetection(response.detection ?? null);
      toast.success(editing ? "Report corrected" : "Report saved");
      setEditing(null);
      setForm(emptyForm());
      await load();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to save case report"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="w-full p-5 md:p-8">
      <header className="mb-6 border-b border-border pb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <ClipboardPlus className="h-6 w-6 text-muted-foreground" />
          Case reports
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Record aggregate daily counts. Do not include names or other patient-identifying details.
        </p>
      </header>

      {detection && (
        <div
          className={`mb-6 border p-4 ${
            detection.triggered
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card"
          }`}
        >
          <p className="font-semibold">
            {detection.triggered ? "Detection rule reached" : "Report checked"}
          </p>
          <p className={`mt-1 text-sm ${detection.triggered ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
            {detection.message}
          </p>
          <p className={`mt-2 text-xs tabular-nums ${detection.triggered ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
            {detection.confirmed_cases} confirmed in {detection.window_days} days · threshold {detection.case_threshold}
          </p>
        </div>
      )}

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(520px,1.1fr)]">
        <section className="border bg-card">
          <div className="flex items-center justify-between border-b px-5 py-4">
            <div>
              <h2 className="font-semibold">{editing ? `Correct report #${editing.id}` : "New daily report"}</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                All values are totals for the selected date unless stated otherwise.
              </p>
            </div>
            {editing && (
              <Button variant="ghost" size="sm" onClick={resetForm}>
                <RotateCcw className="mr-2 h-4 w-4" /> Cancel correction
              </Button>
            )}
          </div>

          <div className="space-y-5 p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="report-organization">Organization</Label>
                <select
                  id="report-organization"
                  value={form.organization_id}
                  disabled={!!editing}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      organization_id: event.target.value,
                      location_id: "",
                      disease_profile_id: "",
                    }))
                  }
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
                >
                  <option value="">Select organization</option>
                  {organizations.map((organization) => (
                    <option key={organization.id} value={organization.id}>{organization.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="report-location">Location</Label>
                <select
                  id="report-location"
                  value={form.location_id}
                  disabled={!form.organization_id || !!editing}
                  onChange={(event) => setForm((current) => ({ ...current, location_id: event.target.value }))}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
                >
                  <option value="">Select location</option>
                  {availableLocations.map((location) => (
                    <option key={location.id} value={location.id}>{location.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="report-disease">Disease or syndrome</Label>
                <select
                  id="report-disease"
                  value={form.disease_profile_id}
                  disabled={!form.organization_id || !!editing}
                  onChange={(event) => setForm((current) => ({ ...current, disease_profile_id: event.target.value }))}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
                >
                  <option value="">Select disease</option>
                  {availableDiseases.map((disease) => (
                    <option key={disease.id} value={disease.id}>{disease.name}</option>
                  ))}
                </select>
                {selectedDisease && (
                  <p className="text-xs text-muted-foreground">
                    Detect at {selectedDisease.detection_rules.case_threshold} confirmed cases within {selectedDisease.detection_rules.window_days} days.
                  </p>
                )}
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="report-date">Report date</Label>
                <Input
                  id="report-date"
                  type="date"
                  max={today()}
                  disabled={!!editing}
                  value={form.report_date}
                  onChange={(event) => setForm((current) => ({ ...current, report_date: event.target.value }))}
                />
              </div>
            </div>

            <div className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
              {countFields.map(([field, label, help]) => (
                <div className="space-y-2" key={field}>
                  <Label htmlFor={field}>{label}</Label>
                  <Input
                    id={field}
                    type="number"
                    min="0"
                    value={form[field]}
                    onChange={(event) => setForm((current) => ({ ...current, [field]: event.target.value }))}
                  />
                  <p className="text-xs leading-4 text-muted-foreground">{help}</p>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Label htmlFor="report-notes">Operational notes</Label>
              <textarea
                id="report-notes"
                value={form.notes}
                maxLength={1000}
                rows={3}
                onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                placeholder="Optional context without personal information"
                className="w-full resize-y rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <Button className="w-full" onClick={save} disabled={saving || organizations.length === 0}>
              {saving ? "Saving report..." : editing ? "Save correction" : "Save and check for outbreak"}
            </Button>
          </div>
        </section>

        <section className="min-w-0 border bg-card">
          <div className="border-b px-5 py-4">
            <h2 className="font-semibold">Recent submissions</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Use Correct when a submitted aggregate count needs to change.
            </p>
          </div>
          {loading ? (
            <div className="space-y-3 p-5">
              {[0, 1, 2].map((item) => <div key={item} className="h-14 animate-pulse rounded bg-muted" />)}
            </div>
          ) : reports.length === 0 ? (
            <div className="px-5 py-16 text-center text-sm text-muted-foreground">
              No reports yet. The first saved report will appear here.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-sm">
                <thead className="border-b bg-muted/50 text-left text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Date and place</th>
                    <th className="px-4 py-3 font-medium">Disease</th>
                    <th className="px-4 py-3 text-right font-medium">Confirmed</th>
                    <th className="px-4 py-3 text-right font-medium">Active</th>
                    <th className="px-4 py-3 font-medium">Submitted by</th>
                    <th className="px-4 py-3 text-right font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report) => (
                    <tr key={report.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <p className="font-medium">{report.report_date}</p>
                        <p className="text-xs text-muted-foreground">{report.location_name}</p>
                      </td>
                      <td className="px-4 py-3">{report.disease_name}</td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums">{report.new_confirmed.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums">{report.active_cases.toLocaleString()}</td>
                      <td className="px-4 py-3 text-muted-foreground">{report.submitted_by_name}</td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="sm" onClick={() => editReport(report)}>
                          <Pencil className="mr-2 h-3.5 w-3.5" /> Correct
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
    </div>
  );
}
