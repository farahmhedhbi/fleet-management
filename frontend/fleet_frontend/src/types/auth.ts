// src/types/auth.ts
import type { SubscriptionInfo } from "@/types/subscription";
export type RoleName = "ROLE_ADMIN" | "ROLE_OWNER" | "ROLE_DRIVER" | "ROLE_API_CLIENT";

export type RegisterRole = "ROLE_OWNER" | "ROLE_DRIVER"; // ✅ ADMIN interdit à l'inscription

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

  // ✅ uniquement DRIVER/OWNER
  role: RegisterRole;

  // ✅ obligatoire si DRIVER
  licenseNumber?: string;
}

export interface AuthResponse {
  token: string;
  type?: string; // backend peut renvoyer "Bearer"
  id: number;
  email: string;
  firstName: string;
  lastName: string;

  // ✅ peut être ADMIN après login
  role: "ROLE_ADMIN" | "ROLE_OWNER" | "ROLE_DRIVER";

   // ✅ optionnel si backend renvoie déjà
  subscriptionStatus?: SubscriptionInfo["subscriptionStatus"];
  trialStartAt?: string | null;
  trialEndAt?: string | null;
  paidUntil?: string | null;
}

export type UserSession = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: "ROLE_ADMIN" | "ROLE_OWNER" | "ROLE_DRIVER";
} & SubscriptionInfo;