// src/components/layout/ProtectedRoute.tsx
"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/authContext";
import { isSubscriptionActive } from "@/lib/subscription";

type Role = "ROLE_ADMIN" | "ROLE_OWNER" | "ROLE_DRIVER";

type Props = {
  children: React.ReactNode;
  requiredRoles?: Role[];
  requireOwnerActive?: boolean;
};

export function ProtectedRoute({
  children,
  requiredRoles,
  requireOwnerActive,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated || !user) {
      router.replace("/login");
      return;
    }

    if (user.mustChangePassword && pathname !== "/change-password") {
      router.replace("/change-password");
      return;
    }

    if (requiredRoles && !requiredRoles.includes(user.role)) {
      router.replace("/dashboard");
      return;
    }

    if (requireOwnerActive && user.role === "ROLE_OWNER") {
      if (!isSubscriptionActive(user)) {
        router.replace("/owner/billing");
      }
    }
  }, [loading, isAuthenticated, user, pathname, requiredRoles, requireOwnerActive, router]);

  if (loading) return <div className="p-6">Chargement...</div>;
  if (!user) return null;
  if (user.mustChangePassword && pathname !== "/change-password") return null;
  if (requiredRoles && !requiredRoles.includes(user.role)) return null;

  return <>{children}</>;
}