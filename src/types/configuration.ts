export type OrganizationType =
  | "municipality"
  | "university"
  | "school"
  | "hospital"
  | "clinic"
  | "ngo"
  | "community"
  | "other";

export interface Organization {
  id: number;
  name: string;
  organization_type: OrganizationType;
  is_active: boolean;
  created_at: string;
  location_count: number;
  disease_count: number;
}

export interface OrganizationPayload {
  name: string;
  organization_type: OrganizationType;
}

export interface Location {
  id: number;
  organization_id: number;
  organization_name: string;
  name: string;
  population: number;
  response_capacity: number | null;
  parent_id: number | null;
  parent_name: string | null;
  is_active: boolean;
  created_at: string;
}

export interface LocationPayload {
  organization_id: number;
  name: string;
  population: number;
  response_capacity: number | null;
  parent_id: number | null;
}

export interface DetectionRules {
  window_days: number;
  case_threshold: number;
  incidence_per_100k: number | null;
}

export interface DiseaseProfile {
  id: number;
  organization_id: number | null;
  organization_name: string | null;
  name: string;
  model_type: "SIR" | "SEIR";
  default_r0: number;
  infectious_days: number;
  incubation_days: number | null;
  forecast_days: number;
  detection_rules: DetectionRules;
  beta: number;
  gamma: number;
  sigma: number | null;
  is_active: boolean;
  created_at: string;
}

export interface DiseaseProfilePayload {
  organization_id: number | null;
  name: string;
  model_type: "SIR" | "SEIR";
  default_r0: number;
  infectious_days: number;
  incubation_days: number | null;
  forecast_days: number;
  detection_rules: DetectionRules;
}

export interface ConfigurationListResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  total: number;
}

export interface ConfigurationItemResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}
