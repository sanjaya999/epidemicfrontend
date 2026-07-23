import { describe, it, expect, beforeEach } from "vitest";
import { useSimulationStore } from "@/store/use-simulation-store";
import { SimulationSummary } from "@/types/simulation";

function makeSummary(id: number, name: string): SimulationSummary {
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

describe("useSimulationStore", () => {
  beforeEach(() => {
    useSimulationStore.setState({ simulations: [], currentSimulation: null, isLoading: false });
  });

  it("setSimulations replaces the list", () => {
    useSimulationStore.getState().setSimulations([makeSummary(1, "A"), makeSummary(2, "B")]);
    expect(useSimulationStore.getState().simulations).toHaveLength(2);
  });

  it("addSimulation prepends to the list", () => {
    const { setSimulations, addSimulation } = useSimulationStore.getState();
    setSimulations([makeSummary(1, "A")]);
    addSimulation(makeSummary(2, "B"));
    const sims = useSimulationStore.getState().simulations;
    expect(sims).toHaveLength(2);
    expect(sims[0].id).toBe(2);
  });

  it("removeSimulation removes by id", () => {
    const { setSimulations, removeSimulation } = useSimulationStore.getState();
    setSimulations([makeSummary(1, "A"), makeSummary(2, "B")]);
    removeSimulation(1);
    const sims = useSimulationStore.getState().simulations;
    expect(sims).toHaveLength(1);
    expect(sims[0].id).toBe(2);
  });

  it("updateSimulation merges updates into the matching simulation", () => {
    const { setSimulations, updateSimulation } = useSimulationStore.getState();
    setSimulations([makeSummary(1, "A")]);
    updateSimulation(1, { is_public: true });
    expect(useSimulationStore.getState().simulations[0].is_public).toBe(true);
  });

  it("setCurrentSimulation and setLoading update their slices", () => {
    const { setCurrentSimulation, setLoading } = useSimulationStore.getState();
    setLoading(true);
    expect(useSimulationStore.getState().isLoading).toBe(true);
    setCurrentSimulation(null);
    expect(useSimulationStore.getState().currentSimulation).toBeNull();
  });
});
