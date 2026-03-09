// src/contexts/authContext.tsx
"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/lib/services/authService";
import { setAuthCookies, clearAuthCookies } from "@/lib/utils/cookies";
import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  UserSession,
} from "@/types/auth";

export type Role = UserSession["role"];

type AuthContextType = {
  user: UserSession | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  mustChangePassword: boolean;

  login: (
    payload: LoginRequest
  ) => Promise<{ success: boolean; message?: string; mustChangePassword?: boolean }>;

  register: (
    payload: RegisterRequest
  ) => Promise<{ success: boolean; message?: string; mustChangePassword?: boolean }>;

  logout: (redirectTo?: string) => void;

  changePassword: (
    oldPassword: string,
    newPassword: string
  ) => Promise<{ success: boolean; message?: string }>;

  hasAnyRole: (...roles: Role[]) => boolean;
  refreshMe: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

function mapAuthResponseToSession(data: AuthResponse): UserSession {
  return {
    id: data.id,
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    role: data.role,
    subscriptionStatus: data.subscriptionStatus,
    trialStartAt: data.trialStartAt ?? null,
    trialEndAt: data.trialEndAt ?? null,
    paidUntil: data.paidUntil ?? null,
    mustChangePassword: data.mustChangePassword ?? false,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const t = localStorage.getItem("token");
      const u = localStorage.getItem("user");

      setToken(t);
      setUser(u ? (JSON.parse(u) as UserSession) : null);
    } catch (error) {
      console.error("Session restore failed:", error);
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = (redirectTo: string = "/login") => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    clearAuthCookies();

    setToken(null);
    setUser(null);
    router.push(redirectTo);
  };

  const refreshMe = async () => {
    const t = localStorage.getItem("token");
    if (!t) {
      setToken(null);
      setUser(null);
      return;
    }

    try {
      const data = await authService.me();
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
        mustChangePassword: data.mustChangePassword ?? false,
      };

      localStorage.setItem("user", JSON.stringify(session));
      setAuthCookies(t, session.role);

      setToken(t);
      setUser(session);
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 401 || status === 403) {
        logout("/login");
      } else {
        console.error("refreshMe failed:", error);
      }
    }
  };

  const login = async (payload: LoginRequest) => {
    try {
      const data = await authService.login(payload);
      const session = mapAuthResponseToSession(data);

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(session));
      setAuthCookies(data.token, data.role);

      setToken(data.token);
      setUser(session);

      await refreshMe();

      if (session.mustChangePassword) {
        router.push("/change-password");
      } else {
        router.push("/dashboard");
      }

      return { success: true, mustChangePassword: session.mustChangePassword };
    } catch (error: any) {
      return {
        success: false,
        message: error?.response?.data?.message || "Login failed",
      };
    }
  };

  const register = async (payload: RegisterRequest) => {
    try {
      const data = await authService.register(payload);
      const session = mapAuthResponseToSession(data);

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(session));
      setAuthCookies(data.token, data.role);

      setToken(data.token);
      setUser(session);

      await refreshMe();

      if (session.mustChangePassword) {
        router.push("/change-password");
      } else {
        router.push("/dashboard");
      }

      return { success: true, mustChangePassword: session.mustChangePassword };
    } catch (error: any) {
      return {
        success: false,
        message: error?.response?.data?.message || "Registration failed",
      };
    }
  };

  const changePassword = async (oldPassword: string, newPassword: string) => {
    try {
      const res = await authService.changePassword(oldPassword, newPassword);
      await refreshMe();
      return { success: true, message: res.message };
    } catch (error: any) {
      return {
        success: false,
        message: error?.response?.data?.message || "Password change failed",
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
      mustChangePassword: !!user?.mustChangePassword,
      login,
      register,
      logout,
      changePassword,
      hasAnyRole,
      refreshMe,
    }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}