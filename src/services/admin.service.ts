import { api } from "@/lib/api";
import type {
  AdminDashboardResponse,
  AdminIntervention,
  AdminListResponse,
  AdminSimulation,
  AdminUser,
} from "@/types/admin";

export const adminService = {
  getDashboard: async () => {
    return api.get<AdminDashboardResponse>("/admin/dashboard");
  },

  getUsers: async (params?: {
    skip?: number;
    limit?: number;
    search?: string;
    is_active?: boolean;
  }) => {
    return api.get<AdminListResponse<AdminUser>>("/admin/users", { params });
  },

  toggleUserStatus: async (userId: number, is_active: boolean) => {
    return api.patch<AdminListResponse<AdminUser>>(`/admin/users/${userId}/status`, {
      is_active,
    });
  },

  toggleUserRole: async (userId: number, is_superuser: boolean) => {
    return api.patch<AdminListResponse<AdminUser>>(`/admin/users/${userId}/role`, {
      is_superuser,
    });
  },

  deleteUser: async (userId: number) => {
    return api.delete<void>(`/admin/users/${userId}`);
  },

  getSimulations: async (params?: {
    skip?: number;
    limit?: number;
    search?: string;
    model_type?: string;
  }) => {
    return api.get<AdminListResponse<AdminSimulation>>("/admin/simulations", { params });
  },

  toggleSimulationVisibility: async (simulationId: number, is_public: boolean) => {
    return api.patch<AdminListResponse<AdminSimulation>>(
      `/admin/simulations/${simulationId}/visibility`,
      { is_public }
    );
  },

  deleteSimulation: async (simulationId: number) => {
    return api.delete<void>(`/admin/simulations/${simulationId}`);
  },

  getInterventions: async (params?: {
    skip?: number;
    limit?: number;
    search?: string;
  }) => {
    return api.get<AdminListResponse<AdminIntervention>>("/admin/interventions", { params });
  },

  deleteIntervention: async (interventionId: number) => {
    return api.delete<void>(`/admin/interventions/${interventionId}`);
  },
};
