"use client";

import { useCallback, useEffect, useState } from "react";
import { Microscope, Pencil, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getErrorMessage } from "@/lib/error";
import { configurationService } from "@/services/configuration.service";
import type {
  DiseaseProfile,
  DiseaseProfilePayload,
  Organization,
} from "@/types/configuration";

const emptyForm = {
  organization_id: "",
  name: "",
  model_type: "SIR" as "SIR" | "SEIR",
  default_r0: "",
  infectious_days: "",
  incubation_days: "",
  forecast_days: "60",
  window_days: "7",
  case_threshold: "5",
  incidence_per_100k: "",
};

export default function DiseaseProfilesPage() {
  const [profiles, setProfiles] = useState<DiseaseProfile[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<DiseaseProfile | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [organizationFilter, setOrganizationFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [profileResponse, organizationResponse] = await Promise.all([
        configurationService.getDiseaseProfiles(
          organizationFilter ? Number(organizationFilter) : undefined,
          true
        ),
        configurationService.getOrganizations(true),
      ]);
      setProfiles(profileResponse.data);
      setOrganizations(organizationResponse.data);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to load disease profiles"));
    } finally {
      setLoading(false);
    }
  }, [organizationFilter]);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setForm({ ...emptyForm, organization_id: organizationFilter });
    setShowForm(true);
  }

  function openEdit(profile: DiseaseProfile) {
    setEditing(profile);
    setForm({
      organization_id: profile.organization_id === null ? "" : String(profile.organization_id),
      name: profile.name,
      model_type: profile.model_type,
      default_r0: String(profile.default_r0),
      infectious_days: String(profile.infectious_days),
      incubation_days: profile.incubation_days === null ? "" : String(profile.incubation_days),
      forecast_days: String(profile.forecast_days),
      window_days: String(profile.detection_rules.window_days),
      case_threshold: String(profile.detection_rules.case_threshold),
      incidence_per_100k:
        profile.detection_rules.incidence_per_100k === null
          ? ""
          : String(profile.detection_rules.incidence_per_100k),
    });
    setShowForm(true);
  }

  async function save() {
    if (!form.name.trim() || !form.default_r0 || !form.infectious_days) {
      toast.error("Name, R0, and infectious days are required");
      return;
    }
    if (form.model_type === "SEIR" && !form.incubation_days) {
      toast.error("Incubation days are required for an SEIR model");
      return;
    }

    const payload: DiseaseProfilePayload = {
      organization_id: form.organization_id ? Number(form.organization_id) : null,
      name: form.name.trim(),
      model_type: form.model_type,
      default_r0: Number(form.default_r0),
      infectious_days: Number(form.infectious_days),
      incubation_days:
        form.model_type === "SEIR" && form.incubation_days
          ? Number(form.incubation_days)
          : null,
      forecast_days: Number(form.forecast_days),
      detection_rules: {
        window_days: Number(form.window_days),
        case_threshold: Number(form.case_threshold),
        incidence_per_100k: form.incidence_per_100k
          ? Number(form.incidence_per_100k)
          : null,
      },
    };

    setSaving(true);
    try {
      if (editing) {
        await configurationService.updateDiseaseProfile(editing.id, payload);
        toast.success("Disease profile updated");
      } else {
        await configurationService.createDiseaseProfile(payload);
        toast.success("Disease profile created");
      }
      setShowForm(false);
      setEditing(null);
      setForm(emptyForm);
      await load();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to save disease profile"));
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(profile: DiseaseProfile) {
    try {
      await configurationService.updateDiseaseProfile(profile.id, {
        is_active: !profile.is_active,
      });
      toast.success(profile.is_active ? "Disease profile deactivated" : "Disease profile activated");
      await load();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to update disease profile"));
    }
  }

  return (
    <div className="w-full p-8">
      <div className="mb-6 flex items-center justify-between border-b border-border pb-6">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Microscope className="h-6 w-6 text-muted-foreground" />
            Disease profiles
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure forecast defaults and the case thresholds used to detect outbreaks.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" /> Add disease profile
        </Button>
      </div>

      <div className="mb-6 max-w-xs">
        <select
          value={organizationFilter}
          onChange={(event) => setOrganizationFilter(event.target.value)}
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Filter disease profiles by organization"
        >
          <option value="">All profiles</option>
          {organizations.map((organization) => (
            <option key={organization.id} value={organization.id}>{organization.name}</option>
          ))}
        </select>
      </div>

      {showForm && (
        <div className="mb-6 rounded-lg border bg-card p-5">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-semibold">
              {editing ? "Edit disease profile" : "New disease profile"}
            </h2>
            <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2 lg:col-span-2">
              <Label htmlFor="disease-name">Disease name</Label>
              <Input
                id="disease-name"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="disease-organization">Organization</Label>
              <select
                id="disease-organization"
                value={form.organization_id}
                onChange={(event) =>
                  setForm((current) => ({ ...current, organization_id: event.target.value }))
                }
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Global profile</option>
                {organizations.filter((item) => item.is_active).map((organization) => (
                  <option key={organization.id} value={organization.id}>{organization.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="model-type">Model</Label>
              <select
                id="model-type"
                value={form.model_type}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    model_type: event.target.value as "SIR" | "SEIR",
                    incubation_days: event.target.value === "SIR" ? "" : current.incubation_days,
                  }))
                }
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="SIR">SIR</option>
                <option value="SEIR">SEIR</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="default-r0">Default R0</Label>
              <Input
                id="default-r0"
                type="number"
                min="0.01"
                max="30"
                step="0.01"
                value={form.default_r0}
                onChange={(event) => setForm((current) => ({ ...current, default_r0: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="infectious-days">Infectious days</Label>
              <Input
                id="infectious-days"
                type="number"
                min="0.1"
                max="365"
                step="0.1"
                value={form.infectious_days}
                onChange={(event) => setForm((current) => ({ ...current, infectious_days: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="incubation-days">Incubation days</Label>
              <Input
                id="incubation-days"
                type="number"
                min="0.1"
                max="365"
                step="0.1"
                disabled={form.model_type === "SIR"}
                value={form.incubation_days}
                onChange={(event) => setForm((current) => ({ ...current, incubation_days: event.target.value }))}
                placeholder={form.model_type === "SIR" ? "Not applicable" : undefined}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="forecast-days">Forecast days</Label>
              <Input
                id="forecast-days"
                type="number"
                min="10"
                max="3650"
                value={form.forecast_days}
                onChange={(event) => setForm((current) => ({ ...current, forecast_days: event.target.value }))}
              />
            </div>
          </div>

          <div className="my-5 border-t" />
          <h3 className="mb-4 text-sm font-semibold">Outbreak detection rule</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="window-days">Detection window (days)</Label>
              <Input
                id="window-days"
                type="number"
                min="1"
                max="90"
                value={form.window_days}
                onChange={(event) => setForm((current) => ({ ...current, window_days: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="case-threshold">Case threshold</Label>
              <Input
                id="case-threshold"
                type="number"
                min="1"
                value={form.case_threshold}
                onChange={(event) => setForm((current) => ({ ...current, case_threshold: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="incidence-threshold">Cases per 100,000 (optional)</Label>
              <Input
                id="incidence-threshold"
                type="number"
                min="0.01"
                step="0.01"
                value={form.incidence_per_100k}
                onChange={(event) => setForm((current) => ({ ...current, incidence_per_100k: event.target.value }))}
              />
            </div>
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>
              {saving ? "Saving..." : editing ? "Save changes" : "Create disease profile"}
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-16 animate-pulse rounded-lg border bg-card" />
          ))}
        </div>
      ) : profiles.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-muted/30 py-20 text-center">
          <p className="text-sm text-muted-foreground">No disease profiles configured.</p>
          <Button className="mt-4" variant="outline" onClick={openCreate}>
            Add the first disease profile
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50 text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Disease</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">Scope</th>
                <th className="px-4 py-3 text-center font-medium">Model</th>
                <th className="hidden px-4 py-3 text-right font-medium sm:table-cell">R0</th>
                <th className="hidden px-4 py-3 text-right font-medium lg:table-cell">Detection rule</th>
                <th className="px-4 py-3 text-center font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((profile) => (
                <tr key={profile.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="font-medium">{profile.name}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {profile.forecast_days}-day forecast
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                    {profile.organization_name ?? "Global"}
                  </td>
                  <td className="px-4 py-3 text-center">{profile.model_type}</td>
                  <td className="hidden px-4 py-3 text-right tabular-nums sm:table-cell">
                    {profile.default_r0}
                  </td>
                  <td className="hidden px-4 py-3 text-right text-muted-foreground lg:table-cell">
                    {profile.detection_rules.case_threshold} cases / {profile.detection_rules.window_days} days
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="rounded-full border px-2 py-0.5 text-xs">
                      {profile.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(profile)}>
                        <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => toggleStatus(profile)}>
                        {profile.is_active ? "Deactivate" : "Activate"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
