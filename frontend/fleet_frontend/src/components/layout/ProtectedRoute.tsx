"use client";

import React, { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useAuth, Role } from "@/contexts/authContext";

export function ProtectedRoute({
  children,
  requiredRoles,
  redirectTo = "/login",
}: {
  children: ReactNode;
  requiredRoles?: Role[];
  redirectTo?: string;
}) {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated) {
      router.push(redirectTo);
      return;
    }

    if (requiredRoles && user?.role) {
      const ok = requiredRoles.includes(user.role);
      if (!ok) router.push("/dashboard");
    }
  }, [loading, isAuthenticated, requiredRoles, user?.role, router, redirectTo]);

  if (loading) return <LoadingSpinner />;
  if (!isAuthenticated) return null;

  if (requiredRoles && user?.role) {
    const ok = requiredRoles.includes(user.role);
    if (!ok) return null;
  }

  return <>{children}</>;
}
