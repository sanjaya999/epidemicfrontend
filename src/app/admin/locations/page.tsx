"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { MapPin, Pencil, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getErrorMessage } from "@/lib/error";
import { configurationService } from "@/services/configuration.service";
import type { Location, LocationPayload, Organization } from "@/types/configuration";

const emptyForm = {
  organization_id: "",
  name: "",
  population: "",
  response_capacity: "",
  parent_id: "",
};

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<Location | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [organizationFilter, setOrganizationFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [locationResponse, organizationResponse] = await Promise.all([
        configurationService.getLocations(
          organizationFilter ? Number(organizationFilter) : undefined,
          true
        ),
        configurationService.getOrganizations(true),
      ]);
      setLocations(locationResponse.data);
      setOrganizations(organizationResponse.data);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to load locations"));
    } finally {
      setLoading(false);
    }
  }, [organizationFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const possibleParents = useMemo(
    () =>
      locations.filter(
        (location) =>
          String(location.organization_id) === form.organization_id && location.id !== editing?.id
      ),
    [editing?.id, form.organization_id, locations]
  );

  function openCreate() {
    setEditing(null);
    setForm({ ...emptyForm, organization_id: organizationFilter });
    setShowForm(true);
  }

  function openEdit(location: Location) {
    setEditing(location);
    setForm({
      organization_id: String(location.organization_id),
      name: location.name,
      population: String(location.population),
      response_capacity:
        location.response_capacity === null ? "" : String(location.response_capacity),
      parent_id: location.parent_id === null ? "" : String(location.parent_id),
    });
    setShowForm(true);
  }

  async function save() {
    if (!form.organization_id || !form.name.trim() || !form.population) {
      toast.error("Organization, name, and population are required");
      return;
    }
    const payload: LocationPayload = {
      organization_id: Number(form.organization_id),
      name: form.name.trim(),
      population: Number(form.population),
      response_capacity: form.response_capacity ? Number(form.response_capacity) : null,
      parent_id: form.parent_id ? Number(form.parent_id) : null,
    };
    setSaving(true);
    try {
      if (editing) {
        await configurationService.updateLocation(editing.id, payload);
        toast.success("Location updated");
      } else {
        await configurationService.createLocation(payload);
        toast.success("Location created");
      }
      setShowForm(false);
      setEditing(null);
      setForm(emptyForm);
      await load();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to save location"));
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(location: Location) {
    try {
      await configurationService.updateLocation(location.id, {
        is_active: !location.is_active,
      });
      toast.success(location.is_active ? "Location deactivated" : "Location activated");
      await load();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to update location"));
    }
  }

  return (
    <div className="w-full p-8">
      <div className="mb-6 flex items-center justify-between border-b border-border pb-6">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <MapPin className="h-6 w-6 text-muted-foreground" />
            Locations
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure monitored areas, populations, and response capacity.
          </p>
        </div>
        <Button onClick={openCreate} disabled={organizations.length === 0}>
          <Plus className="mr-2 h-4 w-4" /> Add location
        </Button>
      </div>

      <div className="mb-6 max-w-xs">
        <select
          value={organizationFilter}
          onChange={(event) => setOrganizationFilter(event.target.value)}
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Filter locations by organization"
        >
          <option value="">All organizations</option>
          {organizations.map((organization) => (
            <option key={organization.id} value={organization.id}>{organization.name}</option>
          ))}
        </select>
      </div>

      {showForm && (
        <div className="mb-6 rounded-lg border bg-card p-5">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-semibold">{editing ? "Edit location" : "New location"}</h2>
            <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="location-organization">Organization</Label>
              <select
                id="location-organization"
                value={form.organization_id}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    organization_id: event.target.value,
                    parent_id: "",
                  }))
                }
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Select organization</option>
                {organizations.filter((item) => item.is_active).map((organization) => (
                  <option key={organization.id} value={organization.id}>{organization.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location-name">Location name</Label>
              <Input
                id="location-name"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location-parent">Parent location</Label>
              <select
                id="location-parent"
                value={form.parent_id}
                onChange={(event) => setForm((current) => ({ ...current, parent_id: event.target.value }))}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">No parent</option>
                {possibleParents.map((location) => (
                  <option key={location.id} value={location.id}>{location.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location-population">Population</Label>
              <Input
                id="location-population"
                type="number"
                min="1"
                value={form.population}
                onChange={(event) => setForm((current) => ({ ...current, population: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="response-capacity">Response capacity</Label>
              <Input
                id="response-capacity"
                type="number"
                min="0"
                value={form.response_capacity}
                onChange={(event) => setForm((current) => ({ ...current, response_capacity: event.target.value }))}
              />
            </div>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>
              {saving ? "Saving..." : editing ? "Save changes" : "Create location"}
            </Button>
          </div>
        </div>
      )}

      {organizations.length === 0 && !loading ? (
        <div className="rounded-lg border border-dashed bg-muted/30 py-20 text-center">
          <p className="text-sm text-muted-foreground">
            Create an organization before adding locations.
          </p>
        </div>
      ) : loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((item) => <div key={item} className="h-16 animate-pulse rounded-lg border bg-card" />)}
        </div>
      ) : locations.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-muted/30 py-20 text-center">
          <p className="text-sm text-muted-foreground">No locations configured.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50 text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Location</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">Organization</th>
                <th className="hidden px-4 py-3 font-medium lg:table-cell">Parent</th>
                <th className="px-4 py-3 text-right font-medium">Population</th>
                <th className="hidden px-4 py-3 text-right font-medium sm:table-cell">Capacity</th>
                <th className="px-4 py-3 text-center font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {locations.map((location) => (
                <tr key={location.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{location.name}</td>
                  <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">{location.organization_name}</td>
                  <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">{location.parent_name ?? "—"}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{location.population.toLocaleString()}</td>
                  <td className="hidden px-4 py-3 text-right tabular-nums sm:table-cell">
                    {location.response_capacity?.toLocaleString() ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="rounded-full border px-2 py-0.5 text-xs">
                      {location.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(location)}>
                        <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => toggleStatus(location)}>
                        {location.is_active ? "Deactivate" : "Activate"}
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
