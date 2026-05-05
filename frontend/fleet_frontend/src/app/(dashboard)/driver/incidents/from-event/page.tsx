"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { AlertTriangle, ArrowLeft, CheckCircle2, RadioTower } from "lucide-react";

import { incidentService } from "@/lib/services/incidentService";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import type { IncidentSeverity, IncidentType } from "@/types/incident";

export default function DriverFromEventPage() {
  const router = useRouter();

  const [eventId, setEventId] = useState("");
  const [type, setType] = useState<IncidentType>("GPS_ANOMALY");
  const [severity, setSeverity] = useState<IncidentSeverity>("HIGH");
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();

    const parsedEventId = Number(eventId);

    if (!eventId || Number.isNaN(parsedEventId) || parsedEventId <= 0) {
      toast.error("Event ID obligatoire et valide");
      return;
    }

    try {
      setLoading(true);

      await incidentService.fromEvent({
        vehicleEventId: parsedEventId,
        type,
        severity,
      });

      toast.success("Event confirmé comme incident");
      router.push("/driver/incidents");
    } catch {
      toast.error("Erreur confirmation incident");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ProtectedRoute allowedRoles={["ROLE_DRIVER"]}>
      <div className="min-h-screen bg-slate-50 px-4 py-6 md:px-8">
        <div className="mx-auto max-w-3xl space-y-6">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-100"
          >
            <ArrowLeft size={18} />
            Retour
          </button>

          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="bg-gradient-to-r from-red-600 to-orange-500 p-6 text-white">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-sm font-medium">
                <RadioTower size={16} />
                Confirmation d’alerte
              </div>

              <h1 className="text-2xl font-bold md:text-3xl">
                Confirmer une alerte comme incident
              </h1>

              <p className="mt-2 text-sm text-white/90">
                Cette page permet au driver de transformer une alerte GPS/OBD en
                incident réel.
              </p>
            </div>

            <form onSubmit={submit} className="space-y-5 p-6">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  VehicleEvent ID
                </label>

                <input
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-red-500 focus:bg-white focus:ring-4 focus:ring-red-100"
                  placeholder="Exemple : 12"
                  value={eventId}
                  onChange={(e) => setEventId(e.target.value)}
                />

                <p className="mt-2 text-xs text-slate-400">
                  ID de l’alerte détectée automatiquement par GPS ou OBD.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Type d’incident
                </label>

                <select
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-red-500 focus:bg-white focus:ring-4 focus:ring-red-100"
                  value={type}
                  onChange={(e) => setType(e.target.value as IncidentType)}
                >
                  <option value="GPS_ANOMALY">Anomalie GPS</option>
                  <option value="OBD_ALERT">Alerte OBD</option>
                  <option value="VEHICLE_BREAKDOWN">Panne véhicule</option>
                  <option value="MISSION_PROBLEM">Problème mission</option>
                  <option value="ROAD_ISSUE">Problème de route</option>
                  <option value="ACCIDENT">Accident</option>
                  <option value="OTHER">Autre</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Gravité
                </label>

                <select
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-red-500 focus:bg-white focus:ring-4 focus:ring-red-100"
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as IncidentSeverity)}
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="CRITICAL">CRITICAL</option>
                </select>
              </div>

              <div className="rounded-2xl border border-orange-100 bg-orange-50 p-4">
                <div className="flex gap-3">
                  <AlertTriangle className="mt-0.5 text-orange-600" size={20} />
                  <div>
                    <p className="font-semibold text-orange-800">
                      Vérification importante
                    </p>
                    <p className="mt-1 text-sm text-orange-700">
                      Confirme seulement les alertes qui représentent un vrai
                      problème terrain.
                    </p>
                  </div>
                </div>
              </div>

              <button
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 font-bold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <CheckCircle2 size={20} />
                {loading ? "Confirmation..." : "Confirmer comme incident"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}