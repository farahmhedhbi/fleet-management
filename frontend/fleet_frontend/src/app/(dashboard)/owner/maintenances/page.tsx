"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Loader2,
  Plus,
  Search,
  Wrench,
  X,
  XCircle,
} from "lucide-react";

import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { maintenanceService } from "@/lib/services/maintenanceService";
import type { MaintenanceDTO, MaintenanceStatus } from "@/types/maintenance";

import UpcomingMaintenancesPage from "./upcoming/page";

type FilterStatus = "ALL" | MaintenanceStatus;
type ViewMode = "LIST" | "UPCOMING";

function statusBadgeClass(status: MaintenanceStatus) {
  switch (status) {
    case "DONE":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "CANCELED":
      return "border-red-200 bg-red-50 text-red-700";
    case "OVERDUE":
      return "border-orange-200 bg-orange-50 text-orange-700";
    case "IN_PROGRESS":
      return "border-yellow-200 bg-yellow-50 text-yellow-700";
    case "PLANNED":
    default:
      return "border-blue-200 bg-blue-50 text-blue-700";
  }
}

function priorityBadgeClass(priority: string) {
  switch (priority) {
    case "CRITICAL":
      return "border-red-200 bg-red-50 text-red-700";
    case "HIGH":
      return "border-orange-200 bg-orange-50 text-orange-700";
    case "MEDIUM":
      return "border-yellow-200 bg-yellow-50 text-yellow-700";
    case "LOW":
    default:
      return "border-green-200 bg-green-50 text-green-700";
  }
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("fr-FR");
}

function typeLabel(type: string) {
  return type.replaceAll("_", " ");
}

function getErrorMessage(error: any, fallback: string) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
}

export default function OwnerMaintenancesPage() {
  const [items, setItems] = useState<MaintenanceDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("ALL");
  const [viewMode, setViewMode] = useState<ViewMode>("LIST");

  const [pageError, setPageError] = useState<string | null>(null);
  const [pageSuccess, setPageSuccess] = useState<string | null>(null);

  function clearMessages() {
    setPageError(null);
    setPageSuccess(null);
  }

  async function load() {
    try {
      setLoading(true);
      setPageError(null);
      setItems(await maintenanceService.getAll());
    } catch (error: any) {
      setPageError(
        getErrorMessage(error, "Erreur lors du chargement des maintenances")
      );
    } finally {
      setLoading(false);
    }
  }

  async function changeStatus(id: number, status: MaintenanceStatus) {
    try {
      clearMessages();
      setUpdatingId(id);

      await maintenanceService.updateStatus(id, status);

      if (status === "IN_PROGRESS") {
        setPageSuccess("Maintenance démarrée avec succès.");
      } else if (status === "DONE") {
        setPageSuccess("Maintenance terminée avec succès.");
      } else {
        setPageSuccess("Statut mis à jour avec succès.");
      }

      await load();
    } catch (error: any) {
      setPageError(getErrorMessage(error, "Impossible de modifier le statut"));
    } finally {
      setUpdatingId(null);
    }
  }

  async function cancel(id: number) {
    try {
      clearMessages();
      setUpdatingId(id);

      await maintenanceService.cancel(id);

      setPageSuccess("Maintenance annulée avec succès.");
      await load();
    } catch (error: any) {
      setPageError(getErrorMessage(error, "Impossible d'annuler la maintenance"));
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
      planned: items.filter((m) => m.status === "PLANNED").length,
      inProgress: items.filter((m) => m.status === "IN_PROGRESS").length,
      overdue: items.filter((m) => m.status === "OVERDUE").length,
      done: items.filter((m) => m.status === "DONE").length,
      linked: items.filter((m) => m.incidentId).length,
    };
  }, [items]);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();

    return items.filter((m) => {
      const matchStatus = statusFilter === "ALL" || m.status === statusFilter;

      const matchSearch =
        !q ||
        m.title.toLowerCase().includes(q) ||
        m.type.toLowerCase().includes(q) ||
        m.priority.toLowerCase().includes(q) ||
        (m.vehicleRegistrationNumber ?? "").toLowerCase().includes(q) ||
        (m.incidentTitle ?? "").toLowerCase().includes(q) ||
        (m.workOrderTitle ?? "").toLowerCase().includes(q);

      return matchStatus && matchSearch;
    });
  }, [items, query, statusFilter]);

  return (
    <ProtectedRoute allowedRoles={["ROLE_OWNER", "ROLE_ADMIN"]}>
      <div className="min-h-screen bg-slate-50 px-4 py-6 md:px-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="bg-gradient-to-r from-blue-700 via-cyan-600 to-emerald-500 p-6 text-white">
              <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-sm font-semibold">
                    <Wrench size={16} />
                    Module maintenance PRO
                  </div>

                  <h1 className="text-2xl font-black md:text-3xl">
                    Gestion des maintenances
                  </h1>

                  <p className="mt-2 max-w-2xl text-sm text-white/90">
                    Maintenances, priorités, incidents liés et interventions
                    garage.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/owner/maintenance-work-orders"
                    className="rounded-2xl bg-white/20 px-5 py-3 text-sm font-black text-white ring-1 ring-white/30 hover:bg-white/30"
                  >
                    Work Orders
                  </Link>

                  <Link
                    href="/owner/maintenances/new"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-blue-700 shadow-sm hover:bg-blue-50"
                  >
                    <Plus size={18} />
                    Ajouter maintenance
                  </Link>
                </div>
              </div>
            </div>

            <div className="border-b border-slate-100 bg-white p-4">
              <div className="flex flex-wrap gap-2 rounded-2xl bg-slate-100 p-2">
                <button
                  onClick={() => setViewMode("LIST")}
                  className={`rounded-xl px-4 py-2 text-sm font-black transition ${
                    viewMode === "LIST"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-600 hover:bg-white"
                  }`}
                >
                  Toutes les maintenances
                </button>

                <button
                  onClick={() => setViewMode("UPCOMING")}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-black transition ${
                    viewMode === "UPCOMING"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-600 hover:bg-white"
                  }`}
                >
                  <CalendarClock size={16} />
                  Maintenances à venir
                </button>
              </div>
            </div>

            {viewMode === "LIST" && (
              <div className="grid gap-4 p-6 md:grid-cols-6">
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                  <p className="text-sm font-semibold text-slate-500">Total</p>
                  <p className="mt-2 text-3xl font-black">{stats.total}</p>
                </div>

                <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
                  <p className="text-sm font-semibold text-blue-600">
                    Planifiées
                  </p>
                  <p className="mt-2 text-3xl font-black text-blue-700">
                    {stats.planned}
                  </p>
                </div>

                <div className="rounded-2xl border border-yellow-100 bg-yellow-50 p-5">
                  <p className="text-sm font-semibold text-yellow-700">
                    En cours
                  </p>
                  <p className="mt-2 text-3xl font-black text-yellow-700">
                    {stats.inProgress}
                  </p>
                </div>

                <div className="rounded-2xl border border-orange-100 bg-orange-50 p-5">
                  <p className="text-sm font-semibold text-orange-600">
                    En retard
                  </p>
                  <p className="mt-2 text-3xl font-black text-orange-700">
                    {stats.overdue}
                  </p>
                </div>

                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
                  <p className="text-sm font-semibold text-emerald-600">
                    Terminées
                  </p>
                  <p className="mt-2 text-3xl font-black text-emerald-700">
                    {stats.done}
                  </p>
                </div>

                <div className="rounded-2xl border border-purple-100 bg-purple-50 p-5">
                  <p className="text-sm font-semibold text-purple-600">
                    Incidents liés
                  </p>
                  <p className="mt-2 text-3xl font-black text-purple-700">
                    {stats.linked}
                  </p>
                </div>
              </div>
            )}
          </div>

          {pageError && (
            <div className="flex items-start justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700 shadow-sm">
              <div className="flex gap-3">
                <AlertTriangle size={20} className="mt-0.5 shrink-0" />
                <div>
                  <p className="font-black">Action impossible</p>
                  <p className="mt-1 text-sm">{pageError}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPageError(null)}
                className="rounded-lg p-1 hover:bg-red-100"
              >
                <X size={18} />
              </button>
            </div>
          )}

          {pageSuccess && (
            <div className="flex items-start justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700 shadow-sm">
              <div className="flex gap-3">
                <CheckCircle2 size={20} className="mt-0.5 shrink-0" />
                <div>
                  <p className="font-black">Succès</p>
                  <p className="mt-1 text-sm">{pageSuccess}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPageSuccess(null)}
                className="rounded-lg p-1 hover:bg-emerald-100"
              >
                <X size={18} />
              </button>
            </div>
          )}

          {viewMode === "UPCOMING" ? (
            <UpcomingMaintenancesPage />
          ) : (
            <>
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="relative w-full md:max-w-md">
                    <Search
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Rechercher véhicule, titre, priorité, work order..."
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none focus:border-blue-400 focus:bg-white"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        "ALL",
                        "PLANNED",
                        "IN_PROGRESS",
                        "OVERDUE",
                        "DONE",
                        "CANCELED",
                      ] as FilterStatus[]
                    ).map((s) => (
                      <button
                        key={s}
                        onClick={() => setStatusFilter(s)}
                        className={`rounded-2xl px-4 py-2 text-xs font-black ${
                          statusFilter === s
                            ? "bg-blue-600 text-white shadow-sm"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                  <div className="flex items-center gap-3 text-slate-600">
                    <Loader2 className="animate-spin" size={22} />
                    <span className="font-semibold">
                      Chargement des maintenances...
                    </span>
                  </div>
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
                    <Wrench className="text-blue-600" size={34} />
                  </div>

                  <h2 className="text-xl font-black text-slate-900">
                    Aucune maintenance trouvée
                  </h2>
                </div>
              ) : (
                <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                    <div>
                      <h2 className="font-black text-slate-900">
                        Liste des maintenances
                      </h2>
                      <p className="text-xs text-slate-500">
                        {filteredItems.length} résultat(s)
                      </p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[1250px] text-sm">
                      <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                        <tr>
                          <th className="px-5 py-4 text-left">Véhicule</th>
                          <th className="px-5 py-4 text-left">Maintenance</th>
                          <th className="px-5 py-4 text-left">Priorité</th>
                          <th className="px-5 py-4 text-left">Incident</th>
                          <th className="px-5 py-4 text-left">WorkOrder</th>
                          <th className="px-5 py-4 text-left">Statut</th>
                          <th className="px-5 py-4 text-left">Date prévue</th>
                          <th className="px-5 py-4 text-right">Actions</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100">
                        {filteredItems.map((m) => {
                          const isUpdating = updatingId === m.id;

                          return (
                            <tr key={m.id} className="hover:bg-slate-50">
                              <td className="px-5 py-4 font-bold">
                                {m.vehicleRegistrationNumber ?? "-"}
                              </td>

                              <td className="px-5 py-4">
                                <p className="font-black text-slate-900">
                                  {m.title}
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                  {typeLabel(m.type)}
                                </p>
                              </td>

                              <td className="px-5 py-4">
                                <span
                                  className={`rounded-full border px-3 py-1 text-xs font-black ${priorityBadgeClass(
                                    m.priority
                                  )}`}
                                >
                                  {m.priority}
                                </span>
                              </td>

                              <td className="px-5 py-4">
                                {m.incidentId ? (
                                  <Link
                                    href={`/owner/incidents/${m.incidentId}`}
                                    className="text-xs font-bold text-orange-600 hover:underline"
                                  >
                                    #{m.incidentId} -{" "}
                                    {m.incidentTitle ?? "Incident"}
                                  </Link>
                                ) : (
                                  "-"
                                )}
                              </td>

                              <td className="px-5 py-4">
                                {m.workOrderId ? (
                                  <Link
                                    href={`/owner/maintenance-work-orders/${m.workOrderId}`}
                                    className="text-xs font-bold text-blue-600 hover:underline"
                                  >
                                    #{m.workOrderId} -{" "}
                                    {m.workOrderTitle ?? "WorkOrder"}
                                  </Link>
                                ) : (
                                  "-"
                                )}
                              </td>

                              <td className="px-5 py-4">
                                <span
                                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-black ${statusBadgeClass(
                                    m.status
                                  )}`}
                                >
                                  {m.status === "DONE" && (
                                    <CheckCircle2 size={14} />
                                  )}
                                  {m.status === "CANCELED" && (
                                    <XCircle size={14} />
                                  )}
                                  {m.status === "OVERDUE" && (
                                    <AlertTriangle size={14} />
                                  )}
                                  {m.status === "IN_PROGRESS" && (
                                    <Wrench size={14} />
                                  )}
                                  {m.status === "PLANNED" && <Clock3 size={14} />}
                                  {m.status}
                                </span>
                              </td>

                              <td className="px-5 py-4">
                                {formatDate(m.plannedDate)}
                              </td>

                              <td className="px-5 py-4">
                                <div className="flex justify-end gap-2">
                                  <Link
                                    href={`/owner/maintenances/${m.id}`}
                                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-blue-600 hover:bg-blue-50"
                                  >
                                    Détail
                                  </Link>

                                  {m.status !== "DONE" &&
                                    m.status !== "CANCELED" && (
                                      <>
                                        {(m.status === "PLANNED" ||
                                          m.status === "OVERDUE") && (
                                          <button
                                            type="button"
                                            onClick={() =>
                                              changeStatus(m.id, "IN_PROGRESS")
                                            }
                                            disabled={isUpdating}
                                            className="rounded-xl bg-yellow-600 px-3 py-2 text-xs font-black text-white hover:bg-yellow-700 disabled:opacity-50"
                                          >
                                            {isUpdating ? "..." : "START"}
                                          </button>
                                        )}

                                        {m.status === "IN_PROGRESS" && (
                                          <button
                                            type="button"
                                            onClick={() =>
                                              changeStatus(m.id, "DONE")
                                            }
                                            disabled={isUpdating}
                                            className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-black text-white hover:bg-emerald-700 disabled:opacity-50"
                                          >
                                            {isUpdating ? "..." : "DONE"}
                                          </button>
                                        )}

                                        <button
                                          type="button"
                                          onClick={() => cancel(m.id)}
                                          disabled={isUpdating}
                                          className="rounded-xl bg-red-600 px-3 py-2 text-xs font-black text-white hover:bg-red-700 disabled:opacity-50"
                                        >
                                          {isUpdating ? "..." : "CANCEL"}
                                        </button>
                                      </>
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
            </>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}