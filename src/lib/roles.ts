import type { User, UserRole } from "@/types/auth";

export const USER_ROLES: UserRole[] = [
  "citizen",
  "reporter",
  "health_officer",
  "admin",
];

export const ROLE_LABELS: Record<UserRole, string> = {
  citizen: "Citizen",
  reporter: "Case reporter",
  health_officer: "Health officer",
  admin: "Administrator",
};

export function getEffectiveRole(user: User): UserRole {
  if (user.is_superuser) return "admin";
  return user.role ?? "citizen";
}

export function hasRole(user: User | null, allowed: UserRole[]): boolean {
  return !!user && allowed.includes(getEffectiveRole(user));
}
