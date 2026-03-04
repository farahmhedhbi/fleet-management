// src/types/subscription.ts
export type SubscriptionStatus = "TRIAL" | "ACTIVE" | "EXPIRED";

export type SubscriptionInfo = {
  subscriptionStatus?: SubscriptionStatus;
  trialStartAt?: string | null;
  trialEndAt?: string | null;
  paidUntil?: string | null;
};