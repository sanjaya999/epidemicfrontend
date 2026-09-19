"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { hasRole } from "@/lib/roles";
import type { UserRole } from "@/types/auth";

interface RoleGuardProps {
  allowed: UserRole[];
  children: ReactNode;
  redirectTo?: string;
}

export function RoleGuard({ allowed, children, redirectTo = "/" }: RoleGuardProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const permitted = hasRole(user, allowed);

  useEffect(() => {
    if (!isLoading && !permitted) router.replace(redirectTo);
  }, [isLoading, permitted, redirectTo, router]);

  if (isLoading) {
    return (
      <div className="p-8 w-full space-y-5" aria-label="Checking permissions">
        <div className="h-9 w-56 rounded-md bg-muted animate-pulse" />
        <div className="h-32 rounded-xl border bg-card animate-pulse" />
      </div>
    );
  }

  if (!permitted) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
        <ShieldAlert className="mb-4 h-10 w-10 text-amber-600" aria-hidden="true" />
        <h1 className="text-xl font-semibold">Restricted workspace</h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Your account does not have the role required to open this page.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
