"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Wrench } from "lucide-react";
import { toast } from "react-toastify";

import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { maintenanceService } from "@/lib/services/maintenanceService";
import type { MaintenanceDTO } from "@/types/maintenance";

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("fr-FR");
}

export default function VehicleMaintenanceHistoryPage() {
  const params = useParams();
  const vehicleId = Number(params?.id);
  const isValidId = Number.isFinite(vehicleId) && vehicleId > 0;

  const [items, setItems] = useState<MaintenanceDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isValidId) {
      setLoading(false);
      return;
    }

    maintenanceService
      .getByVehicle(vehicleId)
      .then(setItems)
      .catch(() => toast.error("Erreur chargement historique maintenance"))
      .finally(() => setLoading(false));
  }, [vehicleId, isValidId]);

  return (
    <ProtectedRoute allowedRoles={["ROLE_OWNER", "ROLE_ADMIN"]}>
      <div className="min-h-screen bg-slate-50 px-4 py-6 md:px-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <Link
            href="/owner/vehicles"
            className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:underline"
          >
            <ArrowLeft size={16} />
            Retour véhicules
          </Link>

          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <h1 className="text-2xl font-black text-slate-900">
              Historique maintenance véhicule #{vehicleId}
            </h1>
          </div>

          {loading ? (
            <div className="rounded-3xl border bg-white p-8 shadow-sm">
              <div className="flex items-center gap-3">
                <Loader2 className="animate-spin" />
                Chargement...
              </div>
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-3xl border bg-white p-10 text-center shadow-sm">
              Aucun historique maintenance.
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((m) => (
                <div key={m.id} className="rounded-3xl border bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50">
                        <Wrench className="text-blue-600" />
                      </div>

                      <div>
                        <h2 className="font-black text-slate-900">{m.title}</h2>
                        <p className="text-sm text-slate-500">
                          {m.type} • {m.priority} • {m.status}
                        </p>
                        <p className="mt-2 text-sm text-slate-600">
                          {formatDate(m.plannedDate)} →{" "}
                          {formatDate(m.maintenanceDate)}
                        </p>
                        {m.workOrderId && (
                          <p className="mt-1 text-sm text-blue-600">
                            WorkOrder #{m.workOrderId}
                          </p>
                        )}
                      </div>
                    </div>

                    <Link
                      href={`/owner/maintenances/${m.id}`}
                      className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white"
                    >
                      Détail
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}