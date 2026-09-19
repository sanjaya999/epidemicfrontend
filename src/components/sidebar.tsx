"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth-provider";
import { Logo } from "@/components/logo";
import { getEffectiveRole, ROLE_LABELS } from "@/lib/roles";
import {
  LayoutDashboard,
  Folder,
  FlaskConical,
  CircleDot,
  LogOut,
  LogIn,
  UserPlus,
  User as UserIcon,
  ShieldCheck,
  Activity,
  Building2,
  MapPin,
  Microscope,
  Users,
} from "lucide-react";

const sidebarItems = [
  {
    title: "Overview",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Model library",
    href: "/simulations",
    icon: FlaskConical,
  },
  {
    title: "Outbreak Lab",
    href: "/lab",
    icon: CircleDot,
  },
  {
    title: "My scenarios",
    href: "/history",
    icon: Folder,
  },
];

const adminItems = [
  { title: "Admin overview", href: "/admin", icon: ShieldCheck },
  { title: "Users", href: "/admin/users", icon: Users },
  { title: "Simulations", href: "/admin/simulations", icon: FlaskConical },
  { title: "Interventions", href: "/admin/interventions", icon: Activity },
  { title: "Organizations", href: "/admin/organizations", icon: Building2 },
  { title: "Locations", href: "/admin/locations", icon: MapPin },
  { title: "Disease profiles", href: "/admin/diseases", icon: Microscope },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, isLoading, logout } = useAuth();
  const role = user ? getEffectiveRole(user) : null;

  const isAuthPage = pathname === "/login" || pathname === "/register";

  if (isAuthPage) return null;

  return (
    <aside className="w-16 md:w-64 border-r bg-background flex flex-col h-screen sticky top-0 shrink-0">
      <div className="p-3 md:p-6 border-b">
        <Link href="/" className="flex items-center justify-center gap-3 group md:justify-start" aria-label="EpiWatch home">
          <Logo className="h-9 w-9 shrink-0 transition-transform duration-300 group-hover:scale-105" />
          <span className="hidden md:flex flex-col leading-tight">
            <span className="text-lg font-bold tracking-tight text-primary">EpiWatch</span>
            <span className="text-[10px] tracking-wide text-muted-foreground">
              Outbreak response
            </span>
          </span>
        </Link>
      </div>

      <div className="flex-1 py-5 px-2 md:px-4 space-y-2 overflow-y-auto">
        {sidebarItems.map((item) => {
          const isActive = item.href === "/simulations"
            ? pathname.startsWith("/simulations") || pathname.startsWith("/simulate")
            : pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.title}
              title={item.title}
              className={cn(
                "flex items-center justify-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group md:justify-start",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className={cn(
                "h-4 w-4 transition-transform duration-200 group-hover:scale-110",
                isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
              )} />
              <span className="hidden md:inline">{item.title}</span>
            </Link>
          );
        })}

        {role === "admin" && (
          <div className="pt-4 mt-4 border-t border-border">
            <p className="hidden md:block px-3 mb-2 text-[10px] tracking-wide text-muted-foreground font-semibold">
              Administration
            </p>
            <div className="space-y-1">
              {adminItems.map((item) => {
                const isActive = item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-label={item.title}
                    title={item.title}
                    className={cn(
                      "group flex items-center justify-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 md:justify-start",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "h-4 w-4 transition-transform duration-200 group-hover:scale-110",
                        isActive
                          ? "text-primary-foreground"
                          : "text-muted-foreground group-hover:text-foreground"
                      )}
                    />
                    <span className="hidden md:inline">{item.title}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="p-2 md:p-4 border-t bg-muted/30 min-h-[88px] md:min-h-[100px] flex flex-col justify-center">
        {isLoading ? (
          <div className="flex items-center gap-3 px-2 animate-pulse">
            <div className="h-8 w-8 rounded-full bg-muted" />
            <div className="hidden md:flex flex-col gap-2 flex-1">
              <div className="h-3 w-20 bg-muted rounded" />
              <div className="h-2 w-32 bg-muted rounded" />
            </div>
          </div>
        ) : user ? (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-3 px-2 md:justify-start">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <UserIcon className="h-4 w-4 text-primary" />
              </div>
              <div className="hidden md:flex flex-col min-w-0">
                <span className="text-sm font-semibold truncate">{user.username}</span>
                <span className="text-[11px] text-muted-foreground truncate">
                  {role ? ROLE_LABELS[role] : user.email}
                </span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="w-full justify-center text-red-500 hover:text-red-600 hover:bg-red-50 font-medium gap-2 md:justify-start"
              title="Log out"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden md:inline">Logout</span>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            <Link href="/login">
              <Button variant="outline" size="sm" className="w-full text-xs" title="Sign in">
                <LogIn className="h-4 w-4 md:hidden" />
                <span className="hidden md:inline">Sign in</span>
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="w-full text-xs" title="Register">
                <UserPlus className="h-4 w-4 md:hidden" />
                <span className="hidden md:inline">Register</span>
              </Button>
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}
