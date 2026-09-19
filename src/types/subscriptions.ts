export type SubscriptionScope = "organization" | "location";

export interface AlertSubscription {
  id: number;
  scope_type: SubscriptionScope;
  organization_id: number | null;
  organization_name: string;
  location_id: number | null;
  location_name: string | null;
  parent_location_name: string | null;
  created_at: string;
}

export interface SubscriptionsResponse {
  success: boolean;
  message: string;
  data: AlertSubscription[];
  total: number;
}

export interface SubscriptionResponse {
  success: boolean;
  message: string;
  data?: AlertSubscription;
  notifications_added: number;
}
