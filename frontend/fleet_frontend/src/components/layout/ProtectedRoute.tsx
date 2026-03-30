"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/authContext";
import { isSubscriptionActive } from "@/lib/subscription";

type Role = "ROLE_ADMIN" | "ROLE_OWNER" | "ROLE_DRIVER";

type Props = {
  children: ReactNode;
  allowedRoles?: Role[];
  requiredRoles?: Role[];
  requireOwnerActive?: boolean;
};

export function ProtectedRoute({
  children,
  allowedRoles,
  requiredRoles,
  requireOwnerActive = false,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, isAuthenticated } = useAuth();

  const rolesToCheck = allowedRoles ?? requiredRoles;

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

    if (rolesToCheck && !rolesToCheck.includes(user.role as Role)) {
      router.replace("/dashboard");
      return;
    }

    if (requireOwnerActive && user.role === "ROLE_OWNER") {
      if (!isSubscriptionActive(user)) {
        router.replace("/owner/billing");
      }
    }
  }, [
    loading,
    isAuthenticated,
    user,
    pathname,
    rolesToCheck,
    requireOwnerActive,
    router,
  ]);

  if (loading) {
    return <div className="p-6">Chargement...</div>;
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  if (user.mustChangePassword && pathname !== "/change-password") {
    return null;
  }

  if (rolesToCheck && !rolesToCheck.includes(user.role as Role)) {
    return null;
  }

  if (requireOwnerActive && user.role === "ROLE_OWNER" && !isSubscriptionActive(user)) {
    return null;
  }

  return <>{children}</>;
}