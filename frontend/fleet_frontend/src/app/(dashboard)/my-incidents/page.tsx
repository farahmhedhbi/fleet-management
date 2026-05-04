"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  AlertTriangle,
  Car,
  Clock,
  MapPin,
  RefreshCcw,
  Route,
} from "lucide-react";

import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { incidentService } from "@/lib/services/incidentService";
import type {
  IncidentDTO,
  IncidentSeverity,
  IncidentStatus,
} from "@/types/incident";

type StatusFilter = "ALL" | IncidentStatus;

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

function severityLabel(severity: IncidentSeverity) {
  switch (severity) {
    case "LOW":
      return "Faible";
    case "MEDIUM":
      return "Moyenne";
    case "HIGH":
      return "Haute";
    case "CRITICAL":
      return "Critique";
    default:
      return severity;
  }
}

function statusClass(status: IncidentStatus) {
  switch (status) {
    case "OPEN":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "IN_PROGRESS":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "RESOLVED":
      return "border-green-200 bg-green-50 text-green-700";
    case "CLOSED":
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

function severityClass(severity: IncidentSeverity) {
  switch (severity) {
    case "CRITICAL":
      return "border-red-200 bg-red-50 text-red-700";
    case "HIGH":
      return "border-orange-200 bg-orange-50 text-orange-700";
    case "MEDIUM":
      return "border-yellow-200 bg-yellow-50 text-yellow-700";
    case "LOW":
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

export default function MyIncidentsPage() {
  const [incidents, setIncidents] = useState<IncidentDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

  async function load(showSpinner = true) {
    try {
      if (showSpinner) setLoading(true);
      setRefreshing(true);

      const data = await incidentService.getMy();

      setIncidents(Array.isArray(data) ? data : []);
    } catch (e: any) {
      console.error(e);
      toast.error(
        e?.response?.data?.message ||
          e?.response?.data?.error ||
          "Erreur lors du chargement des incidents"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    load(true);
  }, []);

  const filtered = useMemo(() => {
    return incidents.filter((incident) => {
      if (statusFilter !== "ALL" && incident.status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [incidents, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: incidents.length,
      open: incidents.filter((i) => i.status === "OPEN").length,
      inProgress: incidents.filter((i) => i.status === "IN_PROGRESS").length,
      resolved: incidents.filter((i) => i.status === "RESOLVED").length,
      closed: incidents.filter((i) => i.status === "CLOSED").length,
    };
  }, [incidents]);

  return (
    <ProtectedRoute allowedRoles={["ROLE_DRIVER"]}>
      <div className="space-y-6 p-6 md:p-10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Mes incidents
            </h1>
            <p className="mt-1 text-slate-600">
              Suivez les incidents que vous avez déclarés ou confirmés pendant
              vos missions.
            </p>
          </div>

          <button
            onClick={() => load(false)}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <RefreshCcw
              className={refreshing ? "h-4 w-4 animate-spin" : "h-4 w-4"}
            />
            Actualiser
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <StatCard label="Total" value={stats.total} />
          <StatCard label="Ouverts" value={stats.open} danger={stats.open > 0} />
          <StatCard label="En traitement" value={stats.inProgress} />
          <StatCard label="Résolus" value={stats.resolved} />
          <StatCard label="Clôturés" value={stats.closed} />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="mb-2 text-sm font-bold text-slate-600">
            Filtrer par statut
          </p>

          <div className="flex flex-wrap gap-2">
            {(["ALL", "OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"] as StatusFilter[]).map(
              (status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`rounded-xl border px-3 py-2 text-xs font-bold transition ${
                    statusFilter === status
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {status === "ALL" ? "Tous" : statusLabel(status)}
                </button>
              )
            )}
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm font-semibold text-slate-500 shadow-sm">
            Chargement de vos incidents...
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
            <AlertTriangle className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-3 text-lg font-extrabold text-slate-800">
              Aucun incident trouvé
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Les incidents déclarés depuis vos missions apparaîtront ici.
            </p>

            <Link
              href="/my-missions"
              className="mt-5 inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800"
            >
              Voir mes missions
            </Link>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((incident) => (
              <div
                key={incident.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-900">
                      {incident.title}
                    </h2>
                    <p className="mt-1 line-clamp-3 text-sm text-slate-500">
                      {incident.description || "Aucune description."}
                    </p>
                  </div>

                  {incident.emergency ? (
                    <span className="rounded-full border border-red-200 bg-red-50 px-2 py-1 text-xs font-extrabold text-red-700">
                      Urgence
                    </span>
                  ) : null}
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge className={severityClass(incident.severity)}>
                    {severityLabel(incident.severity)}
                  </Badge>

                  <Badge className={statusClass(incident.status)}>
                    {statusLabel(incident.status)}
                  </Badge>

                  <Badge className="border-slate-200 bg-slate-50 text-slate-700">
                    {incident.type}
                  </Badge>
                </div>

                <div className="mt-4 space-y-2 text-sm text-slate-600">
                  <InfoLine
                    icon={<Car className="h-4 w-4" />}
                    text={
                      incident.vehicleRegistrationNumber
                        ? `${incident.vehicleRegistrationNumber} (#${incident.vehicleId})`
                        : incident.vehicleId
                        ? `Véhicule #${incident.vehicleId}`
                        : "Véhicule —"
                    }
                  />

                  <InfoLine
                    icon={<Route className="h-4 w-4" />}
                    text={
                      incident.missionTitle
                        ? `${incident.missionTitle} (#${incident.missionId})`
                        : incident.missionId
                        ? `Mission #${incident.missionId}`
                        : "Mission —"
                    }
                  />

                  <InfoLine
                    icon={<Clock className="h-4 w-4" />}
                    text={formatDate(incident.reportedAt || incident.createdAt)}
                  />

                  <InfoLine
                    icon={<MapPin className="h-4 w-4" />}
                    text={
                      incident.latitude != null && incident.longitude != null
                        ? `${incident.latitude.toFixed(5)}, ${incident.longitude.toFixed(5)}`
                        : "Position non disponible"
                    }
                  />
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <Link
                    href={`/incidents/${incident.id}`}
                    className="inline-flex flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
                  >
                    Détails
                  </Link>

                  {incident.missionId ? (
                    <Link
                      href={`/driver/missions/${incident.missionId}/map`}
                      className="inline-flex flex-1 items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800"
                    >
                      Carte mission
                    </Link>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

function StatCard({
  label,
  value,
  danger,
}: {
  label: string;
  value: number;
  danger?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-bold text-slate-500">{label}</p>
      <p
        className={`mt-2 text-3xl font-extrabold ${
          danger ? "text-red-600" : "text-slate-900"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function Badge({
  children,
  className,
}: {
  children: React.ReactNode;
  className: string;
}) {
  return (
    <span
      className={`rounded-full border px-2 py-1 text-xs font-bold ${className}`}
    >
      {children}
    </span>
  );
}

function InfoLine({
  icon,
  text,
}: {
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-slate-400">{icon}</span>
      <span className="font-medium">{text}</span>
    </div>
  );
}