"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { incidentService } from "@/lib/services/incidentService";
import type { IncidentSeverity, IncidentType } from "@/types/incident";

export default function ConfirmEventAsIncidentPage() {
  const router = useRouter();

  const [vehicleEventId, setVehicleEventId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<IncidentType>("GPS_ANOMALY");
  const [severity, setSeverity] = useState<IncidentSeverity>("HIGH");
  const [emergency, setEmergency] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();

    if (!vehicleEventId) {
      toast.error("VehicleEvent ID obligatoire");
      return;
    }

    try {
      await incidentService.fromEvent({
        vehicleEventId: Number(vehicleEventId),
        title,
        description,
        type,
        severity,
        emergency,
      });

      toast.success("Event confirmé comme incident");
      router.push("/owner/incidents");
    } catch {
      toast.error("Erreur confirmation incident");
    }
  }

  return (
    <ProtectedRoute allowedRoles={["ROLE_OWNER", "ROLE_ADMIN", "ROLE_DRIVER"]}>
      <div className="mx-auto max-w-2xl p-6">
        <h1 className="mb-6 text-2xl font-bold">Confirmer une alerte comme incident</h1>

        <form onSubmit={submit} className="space-y-4 rounded-xl border bg-white p-6">
          <input
            className="w-full rounded border p-3"
            placeholder="VehicleEvent ID"
            value={vehicleEventId}
            onChange={(e) => setVehicleEventId(e.target.value)}
          />

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

          <select
            className="w-full rounded border p-3"
            value={type}
            onChange={(e) => setType(e.target.value as IncidentType)}
          >
            <option value="GPS_ANOMALY">Anomalie GPS</option>
            <option value="OBD_ALERT">Alerte OBD</option>
            <option value="VEHICLE_BREAKDOWN">Panne véhicule</option>
            <option value="MISSION_PROBLEM">Problème mission</option>
            <option value="DRIVER_BEHAVIOR">Comportement conducteur</option>
            <option value="OTHER">Autre</option>
          </select>

          <select
            className="w-full rounded border p-3"
            value={severity}
            onChange={(e) => setSeverity(e.target.value as IncidentSeverity)}
          >
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
            <option value="CRITICAL">CRITICAL</option>
          </select>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={emergency}
              onChange={(e) => setEmergency(e.target.checked)}
            />
            Urgence
          </label>

          <button className="w-full rounded bg-blue-600 p-3 text-white">
            Confirmer comme incident
          </button>
        </form>
      </div>
    </ProtectedRoute>
  );
}