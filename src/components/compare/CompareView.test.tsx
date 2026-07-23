import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { simulationService } from "@/services/simulation.service";
import { CompareView } from "@/components/compare/CompareView";

vi.mock("@/services/simulation.service", () => ({
  simulationService: {
    compare: vi.fn(),
  },
}));

function makeSim(id: number, name: string) {
  return {
    id,
    name,
    model_type: "SIR",
    parameters: {
      population: 1000,
      initial_infected: 10,
      initial_exposed: null,
      days: 30,
      beta: 0.3,
      gamma: 0.1,
      sigma: null,
    },
    stats: {
      r0: 3,
      herd_immunity_threshold: 0.6667,
      peak_infected: 500,
      peak_day: 12,
      total_infected: 900,
    },
    created_at: "2026-01-01T00:00:00Z",
  };
}

describe("CompareView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders a side-by-side table for the compared simulations", async () => {
    vi.mocked(simulationService.compare).mockResolvedValue({
      success: true,
      message: "ok",
      data: [makeSim(1, "Baseline"), makeSim(2, "Lockdown")],
    } as never);

    render(<CompareView ids={[1, 2]} />);

    // simulation names become column headers
    expect(await screen.findByText("Baseline")).toBeInTheDocument();
    expect(screen.getByText("Lockdown")).toBeInTheDocument();
    // metric row labels
    expect(screen.getByText("Model")).toBeInTheDocument();
    expect(screen.getByText("Total infected")).toBeInTheDocument();
    // export action is available once data has loaded
    expect(screen.getByRole("button", { name: /export csv/i })).toBeInTheDocument();
  });

  it("shows an empty state and skips fetching when no ids are provided", () => {
    render(<CompareView ids={[]} />);
    expect(screen.getByText(/select two or more simulations/i)).toBeInTheDocument();
    expect(simulationService.compare).not.toHaveBeenCalled();
  });

  it("shows an error message when the comparison fails to load", async () => {
    vi.mocked(simulationService.compare).mockRejectedValue(new Error("boom"));
    render(<CompareView ids={[1, 2]} />);
    expect(await screen.findByText(/failed to load simulations/i)).toBeInTheDocument();
  });
});
