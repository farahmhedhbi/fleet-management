"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Eye,
  FileWarning,
  Loader2,
  PlusCircle,
  ShieldAlert,
} from "lucide-react";
import { toast } from "react-toastify";

import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { incidentService } from "@/lib/services/incidentService";
import type { IncidentDTO, IncidentStatus } from "@/types/incident";

function severityClass(severity?: string) {
  switch (severity) {
    case "CRITICAL":
      return "bg-red-100 text-red-700 border-red-200";
    case "HIGH":
      return "bg-orange-100 text-orange-700 border-orange-200";
    case "MEDIUM":
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case "LOW":
      return "bg-green-100 text-green-700 border-green-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

function statusClass(status?: string) {
  switch (status) {
    case "OPEN":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "IN_PROGRESS":
      return "bg-orange-100 text-orange-700 border-orange-200";
    case "RESOLVED":
      return "bg-green-100 text-green-700 border-green-200";
    case "CLOSED":
      return "bg-slate-100 text-slate-700 border-slate-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

function nextStatusLabel(status: IncidentStatus) {
  switch (status) {
    case "OPEN":
      return "Prendre en charge";
    case "IN_PROGRESS":
      return "Résoudre";
    case "RESOLVED":
      return "Clôturer";
    default:
      return null;
  }
}

function nextStatus(status: IncidentStatus): IncidentStatus | null {
  switch (status) {
    case "OPEN":
      return "IN_PROGRESS";
    case "IN_PROGRESS":
      return "RESOLVED";
    case "RESOLVED":
      return "CLOSED";
    default:
      return null;
  }
}

export default function OwnerIncidentsPage() {
  const [items, setItems] = useState<IncidentDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  async function load() {
    try {
      setLoading(true);
      setItems(await incidentService.getAll());
    } catch {
      toast.error("Erreur chargement incidents");
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: number, status: IncidentStatus) {
    try {
      setUpdatingId(id);
      await incidentService.updateStatus(id, status);
      toast.success("Statut incident mis à jour");
      await load();
    } catch {
      toast.error("Impossible de modifier le statut");
    } finally {
      setUpdatingId(null);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const stats = useMemo(() => {
    return {
      total: items.length,
      critical: items.filter((i) => i.severity === "CRITICAL").length,
      active: items.filter(
        (i) => i.status === "OPEN" || i.status === "IN_PROGRESS"
      ).length,
      resolved: items.filter(
        (i) => i.status === "RESOLVED" || i.status === "CLOSED"
      ).length,
    };
  }, [items]);

  return (
    <ProtectedRoute allowedRoles={["ROLE_OWNER", "ROLE_ADMIN"]}>
      <div className="min-h-screen bg-slate-50 px-4 py-6 md:px-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="bg-gradient-to-r from-red-600 to-orange-500 p-6 text-white">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-sm font-medium">
                    <ShieldAlert size={16} />
                    Espace Owner
                  </div>

                  <h1 className="text-2xl font-bold md:text-3xl">
                    Gestion des incidents
                  </h1>

                  <p className="mt-2 max-w-2xl text-sm text-white/90">
                    Suivi des incidents déclarés par les drivers ou confirmés à
                    partir des alertes système.
                  </p>
                </div>

                <Link
                  href="/owner/incidents/new"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-red-600 shadow-sm transition hover:bg-red-50"
                >
                  <PlusCircle size={18} />
                  Déclarer incident
                </Link>
              </div>
            </div>

            <div className="grid gap-4 p-6 md:grid-cols-4">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                <p className="text-sm font-medium text-slate-500">
                  Total incidents
                </p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {stats.total}
                </p>
              </div>

              <div className="rounded-2xl border border-red-100 bg-red-50 p-5">
                <p className="text-sm font-medium text-red-600">
                  Critiques
                </p>
                <p className="mt-2 text-3xl font-bold text-red-700">
                  {stats.critical}
                </p>
              </div>

              <div className="rounded-2xl border border-orange-100 bg-orange-50 p-5">
                <p className="text-sm font-medium text-orange-600">
                  Actifs
                </p>
                <p className="mt-2 text-3xl font-bold text-orange-700">
                  {stats.active}
                </p>
              </div>

              <div className="rounded-2xl border border-green-100 bg-green-50 p-5">
                <p className="text-sm font-medium text-green-600">
                  Résolus / clôturés
                </p>
                <p className="mt-2 text-3xl font-bold text-green-700">
                  {stats.resolved}
                </p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="flex items-center gap-3 text-slate-600">
                <Loader2 className="animate-spin" size={22} />
                <span className="font-medium">Chargement des incidents...</span>
              </div>

              <div className="mt-6 space-y-3">
                {[1, 2, 3, 4].map((item) => (
                  <div
                    key={item}
                    className="h-14 animate-pulse rounded-2xl bg-slate-100"
                  />
                ))}
              </div>
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
                <AlertTriangle className="text-red-600" size={34} />
              </div>

              <h2 className="text-xl font-bold text-slate-900">
                Aucun incident trouvé
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                Aucun incident n’a encore été déclaré ou confirmé.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
                <FileWarning className="text-red-600" size={20} />
                <h2 className="font-bold text-slate-900">
                  Liste des incidents
                </h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-5 py-4 text-left">Incident</th>
                      <th className="px-5 py-4 text-left">Véhicule</th>
                      <th className="px-5 py-4 text-left">Type</th>
                      <th className="px-5 py-4 text-left">Gravité</th>
                      <th className="px-5 py-4 text-left">Statut</th>
                      <th className="px-5 py-4 text-left">Source</th>
                      <th className="px-5 py-4 text-right">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {items.map((i) => {
                      const targetStatus = nextStatus(i.status);
                      const targetLabel = nextStatusLabel(i.status);
                      const isUpdating = updatingId === i.id;

                      return (
                        <tr
                          key={i.id}
                          className="transition hover:bg-slate-50"
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-red-50">
                                <ClipboardList
                                  className="text-red-600"
                                  size={20}
                                />
                              </div>

                              <div>
                                <p className="font-bold text-slate-900">
                                  {i.title}
                                </p>
                                <p className="line-clamp-1 max-w-xs text-xs text-slate-500">
                                  {i.description || "Aucune description"}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4 font-medium text-slate-700">
                            {i.vehicleRegistrationNumber ?? "-"}
                          </td>

                          <td className="px-5 py-4">
                            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                              {i.type}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`rounded-full border px-3 py-1 text-xs font-bold ${severityClass(
                                i.severity
                              )}`}
                            >
                              {i.severity}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`rounded-full border px-3 py-1 text-xs font-bold ${statusClass(
                                i.status
                              )}`}
                            >
                              {i.status}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                              {i.source}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex justify-end gap-2">
                              <Link
                                href={`/owner/incidents/${i.id}`}
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                              >
                                <Eye size={15} />
                                Détail
                              </Link>

                              {targetStatus && targetLabel && (
                                <button
                                  onClick={() =>
                                    updateStatus(i.id, targetStatus)
                                  }
                                  disabled={isUpdating}
                                  className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {isUpdating ? (
                                    <Loader2
                                      className="animate-spin"
                                      size={15}
                                    />
                                  ) : (
                                    <CheckCircle2 size={15} />
                                  )}
                                  {targetLabel}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}