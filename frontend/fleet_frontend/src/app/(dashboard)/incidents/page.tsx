"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";

import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { incidentService } from "@/lib/services/incidentService";
import {
  subscribeIncidentsLive,
  unsubscribeIncidentsLive,
} from "@/lib/websocket";

import type {
  IncidentDTO,
  IncidentSeverity,
  IncidentStatus,
} from "@/types/incident";

type StatusFilter = "ALL" | IncidentStatus;
type SeverityFilter = "ALL" | IncidentSeverity;

function formatDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

function incidentKey(incident: IncidentDTO) {
  return String(incident.id);
}

function severityClass(severity: string) {
  switch (severity) {
    case "CRITICAL":
      return "bg-red-100 text-red-700 border-red-200";
    case "HIGH":
      return "bg-orange-100 text-orange-700 border-orange-200";
    case "MEDIUM":
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

function statusClass(status: string) {
  switch (status) {
    case "REPORTED":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "VALIDATED":
      return "bg-purple-100 text-purple-700 border-purple-200";
    case "IN_PROGRESS":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "RESOLVED":
      return "bg-green-100 text-green-700 border-green-200";
    case "REJECTED":
      return "bg-slate-100 text-slate-700 border-slate-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

function canMoveTo(status: string, target: IncidentStatus) {
  if (status === target) return false;
  if (status === "RESOLVED" || status === "REJECTED") return false;

  if (target === "VALIDATED") return status === "REPORTED";
  if (target === "IN_PROGRESS") return status === "REPORTED" || status === "VALIDATED";
  if (target === "RESOLVED") return status === "REPORTED" || status === "VALIDATED" || status === "IN_PROGRESS";
  if (target === "REJECTED") return status === "REPORTED" || status === "VALIDATED";

  return false;
}

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<IncidentDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("ALL");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const receivedRef = useRef<Set<string>>(new Set());

  async function load() {
    try {
      const data = await incidentService.getAll();
      setIncidents(data);
      receivedRef.current = new Set(data.map((i) => incidentKey(i)));
    } catch (e) {
      console.error(e);
      toast.error("Erreur lors du chargement des incidents");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    subscribeIncidentsLive<IncidentDTO>((incident) => {
      if (!incident || !incident.id) return;

      const key = incidentKey(incident);
      const alreadyKnown = receivedRef.current.has(key);

      receivedRef.current.add(key);

      setIncidents((prev) => {
        const exists = prev.some((i) => i.id === incident.id);

        if (exists) {
          return prev.map((i) => (i.id === incident.id ? incident : i));
        }

        return [incident, ...prev].slice(0, 100);
      });

      if (!alreadyKnown && incident.status === "REPORTED") {
        const isCritical =
          incident.severity === "CRITICAL" || incident.severity === "HIGH";

        if (isCritical) {
          toast.error(incident.title || "Nouvel incident critique", {
            toastId: `incident-${incident.id}`,
          });
        } else {
          toast.warning(incident.title || "Nouvel incident", {
            toastId: `incident-${incident.id}`,
          });
        }
      }
    });

    return () => {
      unsubscribeIncidentsLive();
    };
  }, []);

  const filtered = useMemo(() => {
    return incidents.filter((incident) => {
      const statusOk =
        statusFilter === "ALL" || incident.status === statusFilter;

      const severityOk =
        severityFilter === "ALL" || incident.severity === severityFilter;

      return statusOk && severityOk;
    });
  }, [incidents, statusFilter, severityFilter]);

  const stats = useMemo(() => {
    return {
      total: incidents.length,
      reported: incidents.filter((i) => i.status === "REPORTED").length,
      inProgress: incidents.filter((i) => i.status === "IN_PROGRESS").length,
      critical: incidents.filter((i) => i.severity === "CRITICAL").length,
      resolved: incidents.filter((i) => i.status === "RESOLVED").length,
    };
  }, [incidents]);

  async function updateStatus(id: number, status: IncidentStatus) {
    try {
      setUpdatingId(id);

      const updated = await incidentService.updateStatus(id, status);

      setIncidents((prev) =>
        prev.map((incident) =>
          incident.id === id ? updated : incident
        )
      );

      toast.success("Statut incident mis à jour");
    } catch (e: any) {
      console.error(e);
      toast.error(
        e?.response?.data?.message ||
          e?.response?.data?.error ||
          "Erreur lors de la mise à jour"
      );
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <ProtectedRoute allowedRoles={["ROLE_OWNER"]}>
      <div className="space-y-6 p-6 md:p-10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Gestion des incidents
            </h1>
            <p className="mt-1 text-slate-600">
              Incidents manuels et incidents générés automatiquement depuis GPS, OBD et événements critiques.
            </p>
          </div>

          <button
            onClick={load}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Actualiser
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <StatCard label="Total" value={stats.total} />
          <StatCard label="Signalés" value={stats.reported} />
          <StatCard label="En traitement" value={stats.inProgress} />
          <StatCard label="Critiques" value={stats.critical} danger />
          <StatCard label="Résolus" value={stats.resolved} />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="mb-2 text-sm font-bold text-slate-600">
                Filtrer par statut
              </p>

              <div className="flex flex-wrap gap-2">
                {(["ALL", "REPORTED", "VALIDATED", "IN_PROGRESS", "RESOLVED", "REJECTED"] as StatusFilter[]).map(
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
                      {status}
                    </button>
                  )
                )}
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-bold text-slate-600">
                Filtrer par gravité
              </p>

              <div className="flex flex-wrap gap-2">
                {(["ALL", "LOW", "MEDIUM", "HIGH", "CRITICAL"] as SeverityFilter[]).map(
                  (severity) => (
                    <button
                      key={severity}
                      onClick={() => setSeverityFilter(severity)}
                      className={`rounded-xl border px-3 py-2 text-xs font-bold transition ${
                        severityFilter === severity
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {severity}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-slate-500 shadow-sm">
            Chargement des incidents...
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-slate-500 shadow-sm">
            Aucun incident trouvé.
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((incident) => (
              <div
                key={incident.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-extrabold text-slate-900">
                        {incident.title}
                      </h2>

                      <span
                        className={`rounded-full border px-2 py-1 text-xs font-bold ${severityClass(
                          incident.severity
                        )}`}
                      >
                        {incident.severity}
                      </span>

                      <span
                        className={`rounded-full border px-2 py-1 text-xs font-bold ${statusClass(
                          incident.status
                        )}`}
                      >
                        {incident.status}
                      </span>

                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-bold text-slate-600">
                        {incident.source}
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-slate-600">
                      {incident.description || "Aucune description."}
                    </p>

                    <div className="mt-3 grid gap-2 text-xs text-slate-500 md:grid-cols-2 xl:grid-cols-4">
                      <Info label="Type" value={incident.type} />
                      <Info
                        label="Véhicule"
                        value={
                          incident.vehicleRegistrationNumber
                            ? `${incident.vehicleRegistrationNumber} (#${incident.vehicleId})`
                            : incident.vehicleId
                            ? `#${incident.vehicleId}`
                            : "—"
                        }
                      />
                      <Info
                        label="Mission"
                        value={
                          incident.missionTitle
                            ? `${incident.missionTitle} (#${incident.missionId})`
                            : incident.missionId
                            ? `#${incident.missionId}`
                            : "—"
                        }
                      />
                      <Info label="Date" value={formatDate(incident.createdAt)} />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 lg:justify-end">
                    {canMoveTo(incident.status, "VALIDATED") && (
                      <ActionButton
                        disabled={updatingId === incident.id}
                        onClick={() => updateStatus(incident.id, "VALIDATED")}
                      >
                        Valider
                      </ActionButton>
                    )}

                    {canMoveTo(incident.status, "IN_PROGRESS") && (
                      <ActionButton
                        disabled={updatingId === incident.id}
                        onClick={() => updateStatus(incident.id, "IN_PROGRESS")}
                      >
                        Traiter
                      </ActionButton>
                    )}

                    {canMoveTo(incident.status, "RESOLVED") && (
                      <ActionButton
                        success
                        disabled={updatingId === incident.id}
                        onClick={() => updateStatus(incident.id, "RESOLVED")}
                      >
                        Résoudre
                      </ActionButton>
                    )}

                    {canMoveTo(incident.status, "REJECTED") && (
                      <ActionButton
                        muted
                        disabled={updatingId === incident.id}
                        onClick={() => updateStatus(incident.id, "REJECTED")}
                      >
                        Rejeter
                      </ActionButton>
                    )}
                  </div>
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

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-2">
      <p className="font-bold text-slate-400">{label}</p>
      <p className="mt-1 font-bold text-slate-700">{value}</p>
    </div>
  );
}

function ActionButton({
  children,
  onClick,
  disabled,
  success,
  muted,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  success?: boolean;
  muted?: boolean;
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`rounded-xl px-3 py-2 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
        success
          ? "bg-green-600 hover:bg-green-700"
          : muted
          ? "bg-slate-500 hover:bg-slate-600"
          : "bg-slate-900 hover:bg-slate-800"
      }`}
    >
      {children}
    </button>
  );
}