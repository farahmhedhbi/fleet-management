// src/lib/services/authService.ts
import { api } from "@/lib/api";
import type { LoginRequest, RegisterRequest, AuthResponse } from "@/types/auth";

export const authService = {
  async login(payload: LoginRequest): Promise<AuthResponse> {
    const res = await api.post<AuthResponse>("/api/auth/login", payload);
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

  async forgotPassword(email: string) {
    const res = await api.post("/api/auth/forgot-password", { email });
    return res.data;
  },

  async resetPassword(token: string, newPassword: string) {
    const res = await api.post("/api/auth/reset-password", { token, newPassword });
    return res.data;
  },

  async changePassword(oldPassword: string, newPassword: string) {
    const res = await api.post("/api/auth/change-password", { oldPassword, newPassword });
    return res.data;
  },
};