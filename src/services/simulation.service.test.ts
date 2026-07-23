import { describe, it, expect, vi, beforeEach } from "vitest";
import { api } from "@/lib/api";
import { simulationService } from "@/services/simulation.service";

vi.mock("@/lib/api", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("simulationService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getAll forwards query params", async () => {
    vi.mocked(api.get).mockResolvedValue({ success: true, message: "ok", data: [] } as never);
    await simulationService.getAll({ search: "flu", model_type: "SIR", skip: 0, limit: 10 });
    expect(api.get).toHaveBeenCalledWith("/simulations", {
      params: { search: "flu", model_type: "SIR", skip: 0, limit: 10 },
    });
  });

  it("compare posts the simulation ids", async () => {
    vi.mocked(api.post).mockResolvedValue({ success: true, message: "ok", data: [] } as never);
    await simulationService.compare([1, 2, 3]);
    expect(api.post).toHaveBeenCalledWith("/simulations/compare", { simulation_ids: [1, 2, 3] });
  });

  it("sweep posts to the per-simulation sweep endpoint", async () => {
    vi.mocked(api.post).mockResolvedValue({
      success: true,
      message: "ok",
      data: { parameter: "beta", points: [] },
    } as never);
    await simulationService.sweep(7, { parameter: "beta", min: 0.1, max: 0.5, steps: 10 });
    expect(api.post).toHaveBeenCalledWith("/simulations/7/sweep", {
      parameter: "beta",
      min: 0.1,
      max: 0.5,
      steps: 10,
    });
  });

  it("exportCsv requests a blob", async () => {
    vi.mocked(api.get).mockResolvedValue(new Blob() as never);
    await simulationService.exportCsv(3);
    expect(api.get).toHaveBeenCalledWith("/simulations/3/export.csv", { responseType: "blob" });
  });

  it("getStats fetches /simulations/stats", async () => {
    vi.mocked(api.get).mockResolvedValue({
      success: true,
      message: "ok",
      data: { total: 3, by_model: { SIR: 2, SEIR: 1 } },
    } as never);
    await simulationService.getStats();
    expect(api.get).toHaveBeenCalledWith("/simulations/stats");
  });
});
