"use client";

import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { maintenanceService } from "@/lib/services/maintenanceService";
import type { MaintenanceDTO } from "@/types/maintenance";
import { toast } from "react-toastify";

export default function UpcomingMaintenancesPage() {
  const [items, setItems] = useState<MaintenanceDTO[]>([]);

  useEffect(() => {
    maintenanceService
      .getUpcoming()
      .then(setItems)
      .catch(() => toast.error("Erreur chargement upcoming maintenances"));
  }, []);

  return (
    <ProtectedRoute allowedRoles={["ROLE_OWNER", "ROLE_ADMIN"]}>
      <div className="p-6">
        <h1 className="mb-6 text-2xl font-bold">Maintenances prochaines</h1>

        <div className="grid gap-4">
          {items.map((m) => (
            <div key={m.id} className="rounded-xl border bg-white p-4">
              <div className="flex justify-between">
                <div>
                  <h2 className="font-semibold">{m.title}</h2>
                  <p className="text-sm text-gray-500">
                    {m.vehicleRegistrationNumber} - {m.type}
                  </p>
                </div>
                <span className="rounded bg-yellow-100 px-3 py-1 text-sm">
                  {m.status}
                </span>
              </div>

              <p className="mt-3 text-sm">
                Date prévue:{" "}
                {m.plannedDate ? new Date(m.plannedDate).toLocaleString() : "-"}
              </p>
            </div>
          ))}

          {items.length === 0 && <p>Aucune maintenance prochaine.</p>}
        </div>
      </div>
    </ProtectedRoute>
  );
}