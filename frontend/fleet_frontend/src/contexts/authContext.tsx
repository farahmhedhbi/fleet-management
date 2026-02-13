"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { setAuthCookies, clearAuthCookies } from "@/lib/utils/cookies";
import { useRouter } from "next/navigation";
import { authService, LoginRequest, RegisterRequest, AuthResponse } from "@/lib/services/authService";

export type Role = "ROLE_ADMIN" | "ROLE_OWNER" | "ROLE_DRIVER";

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (payload: LoginRequest) => Promise<{ success: boolean; message?: string }>;
  register: (payload: RegisterRequest) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  hasAnyRole: (...roles: Role[]) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // load session from localStorage once
  useEffect(() => {
    try {
      const t = localStorage.getItem("token");
      const u = localStorage.getItem("user");

      setToken(t);
      setUser(u ? JSON.parse(u) : null);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");

  // ✅ AJOUTE CETTE LIGNE
  clearAuthCookies();

  setToken(null);
  setUser(null);
  router.push("/login");
};


  const login = async (payload: LoginRequest) => {
    try {
      const data: AuthResponse = await authService.login(payload);

      const u: User = {
        id: data.id,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        role: data.role,
      };

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(u));

      // ✅ AJOUTE CETTE LIGNE
      setAuthCookies(data.token, data.role);

      setToken(data.token);
      setUser(u);

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

      const u: User = {
        id: data.id,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        role: data.role,
      };

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(u));
      setAuthCookies(data.token, data.role);


      setToken(data.token);
      setUser(u);

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
    }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
