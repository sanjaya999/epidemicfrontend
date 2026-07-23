import { describe, it, expect, vi, beforeEach } from "vitest";
import { api } from "@/lib/api";
import { authService } from "@/services/auth.service";

vi.mock("@/lib/api", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("authService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("register posts the payload to /users/register", async () => {
    vi.mocked(api.post).mockResolvedValue({ success: true, message: "ok" } as never);
    const payload = { username: "alice", email: "alice@example.com", password: "Secret123" };
    await authService.register(payload);
    expect(api.post).toHaveBeenCalledWith("/users/register", payload);
  });

  it("login posts the payload to /users/login", async () => {
    vi.mocked(api.post).mockResolvedValue({ access_token: "t", token_type: "bearer" } as never);
    const payload = { email: "alice@example.com", password: "Secret123" };
    await authService.login(payload);
    expect(api.post).toHaveBeenCalledWith("/users/login", payload);
  });

  it("logout posts to /users/logout with no body", async () => {
    vi.mocked(api.post).mockResolvedValue({ success: true, message: "ok" } as never);
    await authService.logout();
    expect(api.post).toHaveBeenCalledWith("/users/logout");
  });

  it("getMe fetches /users/me", async () => {
    vi.mocked(api.get).mockResolvedValue({ success: true, message: "ok" } as never);
    await authService.getMe();
    expect(api.get).toHaveBeenCalledWith("/users/me");
  });
});
