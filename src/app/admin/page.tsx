"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Activity,
  FlaskConical,
  Globe,
  ShieldCheck,
  UserCheck,
  Users,
  UserX,
} from "lucide-react";
import { adminService } from "@/services/admin.service";
import type { DashboardStats } from "@/types/admin";
import { ROLE_LABELS, USER_ROLES } from "@/lib/roles";
import { getErrorMessage } from "@/lib/error";

const statItems = [
  { key: "total_users", label: "Total users", icon: Users },
  { key: "active_users", label: "Active users", icon: UserCheck },
  { key: "inactive_users", label: "Inactive users", icon: UserX },
  { key: "superusers", label: "Administrators", icon: ShieldCheck },
  { key: "total_simulations", label: "Simulations", icon: FlaskConical },
  { key: "public_simulations", label: "Public simulations", icon: Globe },
  { key: "total_interventions", label: "Interventions", icon: Activity },
] as const;

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService
      .getDashboard()
      .then((response) => {
        if (response.data) setStats(response.data);
      })
      .catch((error) => {
        toast.error(getErrorMessage(error, "Failed to load administration overview"));
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="w-full space-y-7 p-5 sm:p-8">
        <div className="h-16 max-w-md animate-pulse rounded-md bg-muted" />
        <div className="h-72 animate-pulse rounded-xl border bg-card" />
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-64 animate-pulse rounded-xl border bg-card" />
          <div className="h-64 animate-pulse rounded-xl border bg-card" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-5 sm:p-8">
      <header className="mb-7 flex flex-col justify-between gap-4 border-b pb-6 sm:flex-row sm:items-end">
        <div>
          <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            Restricted administration
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">System overview</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Accounts, model activity, and platform access in one place.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm font-medium">
          <span className="h-2 w-2 rounded-full bg-foreground" />
          System available
        </div>
      </header>

      <section className="overflow-hidden rounded-xl border bg-border" aria-labelledby="snapshot-title">
        <div className="flex items-center justify-between bg-card px-5 py-4">
          <div>
            <h2 id="snapshot-title" className="font-semibold">System snapshot</h2>
            <p className="mt-1 text-xs text-muted-foreground">Current records across EpiWatch</p>
          </div>
          <span className="text-xs text-muted-foreground">Live totals</span>
        </div>
        <div className="grid gap-px sm:grid-cols-2 lg:grid-cols-4">
          {statItems.map((item) => (
            <div key={item.key} className="flex min-h-32 flex-col justify-between bg-card p-5">
              <item.icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <div>
                <p className="text-3xl font-semibold tabular-nums">
                  {stats ? stats[item.key].toLocaleString() : "—"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{item.label}</p>
              </div>
            </div>
          ))}
          <div className="flex min-h-32 flex-col justify-between bg-foreground p-5 text-background">
            <Activity className="h-4 w-4 text-background/60" aria-hidden="true" />
            <div>
              <p className="text-sm font-medium">Operational foundation</p>
              <p className="mt-1 text-xs leading-5 text-background/65">
                Roles and access controls are active.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-7">
        <section className="rounded-xl border bg-card" aria-labelledby="roles-title">
          <div className="border-b px-5 py-4">
            <h2 id="roles-title" className="font-semibold">Access distribution</h2>
            <p className="mt-1 text-xs text-muted-foreground">Users by assigned role</p>
          </div>
          <div className="divide-y px-5">
            {USER_ROLES.map((role) => (
              <div key={role} className="flex items-center justify-between py-4 text-sm">
                <span className="text-muted-foreground">{ROLE_LABELS[role]}</span>
                <span className="font-semibold tabular-nums">
                  {stats?.users_by_role?.[role]?.toLocaleString() ?? "0"}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
