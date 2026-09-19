export interface DetectionResult {
  triggered: boolean;
  outbreak_id: number | null;
  outbreak_created: boolean;
  message: string;
  window_days: number;
  confirmed_cases: number;
  case_threshold: number;
  incidence_per_100k: number | null;
}

export interface CaseReport {
  id: number;
  organization_id: number;
  organization_name: string;
  location_id: number;
  location_name: string;
  disease_profile_id: number;
  disease_name: string;
  report_date: string;
  new_suspected: number;
  new_confirmed: number;
  active_cases: number;
  new_recovered: number;
  hospitalized: number;
  deaths: number;
  notes: string | null;
  submitted_by: number;
  submitted_by_name: string;
  created_at: string;
  updated_at: string;
}

export interface CaseReportPayload {
  organization_id: number;
  location_id: number;
  disease_profile_id: number;
  report_date: string;
  new_suspected: number;
  new_confirmed: number;
  active_cases: number;
  new_recovered: number;
  hospitalized: number;
  deaths: number;
  notes: string | null;
}

export type CaseReportCorrection = Pick<
  CaseReportPayload,
  | "new_suspected"
  | "new_confirmed"
  | "active_cases"
  | "new_recovered"
  | "hospitalized"
  | "deaths"
  | "notes"
>;

export interface CaseReportResponse {
  success: boolean;
  message: string;
  data?: CaseReport;
  detection?: DetectionResult;
}

export interface CaseReportsResponse {
  success: boolean;
  message: string;
  data: CaseReport[];
  total: number;
}

export type OutbreakStatus = "suspected" | "active" | "monitoring" | "resolved";
export type RiskLevel = "low" | "moderate" | "high" | "critical";

export interface TriggerEvidence {
  window_days: number;
  window_start: string;
  window_end: string;
  confirmed_cases: number;
  case_threshold: number;
  incidence_per_100k: number;
  incidence_threshold_per_100k: number | null;
  triggered_rules: string[];
  source_report_ids: number[];
}

export interface Outbreak {
  id: number;
  organization_id: number;
  organization_name: string;
  location_id: number;
  location_name: string;
  disease_profile_id: number;
  disease_name: string;
  status: OutbreakStatus;
  risk_level: RiskLevel | null;
  risk_evidence: RiskEvidence | null;
  latest_simulation_id: number | null;
  detected_at: string;
  resolved_at: string | null;
  trigger_evidence: TriggerEvidence;
  updated_at: string;
}

export interface RiskEvidence {
  method: "response_capacity" | "population_fallback";
  projected_peak_active: number;
  peak_day: number;
  projected_peak_date: string;
  population: number;
  response_capacity: number | null;
  capacity_ratio: number | null;
  peak_population_percent: number;
  thresholds: {
    moderate: number;
    high: number;
    critical: number;
    unit: string;
  };
  explanation: string;
  forecast_simulation_id: number;
}

export interface OutbreakForecast {
  id: number;
  model_type: "SIR" | "SEIR";
  parameters: {
    population: number;
    initial_infected: number;
    initial_exposed: number | null;
    days: number;
    beta: number;
    gamma: number;
    sigma: number | null;
  };
  input_snapshot: {
    source_report_id: number;
    source_report_date: string;
    location_name: string;
    population: number;
    response_capacity: number | null;
    disease_name: string;
    model_type: "SIR" | "SEIR";
    assumed_r0: number;
    infectious_days: number;
    incubation_days: number | null;
    forecast_days: number;
    initial_infected: number;
    initial_exposed: number | null;
    beta: number;
    gamma: number;
    sigma: number | null;
  };
  stats: {
    r0: number;
    herd_immunity_threshold: number;
    peak_infected: number;
    peak_day: number;
    total_infected: number;
  };
  data: {
    days: number[];
    susceptible: number[];
    infected: number[];
    recovered: number[];
    exposed: number[] | null;
  };
  created_at: string;
}

export interface AuditEvent {
  id: number;
  action: string;
  actor_name: string | null;
  changes: Record<string, unknown>;
  created_at: string;
}

export interface OutbreakDetail extends Outbreak {
  reports: CaseReport[];
  activity: AuditEvent[];
  forecast: OutbreakForecast | null;
}

export interface OutbreaksResponse {
  success: boolean;
  message: string;
  data: Outbreak[];
  total: number;
}

export interface OutbreakResponse {
  success: boolean;
  message: string;
  data?: OutbreakDetail;
}
