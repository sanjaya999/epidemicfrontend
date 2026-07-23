"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useUserStore } from "@/store/use-user-store";
import { authService } from "@/services/auth.service";
import {
  LayoutDashboard,
  Folder,
  FlaskConical,
  BarChart3,
  CircleDot,
  LogOut,
  User as UserIcon,
  ShieldCheck,
} from "lucide-react";

const sidebarItems = [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Simulations",
    href: "/simulations",
    icon: FlaskConical,
  },
  {
    title: "Outbreak Lab",
    href: "/lab",
    icon: CircleDot,
  },
  {
    title: "My simulations",
    href: "/history",
    icon: Folder,
  },
  {
    title: "Analytics",
    href: "/analytics",
    icon: BarChart3,
  },
];

const adminItem = {
  title: "Admin Panel",
  href: "/admin",
  icon: ShieldCheck,
};

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, setUser, clearUser } = useUserStore();
  const [isLoading, setIsLoading] = useState(true);

  const isAuthPage = pathname === "/login" || pathname === "/register";

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await authService.getMe() as any;
        setUser(response.data);
      } catch (error) {
        clearUser();
      } finally {
        setIsLoading(false);
      }
    };

    if (!user && !isAuthPage) {
      fetchUser();
    } else {
      setIsLoading(false);
    }
  }, [setUser, clearUser, isAuthPage]);

  const handleLogout = async () => {
    try {
      await authService.logout();
      clearUser();
      router.push("/login");
    } catch (error) {
      clearUser();
      router.push("/login");
    }
  };

  if (isAuthPage) return null;

  return (
    <aside className="w-64 border-r bg-background flex flex-col h-screen sticky top-0">
      <div className="p-6 border-b">
        <Link href="/" className="text-xl font-bold tracking-tight text-primary">
          EpidemicSim
        </Link>
      </div>

      <div className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
        {sidebarItems.map((item) => {
          const isActive = item.href === "/simulations"
            ? pathname.startsWith("/simulations") || pathname.startsWith("/simulate")
            : pathname === item.href;
            
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group",
                isActive 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className={cn(
                "h-4 w-4 transition-transform duration-200 group-hover:scale-110",
                isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
              )} />
              {item.title}
            </Link>
          );
        })}

        {user?.is_superuser && (
          <div className="pt-4 mt-4 border-t border-border">
            <p className="px-3 mb-2 text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
              Administration
            </p>
            <Link
              href={adminItem.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group",
                pathname.startsWith("/admin")
                  ? "bg-purple-600 text-white"
                  : "text-purple-600 hover:bg-purple-50"
              )}
            >
              <adminItem.icon className={cn(
                "h-4 w-4 transition-transform duration-200 group-hover:scale-110",
                pathname.startsWith("/admin") ? "text-white" : "text-purple-600"
              )} />
              {adminItem.title}
            </Link>
          </div>
        )}
      </div>

      <div className="p-4 border-t bg-muted/30 min-h-[100px] flex flex-col justify-center">
        {isLoading ? (
          <div className="flex items-center gap-3 px-2 animate-pulse">
            <div className="h-8 w-8 rounded-full bg-muted" />
            <div className="flex flex-col gap-2 flex-1">
              <div className="h-3 w-20 bg-muted rounded" />
              <div className="h-2 w-32 bg-muted rounded" />
            </div>
          </div>
        ) : user ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 px-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <UserIcon className="h-4 w-4 text-primary" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold truncate">{user.username}</span>
                <span className="text-[11px] text-muted-foreground truncate">{user.email}</span>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLogout}
              className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 font-medium gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <Link href="/login">
              <Button variant="outline" size="sm" className="w-full text-xs">Sign in</Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="w-full text-xs">Register</Button>
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}
