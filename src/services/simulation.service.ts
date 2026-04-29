import { api } from "@/lib/api";
import {
  APIResponse,
  RunSimulationRequest,
  Simulation,
  SimulationSummary,
} from "@/types/simulation";

export const simulationService = {
  run: async (data: RunSimulationRequest): Promise<APIResponse<Simulation>> => {
    return api.post<APIResponse<Simulation>>("/simulations/run", data);
  },

  getAll: async (): Promise<APIResponse<SimulationSummary[]>> => {
    return api.get<APIResponse<SimulationSummary[]>>("/simulations");
  },

  getById: async (id: number): Promise<APIResponse<Simulation>> => {
    return api.get<APIResponse<Simulation>>(`/simulations/${id}`);
  },

  delete: async (id: number): Promise<void> => {
    return api.delete(`/simulations/${id}`);
  },
};