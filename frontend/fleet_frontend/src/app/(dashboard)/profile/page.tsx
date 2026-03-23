"use client";

import { useEffect, useMemo, useState } from "react";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { useAuth } from "@/contexts/authContext";
import { driverService } from "@/lib/services/driverService";

import ProfileView from "./ProfileView";

function roleLabel(role?: string) {
  return (role || "—").replace("ROLE_", "");
}

export default function ProfilePage() {
  const { user } = useAuth();

  const isDriver = useMemo(() => user?.role === "ROLE_DRIVER", [user?.role]);
  const [driverMe, setDriverMe] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        if (isDriver) {
          const d = await driverService.me();
          setDriverMe(d);
        }
      } catch {
        setDriverMe(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [isDriver]);

  const firstName = isDriver
    ? (driverMe?.firstName ?? user?.firstName)
    : user?.firstName;

  const lastName = isDriver
    ? (driverMe?.lastName ?? user?.lastName)
    : user?.lastName;

  const email = isDriver
    ? (driverMe?.email ?? user?.email)
    : user?.email;

  const phone = isDriver
    ? (driverMe?.phone ?? "—")
    : ((user as any)?.phone ?? "—");

  const role = user?.role;

  const licenseNumber = isDriver
    ? (driverMe?.licenseNumber ?? driverMe?.licenceNumber ?? "—")
    : undefined;

  return (
    <ProtectedRoute requiredRoles={["ROLE_ADMIN", "ROLE_OWNER", "ROLE_DRIVER"]}>
      <ProfileView
        user={user}
        loading={loading}
        isDriver={isDriver}
        firstName={firstName}
        lastName={lastName}
        email={email}
        phone={phone}
        role={role}
        licenseNumber={licenseNumber}
        roleLabel={roleLabel}
      />
    </ProtectedRoute>
  );
}