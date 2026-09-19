import { api } from "@/lib/api";
import type {
  SubscriptionResponse,
  SubscriptionsResponse,
  SubscriptionScope,
} from "@/types/subscriptions";

export const subscriptionService = {
  getAll: () => api.get<SubscriptionsResponse>("/subscriptions"),

  create: (scopeType: SubscriptionScope, targetId: number) =>
    api.post<SubscriptionResponse>("/subscriptions", {
      scope_type: scopeType,
      target_id: targetId,
    }),

  remove: (id: number) =>
    api.delete<SubscriptionResponse>(`/subscriptions/${id}`),
};
