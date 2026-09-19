import { RoleGuard } from "@/components/role-guard";

export default function SubscriptionsLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowed={["citizen", "reporter", "health_officer", "admin"]}>
      {children}
    </RoleGuard>
  );
}
