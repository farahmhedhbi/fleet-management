// src/types/auth.ts
import type { SubscriptionInfo } from "@/types/subscription";

export type RoleName =
  | "ROLE_ADMIN"
  | "ROLE_OWNER"
  | "ROLE_DRIVER"
  | "ROLE_API_CLIENT";

export type RegisterRole = "ROLE_OWNER";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  role: RegisterRole; // ✅ public register = OWNER only
  licenseNumber?: string;
}

export interface AuthResponse {
  token: string;
  type?: string;
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: "ROLE_ADMIN" | "ROLE_OWNER" | "ROLE_DRIVER";

  subscriptionStatus?: SubscriptionInfo["subscriptionStatus"];
  trialStartAt?: string | null;
  trialEndAt?: string | null;
  paidUntil?: string | null;

  mustChangePassword: boolean;
}

export interface MeResponse {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: "ROLE_ADMIN" | "ROLE_OWNER" | "ROLE_DRIVER";

  subscriptionStatus?: SubscriptionInfo["subscriptionStatus"];
  trialStartAt?: string | null;
  trialEndAt?: string | null;
  paidUntil?: string | null;

  mustChangePassword: boolean;
}

export type UserSession = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: "ROLE_ADMIN" | "ROLE_OWNER" | "ROLE_DRIVER";

  subscriptionStatus?: "TRIAL" | "ACTIVE" | "EXPIRED";
  trialStartAt?: string | null;
  trialEndAt?: string | null;
  paidUntil?: string | null;

  mustChangePassword: boolean;
};

export interface ChangePasswordResponse {
  message: string;
}

export interface CreateDriverByOwnerRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  licenseNumber: string;
  licenseExpiry?: string | null; // yyyy-MM-dd ou ISO
}