"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
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

function severityClass(severity: IncidentSeverity) {
  switch (severity) {
    case "CRITICAL":
      return "bg-red-100 text-red-700 border-red-200";
    case "HIGH":
      return "bg-orange-100 text-orange-700 border-orange-200";
    case "MEDIUM":
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case "LOW":
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

function statusClass(status: IncidentStatus) {
  switch (status) {
    case "OPEN":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "IN_PROGRESS":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "RESOLVED":
      return "bg-green-100 text-green-700 border-green-200";
    case "CLOSED":
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
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

function canMoveTo(status: IncidentStatus, target: IncidentStatus) {
  if (status === target) return false;
  if (status === "CLOSED") return false;

  if (target === "IN_PROGRESS") return status === "OPEN" || status === "RESOLVED";
  if (target === "RESOLVED") return status === "OPEN" || status === "IN_PROGRESS";
  if (target === "CLOSED") {
    return status === "OPEN" || status === "IN_PROGRESS" || status === "RESOLVED";
  }

  return false;
}

function splitDescription(description?: string | null) {
  if (!description || description.trim().length === 0) return ["Aucune description."];

  return description
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
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
      setLoading(true);
      const data = await incidentService.getAll();

      setIncidents(Array.isArray(data) ? data : []);
      receivedRef.current = new Set(data.map((incident) => incidentKey(incident)));
    } catch (e: any) {
      console.error(e);
      toast.error(
        e?.response?.data?.message ||
          e?.response?.data?.error ||
          "Erreur lors du chargement des incidents"
      );
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
        if (exists) return prev.map((i) => (i.id === incident.id ? incident : i));
        return [incident, ...prev].slice(0, 100);
      });

      if (!alreadyKnown && incident.status === "OPEN") {
        if (incident.severity === "CRITICAL" || incident.severity === "HIGH") {
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

    return () => unsubscribeIncidentsLive();
  }, []);

  const activeIncidents = useMemo(() => {
    return incidents.filter(
      (incident) => incident.status !== "RESOLVED" && incident.status !== "CLOSED"
    );
  }, [incidents]);

  const filtered = useMemo(() => {
    return incidents.filter((incident) => {
      const statusOk = statusFilter === "ALL" || incident.status === statusFilter;
      const severityOk =
        severityFilter === "ALL" || incident.severity === severityFilter;

      return statusOk && severityOk;
    });
  }, [incidents, statusFilter, severityFilter]);

  const stats = useMemo(() => {
    return {
      total: incidents.length,
      active: activeIncidents.length,
      open: incidents.filter((i) => i.status === "OPEN").length,
      inProgress: incidents.filter((i) => i.status === "IN_PROGRESS").length,
      critical: activeIncidents.filter((i) => i.severity === "CRITICAL").length,
      resolved: incidents.filter((i) => i.status === "RESOLVED").length,
      closed: incidents.filter((i) => i.status === "CLOSED").length,
    };
  }, [incidents, activeIncidents]);

  async function updateStatus(id: number, status: IncidentStatus) {
    try {
      setUpdatingId(id);

      const updated = await incidentService.updateStatus(id, status);

      setIncidents((prev) =>
        prev.map((incident) => (incident.id === id ? updated : incident))
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
    <ProtectedRoute allowedRoles={["ROLE_OWNER", "ROLE_ADMIN"]}>
      <div className="space-y-6 p-6 md:p-10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Gestion des incidents
            </h1>
            <p className="mt-1 text-slate-600">
              Suivi des incidents déclarés par les drivers ou confirmés depuis
              les alertes GPS / OBD.
            </p>
          </div>

          <button
            onClick={load}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Actualiser
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-7">
          <StatCard label="Total" value={stats.total} />
          <StatCard label="Actifs" value={stats.active} danger={stats.active > 0} />
          <StatCard label="Ouverts" value={stats.open} />
          <StatCard label="En traitement" value={stats.inProgress} />
          <StatCard
            label="Critiques actifs"
            value={stats.critical}
            danger={stats.critical > 0}
          />
          <StatCard label="Résolus" value={stats.resolved} />
          <StatCard label="Clôturés" value={stats.closed} />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
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
                      {severity === "ALL" ? "Toutes" : severityLabel(severity)}
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
            {filtered.map((incident) => {
              const descriptionLines = splitDescription(incident.description);

              return (
                <div
                  key={incident.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-extrabold text-slate-900">
                          {incident.title}
                        </h2>

                        <Badge className={severityClass(incident.severity)}>
                          {severityLabel(incident.severity)}
                        </Badge>

                        <Badge className={statusClass(incident.status)}>
                          {statusLabel(incident.status)}
                        </Badge>

                        <Badge className="border-slate-200 bg-slate-50 text-slate-600">
                          {incident.source}
                        </Badge>

                        {incident.emergency ? (
                          <Badge className="border-red-200 bg-red-50 text-red-700">
                            Urgence
                          </Badge>
                        ) : null}
                      </div>

                      <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                        {descriptionLines.map((line, index) => (
                          <p
                            key={`${incident.id}-line-${index}`}
                            className="mt-1 first:mt-0"
                          >
                            {line}
                          </p>
                        ))}
                      </div>

                      <div className="mt-3 grid gap-2 text-xs text-slate-500 md:grid-cols-2 xl:grid-cols-5">
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

                        <Info
                          label="Déclaré par"
                          value={incident.reportedByEmail || "—"}
                        />

                        <Info
                          label="Date"
                          value={formatDate(incident.reportedAt || incident.createdAt)}
                        />
                      </div>

                      <div className="mt-3 grid gap-2 text-xs text-slate-500 md:grid-cols-2 xl:grid-cols-4">
                        <Info
                          label="Dernière mise à jour"
                          value={formatDate(incident.updatedAt)}
                        />

                        <Info
                          label="Traité par"
                          value={incident.handledByEmail || "—"}
                        />

                        <Info
                          label="Position"
                          value={
                            incident.latitude != null && incident.longitude != null
                              ? `${incident.latitude.toFixed(5)}, ${incident.longitude.toFixed(5)}`
                              : "—"
                          }
                        />

                        <Info
                          label="Event lié"
                          value={
                            incident.vehicleEventId
                              ? `#${incident.vehicleEventId}`
                              : "—"
                          }
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 lg:w-44 lg:justify-end">
                      <Link
                        href={`/incidents/${incident.id}`}
                        className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
                      >
                        Détails
                      </Link>

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

                      {canMoveTo(incident.status, "CLOSED") && (
                        <ActionButton
                          muted
                          disabled={updatingId === incident.id}
                          onClick={() => updateStatus(incident.id, "CLOSED")}
                        >
                          Clôturer
                        </ActionButton>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
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
      <p className="mt-1 break-words font-bold text-slate-700">{value}</p>
    </div>
  );
}

function Badge({
  children,
  className,
}: {
  children: ReactNode;
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

function ActionButton({
  children,
  onClick,
  disabled,
  success,
  muted,
}: {
  children: ReactNode;
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