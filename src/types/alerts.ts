export type AlertSeverity = "info" | "moderate" | "high" | "critical";
export type AlertStatus = "draft" | "published" | "resolved" | "expired";
export type AlertAudience = "internal" | "published";

export interface Alert {
  id: number;
  organization_id: number;
  organization_name: string;
  outbreak_id: number;
  disease_name: string;
  location_name: string;
  severity: AlertSeverity;
  audience: AlertAudience;
  title: string;
  message: string;
  status: AlertStatus;
  fingerprint: string;
  created_by: number | null;
  created_by_name: string | null;
  published_by_name: string | null;
  resolved_by_name: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  resolved_at: string | null;
  expired_at: string | null;
  recipient_count: number;
  unread_count: number;
  acknowledged_count: number;
}

export interface NotificationAlert {
  id: number;
  outbreak_id: number;
  organization_name: string;
  disease_name: string;
  location_name: string;
  severity: AlertSeverity;
  audience: AlertAudience;
  title: string;
  message: string;
  status: AlertStatus;
  published_at: string | null;
}

export interface Notification {
  id: number;
  alert: NotificationAlert;
  read_at: string | null;
  acknowledged_at: string | null;
  created_at: string;
}

export interface AlertsResponse {
  success: boolean;
  message: string;
  data: Alert[];
  total: number;
}

export interface AlertResponse {
  success: boolean;
  message: string;
  data?: Alert;
}

export interface NotificationsResponse {
  success: boolean;
  message: string;
  data: Notification[];
  total: number;
  unread_count: number;
}

export interface NotificationResponse {
  success: boolean;
  message: string;
  data?: Notification;
}
