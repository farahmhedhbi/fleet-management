// src/lib/services/authService.ts
import { api } from "@/lib/api";
import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  MeResponse,
  ChangePasswordResponse,
} from "@/types/auth";

export const authService = {
  async login(payload: LoginRequest): Promise<AuthResponse> {
    const res = await api.post<AuthResponse>("/api/auth/login", payload);
    return res.data;
  },

  async register(payload: RegisterRequest): Promise<AuthResponse> {
    const res = await api.post<AuthResponse>("/api/auth/register", payload);
    return res.data;
  },

  async me(): Promise<MeResponse> {
    const res = await api.get<MeResponse>("/api/auth/me");
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

  async changePassword(
    oldPassword: string,
    newPassword: string
  ): Promise<ChangePasswordResponse> {
    const res = await api.post<ChangePasswordResponse>("/api/auth/change-password", {
      oldPassword,
      newPassword,
    });
    return res.data;
  },
};