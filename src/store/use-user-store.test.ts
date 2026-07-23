import { describe, it, expect, beforeEach } from "vitest";
import { useUserStore } from "@/store/use-user-store";

const user = {
  id: 1,
  username: "alice",
  email: "alice@example.com",
  is_active: true,
  is_superuser: false,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

describe("useUserStore", () => {
  beforeEach(() => {
    useUserStore.setState({ user: null });
  });

  it("setUser stores the user", () => {
    useUserStore.getState().setUser(user);
    expect(useUserStore.getState().user).toEqual(user);
  });

  it("clearUser resets the user to null", () => {
    useUserStore.getState().setUser(user);
    useUserStore.getState().clearUser();
    expect(useUserStore.getState().user).toBeNull();
  });
});
