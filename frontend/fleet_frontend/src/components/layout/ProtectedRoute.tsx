// src/components/layout/ProtectedRoute.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/authContext";
import { isSubscriptionActive } from "@/lib/subscription";

type Role = "ROLE_ADMIN" | "ROLE_OWNER" | "ROLE_DRIVER";

type Props = {
  children: React.ReactNode;
  requiredRoles?: Role[];
  requireOwnerActive?: boolean; // ✅ NEW
};

export function ProtectedRoute({ children, requiredRoles, requireOwnerActive }: Props) {
  const router = useRouter();
  const { user, loading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated || !user) {
      router.push("/login");
      return;
    }

    if (requiredRoles && !requiredRoles.includes(user.role)) {
      router.push("/dashboard");
      return;
    }

    if (requireOwnerActive && user.role === "ROLE_OWNER") {
      if (!isSubscriptionActive(user)) {
        router.push("/owner/billing");
        return;
      }
    }
  }, [loading, isAuthenticated, user, requiredRoles, requireOwnerActive, router]);

  if (loading) return <div className="p-6">Chargement...</div>;
  if (!user) return null;

  return <>{children}</>;

}

