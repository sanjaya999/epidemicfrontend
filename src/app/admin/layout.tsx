"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { ShieldCheck } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!user || !user.is_superuser)) {
      router.replace("/");
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="p-8 w-full space-y-6">
        <div className="h-10 w-56 bg-muted animate-pulse rounded-sm" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-lg bg-card border border-border animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!user || !user.is_superuser) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <ShieldCheck className="h-12 w-12 text-muted-foreground/20 mb-4" />
        <p className="text-muted-foreground text-sm">
          You don&apos;t have permission to access this page.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
