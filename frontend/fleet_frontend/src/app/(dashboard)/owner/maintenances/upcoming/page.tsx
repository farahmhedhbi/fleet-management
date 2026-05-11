"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Loader2,
  Wrench,
} from "lucide-react";
import { toast } from "react-toastify";

import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { maintenanceService } from "@/lib/services/maintenanceService";
import type { MaintenanceDTO } from "@/types/maintenance";

function formatDate(value?: string | null) {
  if (!value) return "-";

  return new Date(value).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDay(value?: string | null) {
  if (!value) return "--";

  return new Date(value).toLocaleDateString("fr-FR", {
    day: "2-digit",
  });
}

function formatMonth(value?: string | null) {
  if (!value) return "--";

  return new Date(value).toLocaleDateString("fr-FR", {
    month: "short",
  });
}

function priorityClass(priority: string) {
  switch (priority) {
    case "CRITICAL":
      return "bg-red-100 text-red-700 border-red-200";
    case "HIGH":
      return "bg-orange-100 text-orange-700 border-orange-200";
    case "MEDIUM":
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case "LOW":
    default:
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
  }
}

function statusClass(status: string) {
  switch (status) {
    case "OVERDUE":
      return "bg-orange-100 text-orange-700";
    case "IN_PROGRESS":
      return "bg-yellow-100 text-yellow-700";
    case "DONE":
      return "bg-emerald-100 text-emerald-700";
    case "CANCELED":
      return "bg-red-100 text-red-700";
    case "PLANNED":
    default:
      return "bg-blue-100 text-blue-700";
  }
}

function getRemainingDays(date?: string | null) {
  if (!date) return null;

  const now = new Date();
  const planned = new Date(date);

  const diff = planned.getTime() - now.getTime();

  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function UpcomingMaintenancesPage() {
  const [items, setItems] = useState<MaintenanceDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    maintenanceService
      .getUpcoming()
      .then(setItems)
      .catch(() => toast.error("Erreur chargement maintenances prochaines"))
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    return {
      total: items.length,
      critical: items.filter((m) => m.priority === "CRITICAL").length,
      high: items.filter((m) => m.priority === "HIGH").length,
      today: items.filter((m) => {
        if (!m.plannedDate) return false;

        const d = new Date(m.plannedDate);
        const now = new Date();

        return (
          d.getDate() === now.getDate() &&
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        );
      }).length,
    };
  }, [items]);

  return (
    <ProtectedRoute allowedRoles={["ROLE_OWNER", "ROLE_ADMIN"]}>
      <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-blue-50 px-4 py-6 md:px-8">
        <div className="mx-auto max-w-7xl space-y-6">
          {/* HERO */}
          <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
            <div className="bg-gradient-to-r from-blue-700 via-cyan-600 to-emerald-500 p-6 text-white">
              <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-sm font-bold">
                    <CalendarClock size={16} />
                    Maintenance Agenda
                  </div>

                  <h1 className="text-3xl font-black">
                    Planning des maintenances
                  </h1>

                  <p className="mt-2 max-w-2xl text-sm text-white/90">
                    Vue agenda moderne des maintenances planifiées dans les
                    prochains jours.
                  </p>
                </div>

                <div className="rounded-3xl bg-white/15 p-5 backdrop-blur-sm ring-1 ring-white/20">
                  <p className="text-sm text-white/80">
                    Total interventions
                  </p>

                  <p className="mt-2 text-5xl font-black">
                    {stats.total}
                  </p>
                </div>
              </div>
            </div>

            {/* STATS */}
            <div className="grid gap-4 p-6 md:grid-cols-4">
              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
                <p className="text-sm font-semibold text-blue-600">
                  Planifiées
                </p>

                <p className="mt-2 text-3xl font-black text-blue-700">
                  {stats.total}
                </p>
              </div>

              <div className="rounded-2xl border border-red-100 bg-red-50 p-5">
                <p className="text-sm font-semibold text-red-600">
                  Critiques
                </p>

                <p className="mt-2 text-3xl font-black text-red-700">
                  {stats.critical}
                </p>
              </div>

              <div className="rounded-2xl border border-orange-100 bg-orange-50 p-5">
                <p className="text-sm font-semibold text-orange-600">
                  Priorité haute
                </p>

                <p className="mt-2 text-3xl font-black text-orange-700">
                  {stats.high}
                </p>
              </div>

              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
                <p className="text-sm font-semibold text-emerald-600">
                  Aujourd’hui
                </p>

                <p className="mt-2 text-3xl font-black text-emerald-700">
                  {stats.today}
                </p>
              </div>
            </div>
          </div>

          {/* CONTENT */}
          {loading ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
              <div className="flex items-center gap-3 text-slate-600">
                <Loader2 className="animate-spin" />
                Chargement agenda maintenance...
              </div>
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-16 text-center shadow-sm">
              <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-blue-50">
                <CalendarDays className="text-blue-600" size={40} />
              </div>

              <h2 className="text-2xl font-black text-slate-900">
                Aucun entretien planifié
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Toutes les maintenances sont terminées ou aucune maintenance
                n’est prévue prochainement.
              </p>
            </div>
          ) : (
            <div className="relative">
              {/* TIMELINE */}
              <div className="absolute left-[38px] top-0 hidden h-full w-[3px] rounded-full bg-gradient-to-b from-blue-500 via-cyan-400 to-emerald-400 md:block" />

              <div className="space-y-6">
                {items.map((m) => {
                  const remainingDays = getRemainingDays(m.plannedDate);

                  return (
                    <div
                      key={m.id}
                      className="group relative rounded-[28px] border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                    >
                      <div className="flex flex-col md:flex-row">
                        {/* DATE BLOCK */}
                        <div className="relative flex flex-col items-center justify-center border-b border-slate-100 bg-gradient-to-br from-blue-50 to-cyan-50 p-6 md:w-[160px] md:border-b-0 md:border-r">
                          <div className="absolute left-[30px] hidden h-5 w-5 rounded-full border-4 border-white bg-blue-600 shadow md:block" />

                          <div className="text-center">
                            <p className="text-5xl font-black text-blue-700">
                              {formatDay(m.plannedDate)}
                            </p>

                            <p className="mt-1 text-sm font-bold uppercase tracking-wide text-slate-500">
                              {formatMonth(m.plannedDate)}
                            </p>
                          </div>

                          <div className="mt-5 rounded-full bg-white px-3 py-1 text-xs font-black text-slate-700 shadow-sm">
                            #{m.id}
                          </div>
                        </div>

                        {/* CONTENT */}
                        <div className="flex-1 p-6">
                          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                            <div className="space-y-4">
                              <div>
                                <div className="mb-3 flex flex-wrap gap-2">
                                  <span
                                    className={`rounded-full border px-3 py-1 text-xs font-black ${priorityClass(
                                      m.priority
                                    )}`}
                                  >
                                    {m.priority}
                                  </span>

                                  <span
                                    className={`rounded-full px-3 py-1 text-xs font-black ${statusClass(
                                      m.status
                                    )}`}
                                  >
                                    {m.status}
                                  </span>

                                  {remainingDays != null && (
                                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                                      {remainingDays <= 0
                                        ? "Aujourd’hui"
                                        : `Dans ${remainingDays} jour(s)`}
                                    </span>
                                  )}
                                </div>

                                <h2 className="text-2xl font-black text-slate-900">
                                  {m.title}
                                </h2>

                                <p className="mt-2 text-sm text-slate-500">
                                  Véhicule :
                                  <span className="ml-1 font-bold text-slate-700">
                                    {m.vehicleRegistrationNumber ?? "-"}
                                  </span>
                                </p>
                              </div>

                              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                                <div className="rounded-2xl bg-slate-50 p-4">
                                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                                    Type
                                  </p>

                                  <p className="mt-2 font-black text-slate-800">
                                    {m.type}
                                  </p>
                                </div>

                                <div className="rounded-2xl bg-slate-50 p-4">
                                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                                    Date prévue
                                  </p>

                                  <p className="mt-2 font-black text-slate-800">
                                    {formatDate(m.plannedDate)}
                                  </p>
                                </div>

                                <div className="rounded-2xl bg-slate-50 p-4">
                                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                                    Coût
                                  </p>

                                  <p className="mt-2 font-black text-slate-800">
                                    {m.cost != null
                                      ? `${m.cost} DT`
                                      : "-"}
                                  </p>
                                </div>

                                <div className="rounded-2xl bg-slate-50 p-4">
                                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                                    Incident
                                  </p>

                                  <p className="mt-2 font-black text-slate-800">
                                    {m.incidentId
                                      ? `#${m.incidentId}`
                                      : "Aucun"}
                                  </p>
                                </div>
                              </div>

                              {m.description && (
                                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                                  <p className="text-sm leading-6 text-slate-600">
                                    {m.description}
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* ACTION */}
                            <div className="flex flex-col gap-3">
                              <Link
                                href={`/owner/maintenances/${m.id}`}
                                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-700"
                              >
                                Voir détail
                                <ChevronRight size={16} />
                              </Link>

                              {m.priority === "CRITICAL" && (
                                <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                                  <div className="flex items-center gap-2 text-red-700">
                                    <AlertTriangle size={16} />
                                    <span className="text-xs font-black">
                                      Maintenance critique
                                    </span>
                                  </div>
                                </div>
                              )}

                              {m.status === "PLANNED" && (
                                <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
                                  <div className="flex items-center gap-2 text-blue-700">
                                    <Clock3 size={16} />
                                    <span className="text-xs font-black">
                                      En attente intervention
                                    </span>
                                  </div>
                                </div>
                              )}

                              {m.status === "IN_PROGRESS" && (
                                <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4">
                                  <div className="flex items-center gap-2 text-yellow-700">
                                    <Wrench size={16} />
                                    <span className="text-xs font-black">
                                      Intervention en cours
                                    </span>
                                  </div>
                                </div>
                              )}

                              {m.status === "DONE" && (
                                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                                  <div className="flex items-center gap-2 text-emerald-700">
                                    <CheckCircle2 size={16} />
                                    <span className="text-xs font-black">
                                      Maintenance terminée
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}