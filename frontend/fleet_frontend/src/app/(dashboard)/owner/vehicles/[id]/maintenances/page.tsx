"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { maintenanceService } from "@/lib/services/maintenanceService";
import type { MaintenanceDTO } from "@/types/maintenance";
import { toast } from "react-toastify";

export default function VehicleMaintenanceHistoryPage() {
  const params = useParams<{ id: string }>();
  const vehicleId = Number(params.id);

  const [items, setItems] = useState<MaintenanceDTO[]>([]);

  useEffect(() => {
    if (!vehicleId) return;

    maintenanceService
      .getByVehicle(vehicleId)
      .then(setItems)
      .catch(() => toast.error("Erreur chargement historique maintenance"));
  }, [vehicleId]);

  return (
    <ProtectedRoute allowedRoles={["ROLE_OWNER", "ROLE_ADMIN"]}>
      <div className="p-6">
        <h1 className="mb-6 text-2xl font-bold">
          Historique maintenance véhicule #{vehicleId}
        </h1>

        <div className="space-y-4">
          {items.map((m) => (
            <div key={m.id} className="rounded-xl border bg-white p-4">
              <div className="flex justify-between">
                <h2 className="font-semibold">{m.title}</h2>
                <span>{m.status}</span>
              </div>

              <p className="text-sm text-gray-500">{m.type}</p>
              <p className="mt-2">{m.description}</p>

              <div className="mt-3 text-sm text-gray-600">
                <p>Date prévue: {m.plannedDate ?? "-"}</p>
                <p>Date effectuée: {m.maintenanceDate ?? "-"}</p>
                <p>Coût: {m.cost ?? "-"}</p>
              </div>
            </div>
          ))}

          {items.length === 0 && <p>Aucun historique maintenance.</p>}
        </div>
      </div>
    </ProtectedRoute>
  );
}