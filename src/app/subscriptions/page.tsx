"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BellRing,
  Building2,
  Check,
  MapPin,
  Search,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { getErrorMessage } from "@/lib/error";
import { configurationService } from "@/services/configuration.service";
import { subscriptionService } from "@/services/subscription.service";
import type { Location, Organization } from "@/types/configuration";
import type {
  AlertSubscription,
  SubscriptionScope,
} from "@/types/subscriptions";

function announceNotificationChange() {
  window.dispatchEvent(new Event("notifications:changed"));
  window.dispatchEvent(new Event("alert:created"));
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<AlertSubscription[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [scope, setScope] = useState<SubscriptionScope>("location");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [workingKey, setWorkingKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [subscriptionResponse, organizationResponse, locationResponse] =
        await Promise.all([
          subscriptionService.getAll(),
          configurationService.getOrganizations(),
          configurationService.getLocations(),
        ]);
      setSubscriptions(subscriptionResponse.data);
      setOrganizations(organizationResponse.data);
      setLocations(locationResponse.data);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to load alert subscriptions"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const subscribedKeys = useMemo(
    () =>
      new Map(
        subscriptions.map((item) => [
          `${item.scope_type}:${item.scope_type === "location" ? item.location_id : item.organization_id}`,
          item,
        ])
      ),
    [subscriptions]
  );

  const visibleLocations = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return locations;
    return locations.filter((location) =>
      [location.name, location.organization_name, location.parent_name]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(normalized))
    );
  }, [locations, query]);

  const visibleOrganizations = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return organizations;
    return organizations.filter((organization) =>
      [organization.name, organization.organization_type]
        .some((value) => value.toLowerCase().includes(normalized))
    );
  }, [organizations, query]);

  async function subscribe(scopeType: SubscriptionScope, targetId: number) {
    const key = `${scopeType}:${targetId}`;
    setWorkingKey(key);
    try {
      const response = await subscriptionService.create(scopeType, targetId);
      if (response.data) {
        setSubscriptions((current) => [response.data!, ...current]);
      }
      if (response.notifications_added > 0) {
        toast.success(
          `Subscribed. ${response.notifications_added} active alert${response.notifications_added === 1 ? "" : "s"} added.`
        );
      } else {
        toast.success("Subscribed for future alerts");
      }
      announceNotificationChange();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to create subscription"));
    } finally {
      setWorkingKey(null);
    }
  }

  async function unsubscribe(subscription: AlertSubscription) {
    setWorkingKey(`subscription:${subscription.id}`);
    try {
      await subscriptionService.remove(subscription.id);
      setSubscriptions((current) =>
        current.filter((item) => item.id !== subscription.id)
      );
      toast.success("Subscription removed");
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to remove subscription"));
    } finally {
      setWorkingKey(null);
    }
  }

  return (
    <div className="w-full p-5 md:p-8">
      <header className="mb-6 border-b pb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <BellRing className="h-6 w-6 text-muted-foreground" />
          Alert subscriptions
        </h1>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
          Choose the places or health organizations you want to hear from. Only
          published alerts matching your choices will be sent to your account.
        </p>
      </header>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(280px,0.65fr)_minmax(520px,1.35fr)]">
        <section className="border bg-card">
          <div className="border-b px-5 py-4">
            <h2 className="font-semibold">Your coverage</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Removing a subscription stops future delivery.
            </p>
          </div>

          {loading ? (
            <div className="space-y-3 p-5">
              {[0, 1].map((item) => (
                <div key={item} className="h-20 animate-pulse bg-muted" />
              ))}
            </div>
          ) : subscriptions.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <BellRing className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-3 font-medium">No alert coverage yet</p>
              <p className="mx-auto mt-1 max-w-xs text-sm leading-6 text-muted-foreground">
                Search the directory and subscribe to an area or organization.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {subscriptions.map((subscription) => (
                <article key={subscription.id} className="flex items-start gap-3 p-4">
                  <div className="mt-0.5 border p-2">
                    {subscription.scope_type === "location" ? (
                      <MapPin className="h-4 w-4" />
                    ) : (
                      <Building2 className="h-4 w-4" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium leading-5">
                      {subscription.location_name ?? subscription.organization_name}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      {subscription.scope_type === "location"
                        ? `${subscription.organization_name}${subscription.parent_location_name ? ` · Within ${subscription.parent_location_name}` : ""}`
                        : `All monitored locations · ${subscription.organization_name}`}
                    </p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Remove subscription"
                    disabled={workingKey === `subscription:${subscription.id}`}
                    onClick={() => unsubscribe(subscription)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="border bg-card">
          <div className="border-b p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="font-semibold">Find alert sources</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  An area includes alerts issued for its child locations.
                </p>
              </div>
              <div className="flex border p-1">
                <button
                  type="button"
                  onClick={() => setScope("location")}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium",
                    scope === "location"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Locations
                </button>
                <button
                  type="button"
                  onClick={() => setScope("organization")}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium",
                    scope === "organization"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Organizations
                </button>
              </div>
            </div>
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="pl-9"
                placeholder={
                  scope === "location"
                    ? "Search location or organization"
                    : "Search organization or type"
                }
              />
            </div>
          </div>

          {loading ? (
            <div className="space-y-3 p-5">
              {[0, 1, 2].map((item) => (
                <div key={item} className="h-16 animate-pulse bg-muted" />
              ))}
            </div>
          ) : scope === "location" ? (
            visibleLocations.length === 0 ? (
              <div className="px-6 py-16 text-center text-sm text-muted-foreground">
                No active locations match your search.
              </div>
            ) : (
              <div className="divide-y">
                {visibleLocations.map((location) => {
                  const key = `location:${location.id}`;
                  const subscription = subscribedKeys.get(key);
                  return (
                    <article key={location.id} className="flex items-center gap-4 p-4">
                      <MapPin className="h-5 w-5 shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{location.name}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {location.organization_name}
                          {location.parent_name ? ` · Within ${location.parent_name}` : ""}
                        </p>
                      </div>
                      {subscription ? (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={workingKey === `subscription:${subscription.id}`}
                          onClick={() => unsubscribe(subscription)}
                        >
                          <Check className="mr-2 h-4 w-4" /> Subscribed
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          disabled={workingKey === key}
                          onClick={() => subscribe("location", location.id)}
                        >
                          Subscribe
                        </Button>
                      )}
                    </article>
                  );
                })}
              </div>
            )
          ) : visibleOrganizations.length === 0 ? (
            <div className="px-6 py-16 text-center text-sm text-muted-foreground">
              No active organizations match your search.
            </div>
          ) : (
            <div className="divide-y">
              {visibleOrganizations.map((organization) => {
                const key = `organization:${organization.id}`;
                const subscription = subscribedKeys.get(key);
                return (
                  <article key={organization.id} className="flex items-center gap-4 p-4">
                    <Building2 className="h-5 w-5 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{organization.name}</p>
                      <p className="mt-0.5 text-xs capitalize text-muted-foreground">
                        {organization.organization_type} · {organization.location_count} monitored location{organization.location_count === 1 ? "" : "s"}
                      </p>
                    </div>
                    {subscription ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={workingKey === `subscription:${subscription.id}`}
                        onClick={() => unsubscribe(subscription)}
                      >
                        <Check className="mr-2 h-4 w-4" /> Subscribed
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        disabled={workingKey === key}
                        onClick={() => subscribe("organization", organization.id)}
                      >
                        Subscribe
                      </Button>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
