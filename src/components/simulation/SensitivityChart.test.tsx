import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { simulationService } from "@/services/simulation.service";
import { SensitivityChart } from "@/components/simulation/SensitivityChart";

vi.mock("@/services/simulation.service", () => ({
  simulationService: {
    getById: vi.fn(),
    sweep: vi.fn(),
  },
}));

describe("SensitivityChart", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(simulationService.getById).mockResolvedValue({
      success: true,
      message: "ok",
      data: { model_type: "SIR" },
    } as never);
    vi.mocked(simulationService.sweep).mockResolvedValue({
      success: true,
      message: "ok",
      data: { parameter: "beta", points: [] },
    } as never);
  });

  it("renders the parameter and metric selectors", async () => {
    render(<SensitivityChart simulationId={1} />);
    expect(await screen.findByRole("button", { name: "beta" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "gamma" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Peak infected" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Total infected" })).toBeInTheDocument();
  });

  it("does not offer sigma for an SIR model", async () => {
    render(<SensitivityChart simulationId={1} />);
    await screen.findByRole("button", { name: "beta" });
    expect(screen.queryByRole("button", { name: "sigma" })).not.toBeInTheDocument();
  });

  it("shows a placeholder while there are no sweep points", async () => {
    render(<SensitivityChart simulationId={1} />);
    expect(await screen.findByText("Loading sensitivity data…")).toBeInTheDocument();
  });

  it("re-sweeps when a different parameter is selected", async () => {
    const user = userEvent.setup();
    render(<SensitivityChart simulationId={1} />);
    const gamma = await screen.findByRole("button", { name: "gamma" });
    await user.click(gamma);
    await waitFor(() => {
      expect(simulationService.sweep).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ parameter: "gamma" })
      );
    });
  });
});
