import { api } from "@/lib/api";
import { APIResponse, SimulationData, SimulationStats } from "@/types/simulation";

export interface Preset {
  type: string;
  label: string;
  description: string;
  default_intensity: number;
  intensity_range: [number | null, number | null];
  math_effect: string;
}

export interface InterventionEvent {
  day: number;
  type: string;
  label: string;
  intensity: number;
  end_day: number;
  math_effect: string;
}

export interface RunInterventionRequest {
  name: string;
  simulation_id: number;
  events: InterventionEvent[];
}

export interface InterventionSimulation {
  id: number;
  name: string;
  simulation_id: number;
  events: InterventionEvent[];
  stats: SimulationStats;
  data: SimulationData;
  created_at: string;
}

export const interventionService = {
  getPresets: async (): Promise<APIResponse<Preset[]>> => {
    return api.get<APIResponse<Preset[]>>("/interventions/presets");
  },
  run: async (data: RunInterventionRequest): Promise<APIResponse<InterventionSimulation>> => {
    return api.post<APIResponse<InterventionSimulation>>("/interventions/run", data);
  },
  getBySimulationId: async (id: number): Promise<APIResponse<InterventionSimulation[]>> => {
    return api.get<APIResponse<InterventionSimulation[]>>(`/interventions/simulation/${id}`);
  },
  getById: async (id: number): Promise<APIResponse<InterventionSimulation>> => {
    return api.get<APIResponse<InterventionSimulation>>(`/interventions/${id}`);
  }
};