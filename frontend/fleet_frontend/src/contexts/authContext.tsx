"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { authService, LoginRequest, RegisterRequest, AuthResponse } from "@/lib/services/authService";

type Role = "ROLE_ADMIN" | "ROLE_OWNER" | "ROLE_DRIVER";

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
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

  useEffect(() => {
    const t = localStorage.getItem("token");
    const u = localStorage.getItem("user");
    setToken(t);
    setUser(u ? JSON.parse(u) : null);
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    router.push("/login");
  };

  const login = async (payload: LoginRequest) => {
    try {
      const data: AuthResponse = await authService.login(payload);
      localStorage.setItem("token", data.token);

      const u: User = {
        id: data.id,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        role: data.role,
      };
      localStorage.setItem("user", JSON.stringify(u));
      setToken(data.token);
      setUser(u);

      router.push("/dashboard");
      return { success: true };
    } catch (e: any) {
      return { success: false, message: e?.response?.data?.message || "Login failed" };
    }
  };

  const register = async (payload: RegisterRequest) => {
    try {
      const data: AuthResponse = await authService.register(payload);
      localStorage.setItem("token", data.token);

      const u: User = {
        id: data.id,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        role: data.role,
      };
      localStorage.setItem("user", JSON.stringify(u));
      setToken(data.token);
      setUser(u);

      router.push("/dashboard");
      return { success: true };
    } catch (e: any) {
      return { success: false, message: e?.response?.data?.message || "Registration failed" };
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
      isAuthenticated: !!token && !!user,
      login,
      register,
      logout,
      hasAnyRole,
    }),
    [user, token]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
