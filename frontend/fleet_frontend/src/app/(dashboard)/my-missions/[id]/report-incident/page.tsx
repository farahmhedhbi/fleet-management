"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-toastify";
import {
  AlertTriangle,
  Ambulance,
  ArrowLeft,
  Car,
  FileWarning,
  MapPin,
  Radio,
  Route,
  ShieldAlert,
  Wrench,
} from "lucide-react";

import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { incidentService } from "@/lib/services/incidentService";

type IncidentTypeOption =
  | "ACCIDENT"
  | "VEHICLE_BREAKDOWN"
  | "ROAD_ISSUE"
  | "DANGER"
  | "MISSION_PROBLEM"
  | "OTHER";

type SeverityOption = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export default function DriverReportIncidentPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const missionId = Number(params.id);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<IncidentTypeOption>("ACCIDENT");
  const [severity, setSeverity] = useState<SeverityOption>("MEDIUM");
  const [emergency, setEmergency] = useState(false);
  const [loading, setLoading] = useState(false);

  async function getCurrentPosition(): Promise<{
    latitude?: number;
    longitude?: number;
  }> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve({});
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        () => resolve({}),
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        }
      );
    });
  }

  async function submit() {
    if (!Number.isFinite(missionId) || missionId <= 0) {
      toast.error("Mission invalide");
      return;
    }

    if (!title.trim()) {
      toast.error("Titre obligatoire");
      return;
    }

    if (!description.trim()) {
      toast.error("Description obligatoire");
      return;
    }

    try {
      setLoading(true);

      const position = await getCurrentPosition();

      await incidentService.create({
        title: emergency ? `URGENCE - ${title.trim()}` : title.trim(),
        description: description.trim(),
        type,
        severity: emergency ? "CRITICAL" : severity,
        missionId,
        latitude: position.latitude,
        longitude: position.longitude,
        emergency,
      });

      toast.success("Incident déclaré avec succès");
      router.push("/my-missions");
    } catch (e: any) {
      console.error(e);
      toast.error(
        e?.response?.data?.message ||
          e?.response?.data?.error ||
          "Erreur lors de la déclaration"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <ProtectedRoute allowedRoles={["ROLE_DRIVER"]}>
      <div className="space-y-6 p-6 md:p-10">
        <div className="overflow-hidden rounded-3xl border border-red-100 bg-gradient-to-r from-slate-950 via-slate-900 to-red-950 p-6 text-white shadow-lg">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-red-500/20 p-3 ring-1 ring-red-300/30">
              <Radio className="h-7 w-7 text-red-300" />
            </div>

            <div>
              <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">
                Déclarer un incident
              </h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-300">
                Signalez un accident, une panne, un danger route ou un problème
                mission. L’owner sera notifié en temps réel.
              </p>

              <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold">
                <span className="rounded-full bg-white/10 px-3 py-1 text-slate-200 ring-1 ring-white/10">
                  Mission #{missionId}
                </span>
                <span className="rounded-full bg-red-500/20 px-3 py-1 text-red-200 ring-1 ring-red-300/20">
                  WebSocket live
                </span>
                <span className="rounded-full bg-white/10 px-3 py-1 text-slate-200 ring-1 ring-white/10">
                  Position GPS si autorisée
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="space-y-5">
            <label
              className={`flex cursor-pointer items-center gap-4 rounded-2xl border p-4 transition ${
                emergency
                  ? "border-red-300 bg-red-50 shadow-sm ring-2 ring-red-100"
                  : "border-red-100 bg-red-50/60 hover:bg-red-50"
              }`}
            >
              <input
                type="checkbox"
                checked={emergency}
                onChange={(e) => setEmergency(e.target.checked)}
                className="h-5 w-5 accent-red-600"
              />

              <div className="rounded-xl bg-red-100 p-2 text-red-700">
                <Ambulance className="h-5 w-5" />
              </div>

              <div>
                <p className="font-extrabold text-red-700">Mode urgence</p>
                <p className="text-sm text-red-600">
                  Accident grave, danger immédiat, véhicule bloqué ou besoin
                  d’intervention rapide.
                </p>
              </div>
            </label>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-extrabold text-slate-700">
                  <FileWarning className="h-4 w-4 text-red-500" />
                  Type incident
                </label>

                <option value="ACCIDENT">Accident</option>
                  <option value="VEHICLE_BREAKDOWN">Panne véhicule</option>
                  <option value="ROAD_ISSUE">Problème route</option>
                  <option value="DANGER">Danger / agression</option>
                  <option value="MISSION_PROBLEM">Problème mission</option>
                  <option value="OTHER">Autre</option>
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-extrabold text-slate-700">
                  <ShieldAlert className="h-4 w-4 text-orange-500" />
                  Gravité
                </label>

                <select
                  value={severity}
                  disabled={emergency}
                  onChange={(e) => setSeverity(e.target.value as SeverityOption)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-800 outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-500/10 disabled:bg-slate-100 disabled:text-slate-400"
                >
                  <option value="LOW">Faible</option>
                  <option value="MEDIUM">Moyenne</option>
                  <option value="HIGH">Haute</option>
                  <option value="CRITICAL">Critique</option>
                </select>

                {emergency ? (
                  <p className="mt-2 text-xs font-bold text-red-600">
                    En mode urgence, la gravité est automatiquement CRITICAL.
                  </p>
                ) : null}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <MiniInfo
                icon={<Car className="h-4 w-4" />}
                label="Flotte"
                value="Incident véhicule"
              />
              <MiniInfo
                icon={<Route className="h-4 w-4" />}
                label="Mission"
                value={`#${missionId}`}
              />
              <MiniInfo
                icon={<MapPin className="h-4 w-4" />}
                label="Position"
                value="Demandée à l’envoi"
              />
              <MiniInfo
                icon={<Wrench className="h-4 w-4" />}
                label="Traitement"
                value="Owner en live"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-extrabold text-slate-700">
                Titre
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Accident sur la route"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-red-400 focus:ring-2 focus:ring-red-500/10"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-extrabold text-slate-700">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Décrivez ce qui s'est passé, l’état du véhicule, les risques, la localisation visible..."
                rows={5}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-red-400 focus:ring-2 focus:ring-red-500/10"
              />
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-600" />
                <div>
                  <p className="font-extrabold text-amber-800">
                    Conseil de sécurité
                  </p>
                  <p className="mt-1 text-sm font-medium text-amber-700">
                    En cas d’accident grave, sécurisez-vous d’abord. Déclarez
                    l’incident seulement si vous pouvez utiliser l’application
                    sans danger.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-1">
              <button
                onClick={submit}
                disabled={loading}
                className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-extrabold text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
                  emergency
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-slate-950 hover:bg-slate-800"
                }`}
              >
                {emergency ? (
                  <Ambulance className="h-4 w-4" />
                ) : (
                  <AlertTriangle className="h-4 w-4" />
                )}
                {loading
                  ? "Envoi..."
                  : emergency
                  ? "Envoyer urgence"
                  : "Déclarer incident"}
              </button>

              <button
                onClick={() => router.back()}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                <ArrowLeft className="h-4 w-4" />
                Annuler
              </button>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

function MiniInfo({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-center gap-2 text-slate-500">
        {icon}
        <span className="text-xs font-extrabold">{label}</span>
      </div>
      <p className="mt-1 text-sm font-extrabold text-slate-800">{value}</p>
    </div>
  );
}