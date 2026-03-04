// src/lib/subscription.ts
import type { SubscriptionInfo, SubscriptionStatus } from "@/types/subscription";

function parseDate(date?: string | null) {
  if (!date) return null;
  const t = new Date(date).getTime();
  if (Number.isNaN(t)) return null;
  return t;
}

function isFuture(date?: string | null) {
  const t = parseDate(date);
  if (t == null) return false;
  return t > Date.now();
}

export function isSubscriptionActive(info?: SubscriptionInfo) {
  const status = info?.subscriptionStatus as SubscriptionStatus | undefined;

  if (status === "ACTIVE") {
    return isFuture(info?.paidUntil ?? null);
  }

  if (status === "TRIAL") {
    return isFuture(info?.trialEndAt ?? null);
  }

  return false;
}

export function isSubscriptionExpired(info?: SubscriptionInfo) {
  const status = info?.subscriptionStatus as SubscriptionStatus | undefined;

  // backend peut déjà mettre EXPIRED
  if (status === "EXPIRED") return true;

  // TRIAL mais date passée => expiré
  if (status === "TRIAL") return !isFuture(info?.trialEndAt ?? null);

  // ACTIVE mais paidUntil passé => expiré
  if (status === "ACTIVE") return !isFuture(info?.paidUntil ?? null);

  return false;
}

export function remainingTime(target?: string | null) {
  const t = parseDate(target);
  if (t == null) return null;

  const diff = t - Date.now();
  if (diff <= 0) return { days: 0, hours: 0 };

  const totalHours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  return { days, hours };
}

export function fmtDateTime(date?: string | null) {
  if (!date) return "—";
  const d = new Date(date);
  return Number.isNaN(d.getTime()) ? String(date) : d.toLocaleString();
}