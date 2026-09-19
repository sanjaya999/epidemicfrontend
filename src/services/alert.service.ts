import { api } from "@/lib/api";
import type {
  AlertResponse,
  AlertsResponse,
  AlertSeverity,
  AlertStatus,
  NotificationResponse,
  NotificationsResponse,
} from "@/types/alerts";

export const alertService = {
  getAlerts: (params?: {
    status?: AlertStatus;
    severity?: AlertSeverity;
    outbreak_id?: number;
  }) => api.get<AlertsResponse>("/alerts", { params }),

  getAlert: (id: number) => api.get<AlertResponse>(`/alerts/${id}`),

  publishAlert: (id: number) =>
    api.post<AlertResponse>(`/alerts/${id}/publish`),

  resolveAlert: (id: number) =>
    api.post<AlertResponse>(`/alerts/${id}/resolve`),

  expireAlert: (id: number) =>
    api.post<AlertResponse>(`/alerts/${id}/expire`),

  getNotifications: (params?: { unread_only?: boolean }) =>
    api.get<NotificationsResponse>("/notifications", { params }),

  markRead: (id: number) =>
    api.post<NotificationResponse>(`/notifications/${id}/read`),

  acknowledge: (id: number) =>
    api.post<NotificationResponse>(`/notifications/${id}/acknowledge`),

  markAllRead: () => api.post<NotificationsResponse>("/notifications/read-all"),
};
