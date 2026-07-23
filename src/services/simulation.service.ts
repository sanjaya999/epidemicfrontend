import { api } from "@/lib/api";
import {
  APIResponse,
  AIAnalysis,
  PublicSimulationEntry,
  RunSimulationRequest,
  Simulation,
  SimulationPreset,
  SimulationSummary,
  SweepResult,
  UserSimulationStats,
} from "@/types/simulation";

export const simulationService = {
  run: async (data: RunSimulationRequest): Promise<APIResponse<Simulation>> => {
    return api.post<APIResponse<Simulation>>("/simulations/run", data);
  },

  getPresets: async (): Promise<APIResponse<SimulationPreset[]>> => {
    return api.get<APIResponse<SimulationPreset[]>>("/simulations/presets");
  },

  getAll: async (params?: {
    search?: string;
    model_type?: string;
    skip?: number;
    limit?: number;
  }): Promise<APIResponse<SimulationSummary[]>> => {
    return api.get<APIResponse<SimulationSummary[]>>("/simulations", { params });
  },

  getStats: async (): Promise<APIResponse<UserSimulationStats>> => {
    return api.get<APIResponse<UserSimulationStats>>("/simulations/stats");
  },

  compare: async (ids: number[]): Promise<APIResponse<SimulationSummary[]>> => {
    return api.post<APIResponse<SimulationSummary[]>>("/simulations/compare", {
      simulation_ids: ids,
    });
  },

  sweep: async (
    id: number,
    params: { parameter: "beta" | "gamma" | "sigma"; min: number; max: number; steps: number }
  ): Promise<APIResponse<SweepResult>> => {
    return api.post<APIResponse<SweepResult>>(`/simulations/${id}/sweep`, params);
  },

  getById: async (id: number): Promise<APIResponse<Simulation>> => {
    return api.get<APIResponse<Simulation>>(`/simulations/${id}`);
  },

  exportCsv: async (id: number): Promise<Blob> => {
    return api.get<Blob>(`/simulations/${id}/export.csv`, { responseType: "blob" });
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