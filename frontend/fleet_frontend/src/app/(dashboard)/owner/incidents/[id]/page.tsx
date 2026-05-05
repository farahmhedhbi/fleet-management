"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { incidentService } from "@/lib/services/incidentService";
import type { IncidentDTO, IncidentStatus } from "@/types/incident";
import { toast } from "react-toastify";

export default function IncidentDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);

  const [incident, setIncident] = useState<IncidentDTO | null>(null);

  async function load() {
    try {
      setIncident(await incidentService.getById(id));
    } catch {
      toast.error("Incident introuvable");
    }
  }

  async function update(status: IncidentStatus) {
    try {
      await incidentService.updateStatus(id, status);
      toast.success("Statut modifié");
      await load();
    } catch {
      toast.error("Erreur modification statut");
    }
  }

  useEffect(() => {
    if (id) load();
  }, [id]);

  return (
    <ProtectedRoute allowedRoles={["ROLE_OWNER", "ROLE_ADMIN"]}>
      <div className="p-6">
        {!incident ? (
          <p>Chargement...</p>
        ) : (
          <div className="rounded-xl border bg-white p-6 space-y-4">
            <div className="flex justify-between">
              <div>
                <h1 className="text-2xl font-bold">{incident.title}</h1>
                <p className="text-gray-500">{incident.type}</p>
              </div>

              <span className="rounded bg-gray-100 px-3 py-1">
                {incident.status}
              </span>
            </div>

            <p>{incident.description}</p>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <p>Véhicule: {incident.vehicleRegistrationNumber ?? "-"}</p>
              <p>Mission: {incident.missionTitle ?? "-"}</p>
              <p>Severity: {incident.severity}</p>
              <p>Source: {incident.source}</p>
              <p>Latitude: {incident.latitude ?? "-"}</p>
              <p>Longitude: {incident.longitude ?? "-"}</p>
              <p>Reported by: {incident.reportedByEmail ?? "-"}</p>
              <p>Handled by: {incident.handledByEmail ?? "-"}</p>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => update("IN_PROGRESS")}
                className="rounded bg-orange-500 px-4 py-2 text-white"
              >
                IN_PROGRESS
              </button>

              <button
                onClick={() => update("RESOLVED")}
                className="rounded bg-green-600 px-4 py-2 text-white"
              >
                RESOLVED
              </button>

              <button
                onClick={() => update("CLOSED")}
                className="rounded bg-gray-700 px-4 py-2 text-white"
              >
                CLOSED
              </button>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}