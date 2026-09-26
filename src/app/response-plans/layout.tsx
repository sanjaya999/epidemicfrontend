import { RoleGuard } from "@/components/role-guard";

export default function ResponsePlansLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowed={["health_officer", "admin"]}>
      {children}
    </RoleGuard>
  );
}
