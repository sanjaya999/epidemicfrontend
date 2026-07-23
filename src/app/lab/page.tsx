import { Suspense } from "react";
import { LabShell } from "@/components/lab/LabShell";

function LabFallback() {
  return (
    <div className="p-8 w-full space-y-8">
      <div className="h-10 w-56 bg-muted animate-pulse rounded-sm" />
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8">
        <div className="h-[420px] rounded-2xl bg-card border border-border animate-pulse" />
        <div className="h-[480px] rounded-2xl bg-card border border-border animate-pulse" />
      </div>
    </div>
  );
}

export default function LabPage() {
  return (
    <Suspense fallback={<LabFallback />}>
      <LabShell />
    </Suspense>
  );
}
