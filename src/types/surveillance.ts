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
  detected_at: string;
  resolved_at: string | null;
  trigger_evidence: TriggerEvidence;
  updated_at: string;
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
