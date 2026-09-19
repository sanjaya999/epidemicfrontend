import { RoleGuard } from "@/components/role-guard";

export default function ReportsLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowed={["reporter", "health_officer", "admin"]}>
      {children}
    </RoleGuard>
  );
}
