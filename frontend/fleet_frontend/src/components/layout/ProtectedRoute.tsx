// src/components/layout/ProtectedRoute.tsx
"use client";

import React, { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useAuth, Role } from "@/contexts/authContext";

export function ProtectedRoute({
  children,
  requiredRoles,
  redirectTo = "/login",
  fallback = <LoadingSpinner />,
}: {
  children: ReactNode;
  requiredRoles?: Role[];
  redirectTo?: string;
  fallback?: ReactNode;
}) {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    // ✅ not logged in
    if (!isAuthenticated) {
      router.replace(redirectTo);
      return;
    }

    // ✅ logged in but user not yet ready (rare, but possible)
    if (!user) return;

    // ✅ role check
    if (requiredRoles?.length) {
      const ok = requiredRoles.includes(user.role);
      if (!ok) router.replace("/dashboard");
    }
  }, [loading, isAuthenticated, user, requiredRoles, router, redirectTo]);

  // UI states
  if (loading) return <>{fallback}</>;

  if (!isAuthenticated) return null;

  // If authenticated but user not loaded yet => show fallback (avoid blank)
  if (!user) return <>{fallback}</>;

  if (requiredRoles?.length) {
    const ok = requiredRoles.includes(user.role);
    if (!ok) return null;
  }

  return <>{children}</>;

}

