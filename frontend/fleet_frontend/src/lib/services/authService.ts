// src/lib/services/authService.ts
import { api } from "@/lib/api";

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
  role: "ROLE_ADMIN" | "ROLE_OWNER" | "ROLE_DRIVER";
}

export interface AuthResponse {
  token: string;
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: "ROLE_ADMIN" | "ROLE_OWNER" | "ROLE_DRIVER";
}

export const authService = {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const res = await api.post<AuthResponse>("/api/auth/login", credentials);
    return res.data;
  },

  async register(payload: RegisterRequest): Promise<AuthResponse> {
    const res = await api.post<AuthResponse>("/api/auth/register", payload);
    return res.data;
  },

  async me() {
    const res = await api.get("/api/auth/me");
    return res.data;
  },
};
