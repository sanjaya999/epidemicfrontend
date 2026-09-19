import { api } from "@/lib/api";
import type {
  CaseReportCorrection,
  CaseReportPayload,
  CaseReportResponse,
  CaseReportsResponse,
  OutbreakResponse,
  OutbreaksResponse,
  OutbreakStatus,
  RiskLevel,
} from "@/types/surveillance";

export const surveillanceService = {
  getReports: (params?: {
    organization_id?: number;
    location_id?: number;
    disease_id?: number;
    from?: string;
    to?: string;
  }) => api.get<CaseReportsResponse>("/case-reports", { params }),

  createReport: (payload: CaseReportPayload) =>
    api.post<CaseReportResponse>("/case-reports", payload),

  correctReport: (id: number, payload: CaseReportCorrection) =>
    api.patch<CaseReportResponse>(`/case-reports/${id}`, payload),

  getOutbreaks: (params?: {
    status?: OutbreakStatus;
    risk?: RiskLevel;
    location_id?: number;
  }) => api.get<OutbreaksResponse>("/outbreaks", { params }),

  getOutbreak: (id: number) => api.get<OutbreakResponse>(`/outbreaks/${id}`),

  resolveOutbreak: (id: number) =>
    api.post<OutbreakResponse>(`/outbreaks/${id}/resolve`),
};
