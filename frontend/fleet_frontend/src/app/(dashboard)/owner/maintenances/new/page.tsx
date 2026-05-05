"use client";

import { FormEvent, useState } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { maintenanceService } from "@/lib/services/maintenanceService";
import type { MaintenanceStatus, MaintenanceType } from "@/types/maintenance";

export default function NewMaintenancePage() {
  const router = useRouter();

  const [vehicleId, setVehicleId] = useState("");
  const [type, setType] = useState<MaintenanceType>("OIL_CHANGE");
  const [status, setStatus] = useState<MaintenanceStatus>("PLANNED");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [plannedDate, setPlannedDate] = useState("");
  const [maintenanceDate, setMaintenanceDate] = useState("");
  const [mileage, setMileage] = useState("");
  const [cost, setCost] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();

    if (!vehicleId || !title) {
      toast.error("Véhicule et titre obligatoires");
      return;
    }

    try {
      setLoading(true);

      await maintenanceService.create({
        vehicleId: Number(vehicleId),
        type,
        status,
        title,
        description,
        plannedDate: plannedDate ? plannedDate : undefined,
        maintenanceDate: maintenanceDate ? maintenanceDate : undefined,
        mileage: mileage ? Number(mileage) : undefined,
        cost: cost ? Number(cost) : undefined,
      });

      toast.success("Maintenance créée");
      router.push("/owner/maintenances");
    } catch {
      toast.error("Erreur création maintenance");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ProtectedRoute allowedRoles={["ROLE_OWNER", "ROLE_ADMIN"]}>
      <div className="mx-auto max-w-2xl p-6">
        <h1 className="mb-6 text-2xl font-bold">Ajouter une maintenance</h1>

        <form onSubmit={submit} className="space-y-4 rounded-xl border bg-white p-6">
          <input
            className="w-full rounded border p-3"
            placeholder="Vehicle ID"
            value={vehicleId}
            onChange={(e) => setVehicleId(e.target.value)}
          />

          <select
            className="w-full rounded border p-3"
            value={type}
            onChange={(e) => setType(e.target.value as MaintenanceType)}
          >
            <option value="OIL_CHANGE">Vidange</option>
            <option value="ENGINE_CHECK">Contrôle moteur</option>
            <option value="BRAKE_CHECK">Contrôle freins</option>
            <option value="BATTERY_CHECK">Batterie</option>
            <option value="TIRE_CHANGE">Pneus</option>
            <option value="TECHNICAL_INSPECTION">Visite technique</option>
            <option value="REPAIR">Réparation</option>
            <option value="OTHER">Autre</option>
          </select>

          <select
            className="w-full rounded border p-3"
            value={status}
            onChange={(e) => setStatus(e.target.value as MaintenanceStatus)}
          >
            <option value="PLANNED">Planifiée</option>
            <option value="DONE">Effectuée</option>
          </select>

          <input
            className="w-full rounded border p-3"
            placeholder="Titre"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <textarea
            className="w-full rounded border p-3"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <label className="block text-sm text-gray-600">Date prévue</label>
          <input
            type="datetime-local"
            className="w-full rounded border p-3"
            value={plannedDate}
            onChange={(e) => setPlannedDate(e.target.value)}
          />

          <label className="block text-sm text-gray-600">Date maintenance</label>
          <input
            type="datetime-local"
            className="w-full rounded border p-3"
            value={maintenanceDate}
            onChange={(e) => setMaintenanceDate(e.target.value)}
          />

          <input
            className="w-full rounded border p-3"
            placeholder="Kilométrage"
            value={mileage}
            onChange={(e) => setMileage(e.target.value)}
          />

          <input
            className="w-full rounded border p-3"
            placeholder="Coût"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
          />

          <button
            disabled={loading}
            className="w-full rounded bg-blue-600 p-3 text-white disabled:opacity-50"
          >
            {loading ? "Création..." : "Créer"}
          </button>
        </form>
      </div>
    </ProtectedRoute>
  );
}