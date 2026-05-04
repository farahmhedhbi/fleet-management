"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  AlertTriangle,
  Car,
  MapPin,
  Route,
  User,
  Clock,
  ShieldAlert,
} from "lucide-react";

import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { incidentService } from "@/lib/services/incidentService";
import type { IncidentDTO, IncidentStatus } from "@/types/incident";

function formatDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

function statusLabel(status: IncidentStatus) {
  switch (status) {
    case "OPEN":
      return "Ouvert";
    case "IN_PROGRESS":
      return "En traitement";
    case "RESOLVED":
      return "Résolu";
    case "CLOSED":
      return "Clôturé";
    default:
      return status;
  }
}

function canMoveTo(status: IncidentStatus, target: IncidentStatus) {
  if (status === target) return false;
  if (status === "CLOSED") return false;

  if (target === "IN_PROGRESS") {
    return status === "OPEN" || status === "RESOLVED";
  }

  if (target === "RESOLVED") {
    return status === "OPEN" || status === "IN_PROGRESS";
  }

  if (target === "CLOSED") {
    return status === "OPEN" || status === "IN_PROGRESS" || status === "RESOLVED";
  }

  return false;
}

export default function IncidentDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const id = Number(params.id);

  const [incident, setIncident] = useState<IncidentDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  async function load() {
    if (!Number.isFinite(id) || id <= 0) {
      toast.error("Incident invalide");
      router.push("/incidents");
      return;
    }

    try {
      setLoading(true);
      const data = await incidentService.getById(id);
      setIncident(data);
    } catch (e: any) {
      console.error(e);
      toast.error(
        e?.response?.data?.message ||
          e?.response?.data?.error ||
          "Erreur lors du chargement"
      );
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(status: IncidentStatus) {
    if (!incident) return;

    try {
      setUpdating(true);
      const updated = await incidentService.updateStatus(incident.id, status);
      setIncident(updated);
      toast.success("Statut mis à jour");
    } catch (e: any) {
      console.error(e);
      toast.error(
        e?.response?.data?.message ||
          e?.response?.data?.error ||
          "Erreur lors de la mise à jour"
      );
    } finally {
      setUpdating(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <ProtectedRoute allowedRoles={["ROLE_OWNER", "ROLE_ADMIN"]}>
      <div className="space-y-6 p-6 md:p-10">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </button>

        {loading ? (
          <div className="rounded-2xl border bg-white p-8 text-slate-500">
            Chargement...
          </div>
        ) : !incident ? (
          <div className="rounded-2xl border bg-white p-8 text-slate-500">
            Incident introuvable.
          </div>
        ) : (
          <>
            <div className="rounded-3xl border border-red-100 bg-gradient-to-r from-slate-950 via-slate-900 to-red-950 p-6 text-white shadow-lg">
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-red-500/20 p-3">
                  <AlertTriangle className="h-7 w-7 text-red-300" />
                </div>

                <div>
                  <h1 className="text-2xl font-extrabold md:text-3xl">
                    {incident.title}
                  </h1>

                  <p className="mt-2 text-sm text-slate-300">
                    {incident.description || "Aucune description."}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold">
                    <span className="rounded-full bg-white/10 px-3 py-1">
                      {incident.type}
                    </span>
                    <span className="rounded-full bg-red-500/20 px-3 py-1 text-red-200">
                      {incident.severity}
                    </span>
                    <span className="rounded-full bg-white/10 px-3 py-1">
                      {statusLabel(incident.status)}
                    </span>
                    <span className="rounded-full bg-white/10 px-3 py-1">
                      Source: {incident.source}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <InfoCard
                icon={<Car className="h-5 w-5" />}
                label="Véhicule"
                value={
                  incident.vehicleRegistrationNumber
                    ? `${incident.vehicleRegistrationNumber} (#${incident.vehicleId})`
                    : incident.vehicleId
                    ? `#${incident.vehicleId}`
                    : "—"
                }
              />

              <InfoCard
                icon={<Route className="h-5 w-5" />}
                label="Mission"
                value={
                  incident.missionTitle
                    ? `${incident.missionTitle} (#${incident.missionId})`
                    : incident.missionId
                    ? `#${incident.missionId}`
                    : "—"
                }
              />

              <InfoCard
                icon={<User className="h-5 w-5" />}
                label="Déclaré par"
                value={incident.reportedByEmail || incident.source || "—"}
              />

              <InfoCard
                icon={<Clock className="h-5 w-5" />}
                label="Date déclaration"
                value={formatDate(incident.reportedAt || incident.createdAt)}
              />

              <InfoCard
                icon={<ShieldAlert className="h-5 w-5" />}
                label="Traité par"
                value={incident.handledByEmail || "—"}
              />

              <InfoCard
                icon={<Clock className="h-5 w-5" />}
                label="Dernière MAJ"
                value={formatDate(incident.updatedAt)}
              />

              <InfoCard
                icon={<MapPin className="h-5 w-5" />}
                label="Position"
                value={
                  incident.latitude != null && incident.longitude != null
                    ? `${incident.latitude.toFixed(5)}, ${incident.longitude.toFixed(5)}`
                    : "—"
                }
              />

              <InfoCard
                icon={<AlertTriangle className="h-5 w-5" />}
                label="Event lié"
                value={
  incident.vehicleEventId
    ? `Event #${incident.vehicleEventId}`
    : "—"
}
              />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-extrabold text-slate-900">
                Traitement
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Cycle officiel : OPEN → IN_PROGRESS → RESOLVED → CLOSED
              </p>

              <div className="mt-4 flex flex-wrap gap-3">
                {canMoveTo(incident.status, "IN_PROGRESS") && (
                  <button
                    disabled={updating}
                    onClick={() => updateStatus("IN_PROGRESS")}
                    className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-50"
                  >
                    Marquer en traitement
                  </button>
                )}

                {canMoveTo(incident.status, "RESOLVED") && (
                  <button
                    disabled={updating}
                    onClick={() => updateStatus("RESOLVED")}
                    className="rounded-xl bg-green-600 px-4 py-2 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    Résoudre
                  </button>
                )}

                {canMoveTo(incident.status, "CLOSED") && (
                  <button
                    disabled={updating}
                    onClick={() => updateStatus("CLOSED")}
                    className="rounded-xl bg-slate-500 px-4 py-2 text-sm font-bold text-white hover:bg-slate-600 disabled:opacity-50"
                  >
                    Clôturer
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </ProtectedRoute>
  );
}

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 text-slate-500">
        {icon}
        <span className="text-sm font-extrabold">{label}</span>
      </div>
      <p className="mt-2 break-words text-sm font-bold text-slate-800">
        {value}
      </p>
    </div>
  );
}