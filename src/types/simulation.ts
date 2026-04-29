export type ModelType = "SIR" | "SEIR";

export interface SimulationParameters {
  population: number;
  initial_infected: number;
  initial_exposed: number | null;
  days: number;
  beta: number;
  gamma: number;
  sigma: number | null;
}

export interface SimulationStats {
  r0: number;
  herd_immunity_threshold: number;
  peak_infected: number;
  peak_day: number;
  total_infected: number;
}

export interface SimulationData {
  days: number[];
  susceptible: number[];
  infected: number[];
  recovered: number[];
  exposed: number[] | null;
}

export interface Simulation {
  id: number;
  name: string;
  model_type: ModelType;
  parameters: SimulationParameters;
  stats: SimulationStats;
  data: SimulationData;
  created_at: string;
}

export interface SimulationSummary {
  id: number;
  name: string;
  model_type: ModelType;
  parameters: SimulationParameters;
  stats: SimulationStats;
  created_at: string;
}

export interface RunSimulationRequest {
  name: string;
  model_type: ModelType;
  population: number;
  initial_infected: number;
  initial_exposed?: number | null;
  days: number;
  beta: number;
  gamma: number;
  sigma?: number | null;
}

export interface APIResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}