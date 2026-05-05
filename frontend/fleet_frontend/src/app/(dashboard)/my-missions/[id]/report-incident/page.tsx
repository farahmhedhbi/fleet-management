"use client";

import { FormEvent, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-toastify";

import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { incidentService } from "@/lib/services/incidentService";
import type { IncidentSeverity, IncidentType } from "@/types/incident";

export default function DriverReportIncidentPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const missionId = Number(params.id);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<IncidentType>("ACCIDENT");
  const [severity, setSeverity] = useState<IncidentSeverity>("MEDIUM");
  const [emergency, setEmergency] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();

    if (!missionId || Number.isNaN(missionId)) {
      toast.error("Mission invalide");
      return;
    }

    if (!title.trim()) {
      toast.error("Le titre est obligatoire");
      return;
    }

    try {
      setLoading(true);

      await incidentService.create({
  title,
  description,
  type,
  severity,
  missionId: Number(missionId),
  emergency,
});

      toast.success("Incident déclaré avec succès");
      router.push("/driver/incidents");
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la déclaration de l'incident");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ProtectedRoute allowedRoles={["ROLE_DRIVER"]}>
      <div className="mx-auto max-w-2xl p-6">
        <div className="mb-6 rounded-2xl bg-gradient-to-r from-slate-950 to-red-900 p-6 text-white shadow">
          <h1 className="text-2xl font-bold">Déclarer un incident</h1>
          <p className="mt-2 text-sm text-white/80">
            Mission #{missionId} — l’owner sera notifié en temps réel.
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4 rounded-2xl border bg-white p-6 shadow-sm">
          <label className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
            <input
              type="checkbox"
              checked={emergency}
              onChange={(e) => setEmergency(e.target.checked)}
            />
            <div>
              <div className="font-semibold text-red-700">Mode urgence</div>
              <div className="text-sm text-red-600">
                Accident grave, véhicule bloqué ou danger immédiat.
              </div>
            </div>
          </label>

          <div>
            <label className="mb-1 block text-sm font-semibold">Type incident</label>
            <select
              className="w-full rounded-xl border p-3"
              value={type}
              onChange={(e) => setType(e.target.value as IncidentType)}
            >
              <option value="ACCIDENT">Accident</option>
              <option value="VEHICLE_BREAKDOWN">Panne véhicule</option>
              <option value="ROAD_ISSUE">Problème route</option>
              <option value="DANGER">Danger / agression</option>
              <option value="MISSION_PROBLEM">Problème mission</option>
              <option value="OTHER">Autre</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold">Gravité</label>
            <select
              className="w-full rounded-xl border p-3"
              value={severity}
              onChange={(e) => setSeverity(e.target.value as IncidentSeverity)}
            >
              <option value="LOW">Faible</option>
              <option value="MEDIUM">Moyenne</option>
              <option value="HIGH">Élevée</option>
              <option value="CRITICAL">Critique</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold">Titre</label>
            <input
              className="w-full rounded-xl border p-3"
              placeholder="Ex: Accident sur la route"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold">Description</label>
            <textarea
              className="min-h-32 w-full rounded-xl border p-3"
              placeholder="Décrivez ce qui s'est passé..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <button
            disabled={loading}
            className="w-full rounded-xl bg-red-600 p-3 font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? "Envoi..." : "Déclarer incident"}
          </button>
        </form>
      </div>
    </ProtectedRoute>
  );
}