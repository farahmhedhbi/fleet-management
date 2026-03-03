// src/contexts/authContext.tsx
"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/lib/services/authService";
import { api } from "@/lib/api";
import { setAuthCookies, clearAuthCookies } from "@/lib/utils/cookies";
import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  UserSession,
} from "@/types/auth";

/** ✅ Export Role to use it elsewhere (ProtectedRoute, etc.) */
export type Role = UserSession["role"];

type AuthContextType = {
  user: UserSession | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;

  login: (
    payload: LoginRequest
  ) => Promise<{ success: boolean; message?: string }>;
  register: (
    payload: RegisterRequest
  ) => Promise<{ success: boolean; message?: string }>;
  logout: (redirectTo?: string) => void;

  hasAnyRole: (...roles: Role[]) => boolean;

  refreshMe: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);

  // ✅ Load session from localStorage
  useEffect(() => {
    try {
      const t = localStorage.getItem("token");
      const u = localStorage.getItem("user");

      setToken(t);
      setUser(u ? (JSON.parse(u) as UserSession) : null);
    } catch (e) {
      console.error("Failed to parse session:", e);
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = (redirectTo: string = "/login") => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      clearAuthCookies();
    } finally {
      setToken(null);
      setUser(null);
      router.push(redirectTo);
    }
  };

  const refreshMe = async () => {
    const t = localStorage.getItem("token");
    if (!t) {
      setToken(null);
      setUser(null);
      return;
    }

    try {
      // ✅ If your api instance already injects Authorization, this still works.
      const res = await api.get("/api/auth/me", {
        headers: { Authorization: `Bearer ${t}` },
      });

      const data = res.data;

      const session: UserSession = {
        id: data.id,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        role: data.role,

        subscriptionStatus: data.subscriptionStatus,
        trialStartAt: data.trialStartAt ?? null,
        trialEndAt: data.trialEndAt ?? null,
        paidUntil: data.paidUntil ?? null,
      };

      localStorage.setItem("user", JSON.stringify(session));
      setToken(t);
      setUser(session);
    } catch (e: any) {
      const status = e?.response?.status;

      // ✅ if invalid token => logout (401/403)
      if (status === 401 || status === 403) logout("/login");
      else console.error("refreshMe failed:", e);
    }
  };

  const login = async (payload: LoginRequest) => {
    try {
      const data: AuthResponse = await authService.login(payload);

      const session: UserSession = {
        id: data.id,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        role: data.role,

        subscriptionStatus: data.subscriptionStatus,
        trialStartAt: data.trialStartAt ?? null,
        trialEndAt: data.trialEndAt ?? null,
        paidUntil: data.paidUntil ?? null,
      };

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(session));
      setAuthCookies(data.token, data.role);

      setToken(data.token);
      setUser(session);

      // ✅ load real status from /me
      await refreshMe();

      router.push("/dashboard");
      return { success: true };
    } catch (e: any) {
      return {
        success: false,
        message: e?.response?.data?.message || "Login failed",
      };
    }
  };

  const register = async (payload: RegisterRequest) => {
    try {
      const data: AuthResponse = await authService.register(payload);

      const session: UserSession = {
        id: data.id,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        role: data.role,

        subscriptionStatus: data.subscriptionStatus,
        trialStartAt: data.trialStartAt ?? null,
        trialEndAt: data.trialEndAt ?? null,
        paidUntil: data.paidUntil ?? null,
      };

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(session));
      setAuthCookies(data.token, data.role);

      setToken(data.token);
      setUser(session);

      await refreshMe();

      router.push("/dashboard");
      return { success: true };
    } catch (e: any) {
      return {
        success: false,
        message: e?.response?.data?.message || "Registration failed",
      };
    }
  };

  const hasAnyRole = (...roles: Role[]) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: !!token && !!user,
      login,
      register,
      logout,
      hasAnyRole,
      refreshMe,
    }),
    [user, token, loading] // ✅ ok (functions are stable enough here)
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}