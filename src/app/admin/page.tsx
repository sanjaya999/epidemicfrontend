"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Users,
  FlaskConical,
  Activity,
  ShieldCheck,
  UserCheck,
  UserX,
  Globe,
  ArrowRight,
} from "lucide-react";
import { adminService } from "@/services/admin.service";
import type { DashboardStats } from "@/types/admin";
import { cn } from "@/lib/utils";

const statCards = [
  { key: "total_users", label: "Total Users", icon: Users, color: "text-blue-600 bg-blue-50 border-blue-100" },
  { key: "active_users", label: "Active Users", icon: UserCheck, color: "text-green-600 bg-green-50 border-green-100" },
  { key: "inactive_users", label: "Inactive Users", icon: UserX, color: "text-red-600 bg-red-50 border-red-100" },
  { key: "superusers", label: "Superadmins", icon: ShieldCheck, color: "text-purple-600 bg-purple-50 border-purple-100" },
  { key: "total_simulations", label: "Simulations", icon: FlaskConical, color: "text-orange-600 bg-orange-50 border-orange-100" },
  { key: "public_simulations", label: "Public Sims", icon: Globe, color: "text-teal-600 bg-teal-50 border-teal-100" },
  { key: "total_interventions", label: "Interventions", icon: Activity, color: "text-pink-600 bg-pink-50 border-pink-100" },
] as const;

const quickLinks = [
  { title: "Manage Users", description: "Activate, deactivate, promote or delete users", href: "/admin/users" },
  { title: "Manage Simulations", description: "View, toggle visibility or delete any simulation", href: "/admin/simulations" },
  { title: "Manage Interventions", description: "View or delete any intervention", href: "/admin/interventions" },
];

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService
      .getDashboard()
      .then((res) => {
        if (res.data) setStats(res.data);
      })
      .catch(() => {
        toast.error("Failed to load admin dashboard");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-8 w-full space-y-6">
        <div className="h-10 w-56 bg-muted animate-pulse rounded-sm" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="h-28 rounded-lg bg-card border border-border animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 w-full">
      <div className="pb-6 mb-6 border-b border-border">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-purple-500" />
          Admin Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          System-wide overview and management
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => (
          <div
            key={card.key}
            className="p-5 rounded-lg border bg-card flex flex-col gap-3"
          >
            <div className={cn("h-9 w-9 rounded-md flex items-center justify-center border", card.color)}>
              <card.icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">
                {stats ? (stats[card.key as keyof DashboardStats] as number).toLocaleString() : "—"}
              </p>
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
                {card.label}
              </p>
            </div>
          </div>
        ))}
      </div>

      <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
      <div className="grid md:grid-cols-3 gap-4">
        {quickLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="group p-5 rounded-lg border bg-card hover:border-primary/50 hover:shadow-sm transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold group-hover:text-primary transition-colors">
                  {link.title}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">{link.description}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
