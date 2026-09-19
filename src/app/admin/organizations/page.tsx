"use client";

import { useCallback, useEffect, useState } from "react";
import { Building2, Pencil, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getErrorMessage } from "@/lib/error";
import { configurationService } from "@/services/configuration.service";
import type {
  Organization,
  OrganizationPayload,
  OrganizationType,
} from "@/types/configuration";

const organizationTypes: Array<{ value: OrganizationType; label: string }> = [
  { value: "municipality", label: "Municipality" },
  { value: "university", label: "University" },
  { value: "school", label: "School" },
  { value: "hospital", label: "Hospital" },
  { value: "clinic", label: "Clinic" },
  { value: "ngo", label: "NGO" },
  { value: "community", label: "Community" },
  { value: "other", label: "Other" },
];

const emptyForm: OrganizationPayload = {
  name: "",
  organization_type: "municipality",
};

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [form, setForm] = useState<OrganizationPayload>(emptyForm);
  const [editing, setEditing] = useState<Organization | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadOrganizations = useCallback(async () => {
    try {
      const response = await configurationService.getOrganizations(true);
      setOrganizations(response.data);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to load organizations"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrganizations();
  }, [loadOrganizations]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEdit(organization: Organization) {
    setEditing(organization);
    setForm({
      name: organization.name,
      organization_type: organization.organization_type,
    });
    setShowForm(true);
  }

  async function save() {
    if (!form.name.trim()) {
      toast.error("Organization name is required");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await configurationService.updateOrganization(editing.id, form);
        toast.success("Organization updated");
      } else {
        await configurationService.createOrganization(form);
        toast.success("Organization created");
      }
      setShowForm(false);
      setEditing(null);
      setForm(emptyForm);
      await loadOrganizations();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to save organization"));
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(organization: Organization) {
    try {
      await configurationService.updateOrganization(organization.id, {
        is_active: !organization.is_active,
      });
      toast.success(organization.is_active ? "Organization deactivated" : "Organization activated");
      await loadOrganizations();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to update organization"));
    }
  }

  return (
    <div className="w-full p-8">
      <div className="mb-6 flex items-center justify-between border-b border-border pb-6">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Building2 className="h-6 w-6 text-muted-foreground" />
            Organizations
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage the institutions responsible for outbreak surveillance.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add organization
        </Button>
      </div>

      {showForm && (
        <div className="mb-6 rounded-lg border bg-card p-5">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-semibold">
              {editing ? "Edit organization" : "New organization"}
            </h2>
            <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="organization-name">Name</Label>
              <Input
                id="organization-name"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Kathmandu Metropolitan Health Office"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="organization-type">Type</Label>
              <select
                id="organization-type"
                value={form.organization_type}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    organization_type: event.target.value as OrganizationType,
                  }))
                }
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {organizationTypes.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>
              {saving ? "Saving..." : editing ? "Save changes" : "Create organization"}
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
      ) : organizations.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-muted/30 py-20 text-center">
          <p className="text-sm text-muted-foreground">No organizations configured.</p>
          <Button className="mt-4" variant="outline" onClick={openCreate}>Add the first organization</Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50 text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Organization</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">Type</th>
                <th className="hidden px-4 py-3 text-center font-medium sm:table-cell">Locations</th>
                <th className="hidden px-4 py-3 text-center font-medium lg:table-cell">Diseases</th>
                <th className="px-4 py-3 text-center font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {organizations.map((organization) => (
                <tr key={organization.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{organization.name}</td>
                  <td className="hidden px-4 py-3 capitalize text-muted-foreground md:table-cell">
                    {organization.organization_type}
                  </td>
                  <td className="hidden px-4 py-3 text-center tabular-nums sm:table-cell">
                    {organization.location_count}
                  </td>
                  <td className="hidden px-4 py-3 text-center tabular-nums lg:table-cell">
                    {organization.disease_count}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="rounded-full border px-2 py-0.5 text-xs">
                      {organization.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(organization)}>
                        <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => toggleStatus(organization)}>
                        {organization.is_active ? "Deactivate" : "Activate"}
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
