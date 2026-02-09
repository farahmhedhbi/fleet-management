"use client";

import React, { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useAuth } from "@/contexts/authContext";

type Role = "ROLE_ADMIN" | "ROLE_OWNER" | "ROLE_DRIVER";

export function ProtectedRoute({
  children,
  requiredRoles,
  redirectTo = "/login",
}: {
  children: ReactNode;
  requiredRoles?: Role[];
  redirectTo?: string;
}) {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push(redirectTo);
      return;
    }

    if (requiredRoles && user?.role) {
      const ok = requiredRoles.includes(user.role as Role);
      if (!ok) router.push("/dashboard"); // connecté mais pas autorisé
    }
  }, [isAuthenticated, requiredRoles, user?.role, router, redirectTo]);

  if (!isAuthenticated) return <LoadingSpinner />;

  if (requiredRoles && user?.role) {
    const ok = requiredRoles.includes(user.role as Role);
    if (!ok) return null;
  }

  return <>{children}</>;
}
