import type { ModelType, SimulationData, SimulationStats } from "@/types/simulation";

export type ResponsePlanStatus = "draft" | "approved" | "completed" | "cancelled";
export type ResponseActionStatus = "pending" | "in_progress" | "completed" | "cancelled";

export interface ResponseInterventionEvent {
  day: number;
  type: string;
  label: string;
  intensity: number;
  end_day: number | null;
  math_effect: string;
}

export interface ResponseImpact {
  cases_avoided: number;
  cases_avoided_percent: number;
  peak_reduction: number;
  peak_reduction_percent: number;
  peak_delay_days: number;
  baseline_exceeds_capacity: boolean | null;
  scenario_exceeds_capacity: boolean | null;
  scenario_capacity_ratio: number | null;
}

export interface ResponseScenario {
  id: number;
  intervention_id: number | null;
  name: string;
  events: ResponseInterventionEvent[];
  stats: SimulationStats;
  data: SimulationData;
  impact: ResponseImpact;
  created_by_name: string | null;
  created_at: string;
}

export interface ResponseAction {
  id: number;
  title: string;
  description: string | null;
  assigned_to: number | null;
  assigned_to_name: string | null;
  due_date: string | null;
  status: ResponseActionStatus;
  created_by_name: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface ResponsePlan {
  id: number;
  outbreak_id: number;
  organization_id: number;
  organization_name: string;
  disease_name: string;
  location_name: string;
  name: string;
  status: ResponsePlanStatus;
  baseline: {
    simulation_id: number | null;
    model_type: ModelType;
    source_report_id: number | null;
    source_report_date: string | null;
    response_capacity: number | null;
    stats: SimulationStats;
    data: SimulationData;
  };
  selected_scenario_id: number | null;
  created_by_name: string | null;
  approved_by_name: string | null;
  created_at: string;
  updated_at: string;
  approved_at: string | null;
  completed_at: string | null;
  scenarios: ResponseScenario[];
  actions: ResponseAction[];
}

export interface ResponsePlanSummary {
  id: number;
  outbreak_id: number;
  organization_name: string;
  disease_name: string;
  location_name: string;
  name: string;
  status: ResponsePlanStatus;
  scenario_count: number;
  action_count: number;
  completed_action_count: number;
  selected_scenario_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface ResponseAssignee {
  id: number;
  username: string;
  role: string;
}

export interface ResponsePlansResponse {
  success: boolean;
  message: string;
  data: ResponsePlanSummary[];
  total: number;
}

export interface ResponsePlanResponse {
  success: boolean;
  message: string;
  data?: ResponsePlan;
}

export interface ResponseAssigneesResponse {
  success: boolean;
  message: string;
  data: ResponseAssignee[];
}

export interface ResponseActionResponse {
  success: boolean;
  message: string;
  data?: ResponseAction;
}

export interface ResponseScenarioPayload {
  name: string;
  events: Array<{
    day: number;
    type: string;
    label: string;
    intensity: number;
    end_day?: number;
    math_effect: string;
  }>;
}

export interface ResponseActionPayload {
  title: string;
  description: string | null;
  assigned_to: number | null;
  due_date: string | null;
}
