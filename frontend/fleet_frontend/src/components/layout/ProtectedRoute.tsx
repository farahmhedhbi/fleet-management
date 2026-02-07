"use client";

import React, { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useAuth } from "@/contexts/authContext";

type Role = "ROLE_ADMIN" | "ROLE_OWNER" | "ROLE_DRIVER";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: Role[]; // ✅ plusieurs rôles
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRoles,
  redirectTo = "/login",
}) => {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push(redirectTo);
      return;
    }

    if (!loading && isAuthenticated && requiredRoles && user?.role) {
      const ok = requiredRoles.includes(user.role as Role);
      if (!ok) router.push("/dashboard");
    }
  }, [loading, isAuthenticated, requiredRoles, user?.role, router, redirectTo]);

  if (loading) return <LoadingSpinner />;
  if (!isAuthenticated) return null;

  if (requiredRoles && user?.role) {
    const ok = requiredRoles.includes(user.role as Role);
    if (!ok) return null;
  }

  return <>{children}</>;
};
