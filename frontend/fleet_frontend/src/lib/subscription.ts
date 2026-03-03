import type { SubscriptionStatus } from "@/types/subscription";

export function isOwnerSubscriptionActive(status?: SubscriptionStatus) {
  return status === "ACTIVE" || status === "TRIAL";
}

export function isExpired(status?: SubscriptionStatus) {
  return status === "EXPIRED";
}