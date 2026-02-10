"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/authContext";

export function AdminOnly({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return; // en attendant load auth
    if (user.role !== "ROLE_ADMIN") router.replace("/dashboard");
  }, [user, router]);

  if (!user) return null;
  if (user.role !== "ROLE_ADMIN") return null;

  return <>{children}</>;
}
