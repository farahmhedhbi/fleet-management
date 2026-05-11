"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Loader2,
  Plus,
  Search,
  Wrench,
  XCircle,
} from "lucide-react";
import { toast } from "react-toastify";

import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { maintenanceWorkOrderService } from "@/lib/services/maintenanceWorkOrderService";
import type {
  MaintenanceWorkOrderDTO,
  WorkOrderStatus,
} from "@/types/maintenance";

type FilterStatus = "ALL" | WorkOrderStatus;

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("fr-FR");
}

function statusBadgeClass(status: WorkOrderStatus) {
  switch (status) {
    case "COMPLETED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "IN_PROGRESS":
      return "border-yellow-200 bg-yellow-50 text-yellow-700";
    case "CANCELED":
      return "border-red-200 bg-red-50 text-red-700";
    case "PLANNED":
    default:
      return "border-blue-200 bg-blue-50 text-blue-700";
  }
}

function statusIcon(status: WorkOrderStatus) {
  switch (status) {
    case "COMPLETED":
      return <CheckCircle2 size={14} />;
    case "IN_PROGRESS":
      return <Wrench size={14} />;
    case "CANCELED":
      return <XCircle size={14} />;
    case "PLANNED":
    default:
      return <Clock3 size={14} />;
  }
}

function progressPercent(w: MaintenanceWorkOrderDTO) {
  const total = w.maintenances?.length ?? 0;
  if (total === 0) return 0;

  const done = w.maintenances.filter((m) => m.status === "DONE").length;
  return Math.round((done / total) * 100);
}

export default function OwnerMaintenanceWorkOrdersPage() {
  const [items, setItems] = useState<MaintenanceWorkOrderDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("ALL");

  async function load() {
    try {
      setLoading(true);
      setItems(await maintenanceWorkOrderService.getAll());
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Erreur chargement work orders"
      );
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: number, status: WorkOrderStatus) {
    try {
      setUpdatingId(id);
      await maintenanceWorkOrderService.updateStatus(id, { status });

      if (status === "IN_PROGRESS") toast.success("WorkOrder démarré");
      else if (status === "COMPLETED") toast.success("WorkOrder terminé");
      else if (status === "CANCELED") toast.success("WorkOrder annulé");
      else toast.success("WorkOrder mis à jour");

      await load();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Impossible de modifier le work order"
      );
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
      planned: items.filter((w) => w.status === "PLANNED").length,
      inProgress: items.filter((w) => w.status === "IN_PROGRESS").length,
      completed: items.filter((w) => w.status === "COMPLETED").length,
      canceled: items.filter((w) => w.status === "CANCELED").length,
    };
  }, [items]);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();

    return items.filter((w) => {
      const matchStatus = statusFilter === "ALL" || w.status === statusFilter;

      const matchSearch =
        !q ||
        w.title.toLowerCase().includes(q) ||
        w.status.toLowerCase().includes(q) ||
        (w.vehicleRegistrationNumber ?? "").toLowerCase().includes(q) ||
        (w.garageName ?? "").toLowerCase().includes(q);

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
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-sm font-bold">
                    <Wrench size={16} />
                    Work Orders
                  </div>

                  <h1 className="text-2xl font-black md:text-3xl">
                    Interventions garage
                  </h1>

                  <p className="mt-2 max-w-2xl text-sm text-white/90">
                    Suivi des interventions, tâches maintenance, coûts et
                    progression.
                  </p>
                </div>

                <Link
                  href="/owner/maintenance-work-orders/new"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-blue-700 shadow-sm hover:bg-blue-50"
                >
                  <Plus size={18} />
                  Nouveau WorkOrder
                </Link>
              </div>
            </div>

            <div className="grid gap-4 p-6 md:grid-cols-5">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                <p className="text-sm font-semibold text-slate-500">Total</p>
                <p className="mt-2 text-3xl font-black text-slate-900">
                  {stats.total}
                </p>
              </div>

              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
                <p className="text-sm font-semibold text-blue-600">Planifiés</p>
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

              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
                <p className="text-sm font-semibold text-emerald-600">
                  Terminés
                </p>
                <p className="mt-2 text-3xl font-black text-emerald-700">
                  {stats.completed}
                </p>
              </div>

              <div className="rounded-2xl border border-red-100 bg-red-50 p-5">
                <p className="text-sm font-semibold text-red-600">Annulés</p>
                <p className="mt-2 text-3xl font-black text-red-700">
                  {stats.canceled}
                </p>
              </div>
            </div>
          </div>

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
                  placeholder="Rechercher work order, véhicule, garage..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none focus:border-blue-400 focus:bg-white"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {(
                  [
                    "ALL",
                    "PLANNED",
                    "IN_PROGRESS",
                    "COMPLETED",
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
                <span className="font-semibold">Chargement...</span>
              </div>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
                <Wrench className="text-blue-600" size={34} />
              </div>
              <h2 className="text-xl font-black text-slate-900">
                Aucun WorkOrder trouvé
              </h2>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredItems.map((w) => {
                const isUpdating = updatingId === w.id;
                const progress = progressPercent(w);

                return (
                  <div
                    key={w.id}
                    className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-black ${statusBadgeClass(
                              w.status
                            )}`}
                          >
                            {statusIcon(w.status)}
                            {w.status}
                          </span>

                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                            {w.maintenances?.length ?? 0} tâche(s)
                          </span>
                        </div>

                        <h2 className="text-lg font-black text-slate-900">
                          #{w.id} - {w.title}
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                          Véhicule :{" "}
                          <b>{w.vehicleRegistrationNumber ?? "-"}</b> • Garage :{" "}
                          <b>{w.garageName ?? "-"}</b>
                        </p>

                        <p className="mt-2 text-sm text-slate-600">
                          {formatDate(w.startDate)} → {formatDate(w.endDate)}
                        </p>

                        <div className="mt-4 max-w-md">
                          <div className="mb-1 flex justify-between text-xs font-bold text-slate-500">
                            <span>Progression</span>
                            <span>{progress}%</span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-200">
                            <div
                              className="h-2 rounded-full bg-emerald-500"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap justify-start gap-2 lg:justify-end">
                        <Link
                          href={`/owner/maintenance-work-orders/${w.id}`}
                          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-blue-600 hover:bg-blue-50"
                        >
                          Détail
                        </Link>

                        {w.status === "PLANNED" && (
                          <button
                            onClick={() => updateStatus(w.id, "IN_PROGRESS")}
                            disabled={isUpdating}
                            className="rounded-xl bg-yellow-600 px-4 py-2 text-xs font-black text-white hover:bg-yellow-700 disabled:opacity-50"
                          >
                            {isUpdating ? "..." : "START"}
                          </button>
                        )}

                        {w.status === "IN_PROGRESS" && (
                          <button
                            onClick={() => updateStatus(w.id, "COMPLETED")}
                            disabled={isUpdating}
                            className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-black text-white hover:bg-emerald-700 disabled:opacity-50"
                          >
                            {isUpdating ? "..." : "COMPLETED"}
                          </button>
                        )}

                        {w.status !== "COMPLETED" &&
                          w.status !== "CANCELED" && (
                            <button
                              onClick={() => updateStatus(w.id, "CANCELED")}
                              disabled={isUpdating}
                              className="rounded-xl bg-red-600 px-4 py-2 text-xs font-black text-white hover:bg-red-700 disabled:opacity-50"
                            >
                              {isUpdating ? "..." : "CANCEL"}
                            </button>
                          )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}