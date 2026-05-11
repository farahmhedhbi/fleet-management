"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Banknote,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Loader2,
  MapPin,
  StickyNote,
  Wrench,
  XCircle,
} from "lucide-react";
import { toast } from "react-toastify";

import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { maintenanceWorkOrderService } from "@/lib/services/maintenanceWorkOrderService";
import type {
  MaintenanceDTO,
  MaintenanceWorkOrderDTO,
  WorkOrderStatus,
} from "@/types/maintenance";

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("fr-FR");
}

function statusClass(status: WorkOrderStatus) {
  switch (status) {
    case "COMPLETED":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "IN_PROGRESS":
      return "bg-yellow-50 text-yellow-700 border-yellow-200";
    case "CANCELED":
      return "bg-red-50 text-red-700 border-red-200";
    case "PLANNED":
    default:
      return "bg-blue-50 text-blue-700 border-blue-200";
  }
}

function priorityClass(priority: string) {
  switch (priority) {
    case "CRITICAL":
      return "border-l-red-500 bg-red-50";
    case "HIGH":
      return "border-l-orange-500 bg-orange-50";
    case "MEDIUM":
      return "border-l-yellow-500 bg-yellow-50";
    case "LOW":
    default:
      return "border-l-emerald-500 bg-emerald-50";
  }
}

function taskStatusClass(status: string) {
  switch (status) {
    case "DONE":
      return "bg-emerald-100 text-emerald-700";
    case "IN_PROGRESS":
      return "bg-yellow-100 text-yellow-700";
    case "CANCELED":
      return "bg-red-100 text-red-700";
    case "OVERDUE":
      return "bg-orange-100 text-orange-700";
    case "PLANNED":
    default:
      return "bg-blue-100 text-blue-700";
  }
}

function progressPercent(tasks: MaintenanceDTO[]) {
  if (!tasks.length) return 0;
  const done = tasks.filter((m) => m.status === "DONE").length;
  return Math.round((done / tasks.length) * 100);
}

export default function MaintenanceWorkOrderDetailPage() {
  const params = useParams();
  const id = Number(params?.id);
  const isValidId = Number.isFinite(id) && id > 0;

  const [item, setItem] = useState<MaintenanceWorkOrderDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [actualCost, setActualCost] = useState("");
  const [updating, setUpdating] = useState(false);

  async function load() {
    if (!isValidId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await maintenanceWorkOrderService.getById(id);
      setItem(data);
      setActualCost(data.actualCost != null ? String(data.actualCost) : "");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "WorkOrder introuvable");
      setItem(null);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(status: WorkOrderStatus) {
    if (!item) return;

    try {
      setUpdating(true);

      await maintenanceWorkOrderService.updateStatus(item.id, {
        status,
        actualCost:
          status === "COMPLETED" && actualCost ? Number(actualCost) : undefined,
      });

      toast.success("WorkOrder mis à jour");
      await load();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Impossible de modifier le WorkOrder"
      );
    } finally {
      setUpdating(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  const stats = useMemo(() => {
    const tasks = item?.maintenances ?? [];
    return {
      total: tasks.length,
      done: tasks.filter((m) => m.status === "DONE").length,
      inProgress: tasks.filter((m) => m.status === "IN_PROGRESS").length,
      critical: tasks.filter((m) => m.priority === "CRITICAL").length,
      progress: progressPercent(tasks),
    };
  }, [item]);

  return (
    <ProtectedRoute allowedRoles={["ROLE_OWNER", "ROLE_ADMIN"]}>
      <div className="min-h-screen bg-slate-50 px-4 py-6 md:px-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <Link
            href="/owner/maintenance-work-orders"
            className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:underline"
          >
            <ArrowLeft size={16} />
            Retour WorkOrders
          </Link>

          {loading ? (
            <div className="rounded-3xl border bg-white p-8 shadow-sm">
              <div className="flex items-center gap-3 text-slate-600">
                <Loader2 className="animate-spin" />
                Chargement...
              </div>
            </div>
          ) : !item ? (
            <div className="rounded-3xl border bg-white p-8 text-red-600 shadow-sm">
              WorkOrder introuvable
            </div>
          ) : (
            <div className="overflow-hidden rounded-3xl border bg-white shadow-sm">
              <div className="bg-gradient-to-r from-blue-700 via-cyan-600 to-emerald-500 p-6 text-white">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-bold">
                      <Wrench size={14} />
                      Work Order garage
                    </div>

                    <h1 className="text-2xl font-black md:text-3xl">
                      {item.title}
                    </h1>

                    <p className="mt-1 text-sm text-white/90">
                      WorkOrder #{item.id} • {item.vehicleRegistrationNumber}
                    </p>
                  </div>

                  <span
                    className={`rounded-full border px-4 py-2 text-xs font-black ${statusClass(
                      item.status
                    )}`}
                  >
                    {item.status}
                  </span>
                </div>
              </div>

              <div className="grid gap-4 p-6 md:grid-cols-4">
                <div className="rounded-2xl border bg-slate-50 p-5">
                  <p className="text-xs font-bold uppercase text-slate-500">
                    Progression
                  </p>
                  <p className="mt-2 text-3xl font-black text-slate-900">
                    {stats.progress}%
                  </p>
                  <div className="mt-3 h-2 rounded-full bg-slate-200">
                    <div
                      className="h-2 rounded-full bg-emerald-500"
                      style={{ width: `${stats.progress}%` }}
                    />
                  </div>
                </div>

                <div className="rounded-2xl border bg-blue-50 p-5">
                  <p className="text-xs font-bold uppercase text-blue-600">
                    Tâches
                  </p>
                  <p className="mt-2 text-3xl font-black text-blue-700">
                    {stats.total}
                  </p>
                </div>

                <div className="rounded-2xl border bg-yellow-50 p-5">
                  <p className="text-xs font-bold uppercase text-yellow-700">
                    En cours
                  </p>
                  <p className="mt-2 text-3xl font-black text-yellow-700">
                    {stats.inProgress}
                  </p>
                </div>

                <div className="rounded-2xl border bg-red-50 p-5">
                  <p className="text-xs font-bold uppercase text-red-600">
                    Critiques
                  </p>
                  <p className="mt-2 text-3xl font-black text-red-700">
                    {stats.critical}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 px-6 pb-6 md:grid-cols-2">
                <div className="rounded-2xl border bg-slate-50 p-5">
                  <h2 className="mb-4 flex items-center gap-2 font-black text-slate-900">
                    <CalendarDays size={18} />
                    Informations intervention
                  </h2>

                  <div className="grid gap-3 text-sm">
                    <p>
                      <MapPin size={15} className="mr-2 inline text-blue-600" />
                      <b>Garage :</b> {item.garageName ?? "-"}
                    </p>
                    <p>
                      <Clock3 size={15} className="mr-2 inline text-blue-600" />
                      <b>Début :</b> {formatDate(item.startDate)}
                    </p>
                    <p>
                      <Clock3 size={15} className="mr-2 inline text-blue-600" />
                      <b>Fin :</b> {formatDate(item.endDate)}
                    </p>
                    <p>
                      <b>Durée estimée :</b>{" "}
                      {item.estimatedDurationDays ?? "-"} jour(s)
                    </p>
                    <p>
                      <Banknote
                        size={15}
                        className="mr-2 inline text-emerald-600"
                      />
                      <b>Coût estimé :</b>{" "}
                      {item.estimatedCost != null
                        ? `${item.estimatedCost} DT`
                        : "-"}
                    </p>
                    <p>
                      <Banknote
                        size={15}
                        className="mr-2 inline text-emerald-600"
                      />
                      <b>Coût réel :</b>{" "}
                      {item.actualCost != null ? `${item.actualCost} DT` : "-"}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border bg-slate-50 p-5">
                  <h2 className="mb-4 flex items-center gap-2 font-black text-slate-900">
                    <StickyNote size={18} />
                    Notes
                  </h2>
                  <p className="text-sm leading-6 text-slate-600">
                    {item.notes || "Aucune note"}
                  </p>
                </div>
              </div>

              <div className="px-6 pb-6">
                <div className="rounded-2xl border bg-white p-5">
                  <h2 className="mb-4 flex items-center gap-2 font-black text-slate-900">
                    <Wrench size={18} />
                    Tâches maintenance
                  </h2>

                  {item.maintenances.length === 0 ? (
                    <p className="text-sm text-slate-500">
                      Aucune maintenance liée.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {item.maintenances.map((m) => (
                        <div
                          key={m.id}
                          className={`flex flex-col gap-3 rounded-2xl border border-l-4 p-4 transition hover:-translate-y-0.5 hover:shadow-sm md:flex-row md:items-center md:justify-between ${priorityClass(
                            m.priority
                          )}`}
                        >
                          <div>
                            <p className="font-black text-slate-900">
                              #{m.id} - {m.title}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold">
                              <span className="rounded-full bg-white px-2 py-1 text-slate-600">
                                {m.type}
                              </span>
                              <span className="rounded-full bg-white px-2 py-1 text-slate-600">
                                {m.priority}
                              </span>
                              <span
                                className={`rounded-full px-2 py-1 ${taskStatusClass(
                                  m.status
                                )}`}
                              >
                                {m.status}
                              </span>
                            </div>
                          </div>

                          <Link
                            href={`/owner/maintenances/${m.id}`}
                            className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-black text-white hover:bg-blue-700"
                          >
                            Voir maintenance
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {item.status !== "COMPLETED" && item.status !== "CANCELED" && (
                  <div className="mt-5 rounded-2xl border bg-slate-50 p-5">
                    <h2 className="mb-4 font-black text-slate-900">Actions</h2>

                    <div className="flex flex-col gap-3 md:flex-row md:items-center">
                      {item.status === "PLANNED" && (
                        <button
                          onClick={() => updateStatus("IN_PROGRESS")}
                          disabled={updating}
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-yellow-600 px-5 py-3 text-sm font-black text-white hover:bg-yellow-700 disabled:opacity-50"
                        >
                          {updating ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Wrench size={16} />
                          )}
                          START
                        </button>
                      )}

                      {item.status === "IN_PROGRESS" && (
                        <>
                          <input
                            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-400"
                            placeholder="Coût réel"
                            value={actualCost}
                            onChange={(e) => setActualCost(e.target.value)}
                          />

                          <button
                            onClick={() => updateStatus("COMPLETED")}
                            disabled={updating}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-black text-white hover:bg-emerald-700 disabled:opacity-50"
                          >
                            {updating ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <CheckCircle2 size={16} />
                            )}
                            COMPLETED
                          </button>
                        </>
                      )}

                      <button
                        onClick={() => updateStatus("CANCELED")}
                        disabled={updating}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-black text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        {updating ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <XCircle size={16} />
                        )}
                        CANCEL
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}