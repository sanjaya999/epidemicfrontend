import { api } from "@/lib/api";
import {
  APIResponse,
  AIAnalysis,
  PublicSimulationEntry,
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

  getPublic: async (): Promise<APIResponse<PublicSimulationEntry[]>> => {
    return api.get<APIResponse<PublicSimulationEntry[]>>("/simulations/public");
  },

  updateVisibility: async (id: number, isPublic: boolean): Promise<APIResponse<Simulation>> => {
    return api.patch<APIResponse<Simulation>>(`/simulations/${id}/visibility`, { is_public: isPublic });
  },

  delete: async (id: number): Promise<void> => {
    return api.delete(`/simulations/${id}`);
  },

  analyze: async (id: number): Promise<APIResponse<AIAnalysis>> => {
    return api.post<APIResponse<AIAnalysis>>(`/simulations/${id}/analyze`);
  },
};