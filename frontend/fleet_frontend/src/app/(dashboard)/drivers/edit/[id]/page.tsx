// src/app/drivers/[id]/edit/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-toastify";
import DriverForm from "@/components/forms/DriverForm";
import { driverService } from "@/lib/services/driverService";
import type { DriverDTO } from "@/types/driver";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";

export default function EditDriverPage() {
  const params = useParams();
  const router = useRouter();
  const [driver, setDriver] = useState<(DriverDTO & { id?: number }) | null>(null);
  const [loading, setLoading] = useState(true);

  const id = Number(params?.id);

  useEffect(() => {
    async function loadDriver() {
      if (!id || Number.isNaN(id)) {
        toast.error("Identifiant conducteur invalide.");
        router.push("/drivers");
        return;
      }

      try {
        const data = await driverService.getById(id);
        setDriver(data);
      } catch (error: any) {
        toast.error(
          error?.response?.data?.message ||
            "Impossible de charger les informations du conducteur."
        );
        router.push("/drivers");
      } finally {
        setLoading(false);
      }
    }

    loadDriver();
  }, [id, router]);

  return (
    <ProtectedRoute requiredRoles={["ROLE_OWNER"]} requireOwnerActive>
      <div className="min-h-screen bg-slate-50 px-6 py-8">
        <div className="mx-auto max-w-7xl">
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <p className="text-sm font-medium text-slate-600">
                Chargement du conducteur...
              </p>
            </div>
          ) : driver ? (
            <DriverForm driver={driver} isEdit />
          ) : null}
        </div>
      </div>
    </ProtectedRoute>
  );
}