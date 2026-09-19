import { describe, expect, it } from "vitest";
import { getEffectiveRole, hasRole, ROLE_LABELS } from "@/lib/roles";
import type { User } from "@/types/auth";

const citizen: User = {
  id: 1,
  username: "alice",
  email: "alice@example.com",
  is_active: true,
  is_superuser: false,
  role: "citizen",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

describe("role helpers", () => {
  it("uses the explicit application role", () => {
    expect(getEffectiveRole({ ...citizen, role: "health_officer" })).toBe("health_officer");
    expect(ROLE_LABELS.health_officer).toBe("Health officer");
  });

  it("treats a legacy superuser as an administrator", () => {
    const legacyAdmin = { ...citizen, is_superuser: true };
    expect(getEffectiveRole(legacyAdmin)).toBe("admin");
    expect(hasRole(legacyAdmin, ["admin"])).toBe(true);
  });

  it("rejects roles outside the allowed list", () => {
    expect(hasRole(citizen, ["reporter", "health_officer"])).toBe(false);
  });
});
