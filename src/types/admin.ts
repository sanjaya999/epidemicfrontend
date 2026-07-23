export interface DashboardStats {
  total_users: number;
  active_users: number;
  inactive_users: number;
  superusers: number;
  total_simulations: number;
  public_simulations: number;
  total_interventions: number;
}

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  is_active: boolean;
  is_superuser: boolean;
  created_at: string;
  updated_at: string;
  simulation_count: number;
  intervention_count: number;
}

export interface AdminSimulation {
  id: number;
  name: string;
  model_type: string;
  is_public: boolean;
  user_id: number;
  username: string;
  parameters: Record<string, unknown>;
  created_at: string;
}

export interface AdminIntervention {
  id: number;
  name: string;
  simulation_id: number;
  user_id: number;
  username: string;
  created_at: string;
}

export interface AdminListResponse<T> {
  success: boolean;
  message: string;
  data?: T[];
  total: number;
}

export interface AdminDashboardResponse {
  success: boolean;
  message: string;
  data?: DashboardStats;
}
