"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Archive,
  BellRing,
  Check,
  CheckCheck,
  ChevronRight,
  Circle,
  MapPin,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getErrorMessage } from "@/lib/error";
import { getEffectiveRole } from "@/lib/roles";
import { alertService } from "@/services/alert.service";
import type { Alert, AlertStatus, Notification } from "@/types/alerts";

type AlertFilter = "open" | "all" | AlertStatus;

const filters: Array<{ label: string; value: AlertFilter }> = [
  { label: "Open", value: "open" },
  { label: "Draft", value: "draft" },
  { label: "Published", value: "published" },
  { label: "Resolved", value: "resolved" },
  { label: "Expired", value: "expired" },
  { label: "All", value: "all" },
];

function announceNotificationChange() {
  window.dispatchEvent(new Event("notifications:changed"));
}

function statusCopy(status: AlertStatus) {
  const labels: Record<AlertStatus, string> = {
    draft: "Internal review",
    published: "Published",
    resolved: "Resolved",
    expired: "Expired",
  };
  return labels[status];
}

export default function AlertsPage() {
  const { user } = useAuth();
  const role = user ? getEffectiveRole(user) : "citizen";
  const canManage = role === "health_officer" || role === "admin";
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<AlertFilter>("open");
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const notificationRequest = alertService.getNotifications();
      const [notificationResponse, alertResponse] = await Promise.all([
        notificationRequest,
        canManage ? alertService.getAlerts() : Promise.resolve(null),
      ]);
      setNotifications(notificationResponse.data);
      setUnreadCount(notificationResponse.unread_count);
      setAlerts(alertResponse?.data ?? []);
      announceNotificationChange();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to load alerts"));
    } finally {
      setLoading(false);
    }
  }, [canManage]);

  useEffect(() => {
    load();
  }, [load]);

  const visibleAlerts = useMemo(() => {
    if (filter === "all") return alerts;
    if (filter === "open") {
      return alerts.filter((alert) => alert.status === "draft" || alert.status === "published");
    }
    return alerts.filter((alert) => alert.status === filter);
  }, [alerts, filter]);

  async function markRead(notification: Notification) {
    setWorkingId(`notification-${notification.id}`);
    try {
      const response = await alertService.markRead(notification.id);
      if (response.data) {
        setNotifications((current) =>
          current.map((item) => (item.id === notification.id ? response.data! : item))
        );
        setUnreadCount((count) => Math.max(0, count - 1));
        announceNotificationChange();
      }
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to mark notification as read"));
    } finally {
      setWorkingId(null);
    }
  }

  async function acknowledge(notification: Notification) {
    setWorkingId(`notification-${notification.id}`);
    try {
      const response = await alertService.acknowledge(notification.id);
      if (response.data) {
        const wasUnread = notification.read_at === null;
        setNotifications((current) =>
          current.map((item) => (item.id === notification.id ? response.data! : item))
        );
        if (wasUnread) setUnreadCount((count) => Math.max(0, count - 1));
        toast.success("Alert acknowledged");
        announceNotificationChange();
      }
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to acknowledge alert"));
    } finally {
      setWorkingId(null);
    }
  }

  async function markAllRead() {
    setWorkingId("read-all");
    try {
      const response = await alertService.markAllRead();
      setNotifications(response.data);
      setUnreadCount(0);
      toast.success(response.message);
      announceNotificationChange();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to mark notifications as read"));
    } finally {
      setWorkingId(null);
    }
  }

  async function transition(alert: Alert, action: "publish" | "resolve" | "expire") {
    setWorkingId(`alert-${alert.id}`);
    try {
      const response =
        action === "publish"
          ? await alertService.publishAlert(alert.id)
          : action === "resolve"
            ? await alertService.resolveAlert(alert.id)
            : await alertService.expireAlert(alert.id);
      toast.success(response.message);
      await load();
    } catch (error) {
      toast.error(getErrorMessage(error, `Failed to ${action} alert`));
    } finally {
      setWorkingId(null);
    }
  }

  return (
    <div className="w-full p-5 md:p-8">
      <header className="mb-6 flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <BellRing className="h-6 w-6 text-muted-foreground" />
            Alerts
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Review outbreak notices, record that you have seen them, and track what was released.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button asChild variant="outline">
            <Link href="/subscriptions">
              <MapPin className="mr-2 h-4 w-4" /> Manage subscriptions
            </Link>
          </Button>
          <div className="border px-3 py-2 text-sm">
            <span className="font-mono font-semibold">{unreadCount}</span>
            <span className="ml-2 text-muted-foreground">unread</span>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              onClick={markAllRead}
              disabled={workingId === "read-all"}
            >
              <CheckCheck className="mr-2 h-4 w-4" /> Mark all read
            </Button>
          )}
        </div>
      </header>

      <div className={cn("grid items-start gap-6", canManage && "xl:grid-cols-[minmax(340px,0.8fr)_minmax(560px,1.2fr)]")}>
        <section className="min-w-0 border bg-card">
          <div className="flex items-center justify-between border-b px-5 py-4">
            <div>
              <h2 className="font-semibold">My notifications</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Acknowledgement is recorded against your account.
              </p>
            </div>
            <span className="font-mono text-sm text-muted-foreground">{notifications.length}</span>
          </div>

          {loading ? (
            <div className="space-y-3 p-5">
              {[0, 1, 2].map((item) => (
                <div key={item} className="h-32 animate-pulse bg-muted" />
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="px-6 py-20 text-center">
              <BellRing className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-3 font-medium">No notifications yet</p>
              <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                Subscribe to a location or organization to receive published outbreak alerts.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => {
                const pending = workingId === `notification-${notification.id}`;
                return (
                  <article
                    key={notification.id}
                    className={cn("relative p-5", notification.read_at === null && "bg-muted/40")}
                  >
                    {notification.read_at === null && (
                      <span className="absolute bottom-5 left-0 top-5 w-1 bg-primary" />
                    )}
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-primary px-2.5 py-1 text-xs font-medium capitalize text-primary-foreground">
                            {notification.alert.severity}
                          </span>
                          <span className="rounded-full border px-2.5 py-1 text-xs font-medium">
                            {statusCopy(notification.alert.status)}
                          </span>
                        </div>
                        <h3 className="font-semibold leading-snug">{notification.alert.title}</h3>
                      </div>
                      {notification.read_at === null && (
                        <Circle className="mt-1 h-2.5 w-2.5 shrink-0 fill-current" />
                      )}
                    </div>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {notification.alert.message}
                    </p>
                    <p className="mt-3 text-xs text-muted-foreground">
                      {notification.alert.organization_name} · {new Date(notification.created_at).toLocaleString()}
                    </p>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      {canManage && (
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/outbreaks/${notification.alert.outbreak_id}`}>
                            Open incident <ChevronRight className="ml-1 h-4 w-4" />
                          </Link>
                        </Button>
                      )}
                      {notification.read_at === null && (
                        <Button size="sm" variant="ghost" disabled={pending} onClick={() => markRead(notification)}>
                          Mark read
                        </Button>
                      )}
                      {notification.acknowledged_at === null ? (
                        <Button size="sm" disabled={pending} onClick={() => acknowledge(notification)}>
                          <Check className="mr-2 h-4 w-4" /> Acknowledge
                        </Button>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                          <CheckCheck className="h-4 w-4" />
                          Acknowledged {new Date(notification.acknowledged_at).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {canManage && (
          <section className="min-w-0 border bg-card">
            <div className="border-b px-5 py-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="font-semibold">Alert control</h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Drafts are internal. Publishing notifies matching subscribers.
                  </p>
                </div>
                <div className="flex flex-wrap gap-1 border p-1">
                  {filters.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setFilter(item.value)}
                      className={cn(
                        "px-2.5 py-1.5 text-xs font-medium transition-colors",
                        filter === item.value
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {!loading && visibleAlerts.length === 0 ? (
              <div className="px-6 py-20 text-center">
                <p className="font-medium">No alerts in this view</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  A forecast creates an internal alert when an outbreak is open.
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {visibleAlerts.map((alert) => {
                  const pending = workingId === `alert-${alert.id}`;
                  return (
                    <article key={alert.id} className="p-5">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
                            <span className="rounded-full bg-primary px-2.5 py-1 font-medium capitalize text-primary-foreground">
                              {alert.severity}
                            </span>
                            <span className="rounded-full border px-2.5 py-1 font-medium">
                              {statusCopy(alert.status)}
                            </span>
                            <span className="font-mono text-muted-foreground">Alert #{alert.id}</span>
                          </div>
                          <h3 className="font-semibold leading-snug">{alert.title}</h3>
                          <p className="mt-2 text-sm leading-6 text-muted-foreground">{alert.message}</p>
                        </div>
                        <Button asChild size="sm" variant="ghost" className="shrink-0">
                          <Link href={`/outbreaks/${alert.outbreak_id}`}>Incident #{alert.outbreak_id}</Link>
                        </Button>
                      </div>

                      <dl className="mt-4 grid grid-cols-3 border text-center text-xs">
                        <div className="border-r p-3">
                          <dt className="text-muted-foreground">Recipients</dt>
                          <dd className="mt-1 font-mono text-base font-semibold">{alert.recipient_count}</dd>
                        </div>
                        <div className="border-r p-3">
                          <dt className="text-muted-foreground">Unread</dt>
                          <dd className="mt-1 font-mono text-base font-semibold">{alert.unread_count}</dd>
                        </div>
                        <div className="p-3">
                          <dt className="text-muted-foreground">Acknowledged</dt>
                          <dd className="mt-1 font-mono text-base font-semibold">{alert.acknowledged_count}</dd>
                        </div>
                      </dl>

                      {(alert.status === "draft" || alert.status === "published") && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {alert.status === "draft" && (
                            <Button size="sm" disabled={pending} onClick={() => transition(alert, "publish")}>
                              <Send className="mr-2 h-4 w-4" /> Publish
                            </Button>
                          )}
                          <Button size="sm" variant="outline" disabled={pending} onClick={() => transition(alert, "resolve")}>
                            <CheckCheck className="mr-2 h-4 w-4" /> Resolve
                          </Button>
                          <Button size="sm" variant="ghost" disabled={pending} onClick={() => transition(alert, "expire")}>
                            <Archive className="mr-2 h-4 w-4" /> Expire
                          </Button>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
