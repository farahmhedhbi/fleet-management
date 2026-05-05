"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { maintenanceService } from "@/lib/services/maintenanceService";
import type { MaintenanceDTO, MaintenanceStatus } from "@/types/maintenance";
import Link from "next/link";

export default function OwnerMaintenancesPage() {
  const [items, setItems] = useState<MaintenanceDTO[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      setLoading(true);
      const data = await maintenanceService.getAll();
      setItems(data);
    } catch {
      toast.error("Erreur lors du chargement des maintenances");
    } finally {
      setLoading(false);
    }
  }

  async function changeStatus(id: number, status: MaintenanceStatus) {
    try {
      await maintenanceService.updateStatus(id, status);
      toast.success("Statut mis à jour");
      await load();
    } catch {
      toast.error("Impossible de modifier le statut");
    }
  }

  async function cancel(id: number) {
    try {
      await maintenanceService.cancel(id);
      toast.success("Maintenance annulée");
      await load();
    } catch {
      toast.error("Impossible d'annuler la maintenance");
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <ProtectedRoute allowedRoles={["ROLE_OWNER", "ROLE_ADMIN"]}>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Gestion des maintenances</h1>
            <p className="text-gray-500">Suivi technique des véhicules</p>
          </div>

          <Link
            href="/owner/maintenances/new"
            className="rounded-lg bg-blue-600 px-4 py-2 text-white"
          >
            Ajouter maintenance
          </Link>
        </div>

        {loading ? (
          <p>Chargement...</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border bg-white">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 text-left">Véhicule</th>
                  <th className="p-3 text-left">Type</th>
                  <th className="p-3 text-left">Titre</th>
                  <th className="p-3 text-left">Statut</th>
                  <th className="p-3 text-left">Date prévue</th>
                  <th className="p-3 text-left">Coût</th>
                  <th className="p-3 text-left">Actions</th>
                </tr>
              </thead>

              <tbody>
                {items.map((m) => (
                  <tr key={m.id} className="border-t">
                    <td className="p-3">{m.vehicleRegistrationNumber}</td>
                    <td className="p-3">{m.type}</td>
                    <td className="p-3">{m.title}</td>
                    <td className="p-3">
                      <span className="rounded-full bg-gray-100 px-3 py-1">
                        {m.status}
                      </span>
                    </td>
                    <td className="p-3">
                      {m.plannedDate ? new Date(m.plannedDate).toLocaleString() : "-"}
                    </td>
                    <td className="p-3">{m.cost ?? "-"}</td>
                    <td className="p-3 space-x-2">
                      <Link
                        href={`/owner/maintenances/${m.id}`}
                        className="text-blue-600"
                      >
                        Détail
                      </Link>

                      {m.status !== "DONE" && m.status !== "CANCELED" && (
                        <>
                          <button
                            onClick={() => changeStatus(m.id, "DONE")}
                            className="text-green-600"
                          >
                            DONE
                          </button>

                          <button
                            onClick={() => cancel(m.id)}
                            className="text-red-600"
                          >
                            CANCEL
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}

                {items.length === 0 && (
                  <tr>
                    <td className="p-4 text-center text-gray-500" colSpan={7}>
                      Aucune maintenance trouvée
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}