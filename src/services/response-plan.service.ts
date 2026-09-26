import { api } from "@/lib/api";
import type {
  ResponseActionPayload,
  ResponseActionResponse,
  ResponseActionStatus,
  ResponseAssigneesResponse,
  ResponsePlanResponse,
  ResponsePlansResponse,
  ResponseScenarioPayload,
} from "@/types/response-plan";

export const responsePlanService = {
  getAll: (params?: { status_filter?: string; outbreak_id?: number }) =>
    api.get<ResponsePlansResponse>("/response-plans", { params }),

  getByOutbreak: (outbreakId: number) =>
    api.get<ResponsePlansResponse>(`/outbreaks/${outbreakId}/response-plans`),

  create: (outbreakId: number, name?: string) =>
    api.post<ResponsePlanResponse>(`/outbreaks/${outbreakId}/response-plans`, {
      name: name || null,
    }),

  get: (id: number) =>
    api.get<ResponsePlanResponse>(`/response-plans/${id}`),

  addScenario: (id: number, payload: ResponseScenarioPayload) =>
    api.post<ResponsePlanResponse>(`/response-plans/${id}/scenarios`, payload),

  approve: (id: number, scenarioId: number) =>
    api.post<ResponsePlanResponse>(`/response-plans/${id}/approve`, {
      scenario_id: scenarioId,
    }),

  getAssignees: () =>
    api.get<ResponseAssigneesResponse>("/response-plans/assignees"),

  addAction: (id: number, payload: ResponseActionPayload) =>
    api.post<ResponsePlanResponse>(`/response-plans/${id}/actions`, payload),

  updateAction: (
    id: number,
    payload: {
      status?: ResponseActionStatus;
      assigned_to?: number | null;
      due_date?: string | null;
    }
  ) => api.patch<ResponseActionResponse>(`/response-actions/${id}`, payload),
};
