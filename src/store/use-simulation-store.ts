import { create } from "zustand";
import { Simulation, SimulationSummary } from "@/types/simulation";

interface SimulationStore {
  simulations: SimulationSummary[];
  currentSimulation: Simulation | null;
  isLoading: boolean;

  setSimulations: (simulations: SimulationSummary[]) => void;
  addSimulation: (simulation: SimulationSummary) => void;
  removeSimulation: (id: number) => void;
  updateSimulation: (id: number, updates: Partial<SimulationSummary>) => void;
  setCurrentSimulation: (simulation: Simulation | null) => void;
  setLoading: (loading: boolean) => void;
}
export const useSimulationStore = create<SimulationStore>((set) => ({
  simulations: [],
  currentSimulation: null,
  isLoading: false,

  setSimulations: (simulations) => set({ simulations }),
  addSimulation: (simulation) =>
    set((state) => ({
      simulations: [simulation, ...state.simulations],
    })),
  removeSimulation: (id) =>
    set((state) => ({
      simulations: state.simulations.filter((s) => s.id !== id),
    })),
  updateSimulation: (id, updates) =>
    set((state) => ({
      simulations: state.simulations.map((s) =>
        s.id === id ? { ...s, ...updates } : s
      ),
    })),
  setCurrentSimulation: (simulation) => set({ currentSimulation: simulation }),
  setLoading: (loading) => set({ isLoading: loading }),
}));