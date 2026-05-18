"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarClock,
  ChevronRight,
  Loader2,
  Search,
} from "lucide-react";
import { toast } from "react-toastify";

import { maintenanceService } from "@/lib/services/maintenanceService";
import type { MaintenanceDTO } from "@/types/maintenance";

type PriorityFilter = "ALL" | "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

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

function typeLabel(type?: string | null) {
  if (!type) return "-";
  return type.replaceAll("_", " ");
}

function priorityClass(priority: string) {
  switch (priority) {
    case "CRITICAL":
      return "bg-red-50 text-red-700 border-red-200";
    case "HIGH":
      return "bg-orange-50 text-orange-700 border-orange-200";
    case "MEDIUM":
      return "bg-yellow-50 text-yellow-700 border-yellow-200";
    case "LOW":
    default:
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }
}

function statusClass(status: string) {
  switch (status) {
    case "OVERDUE":
      return "bg-orange-50 text-orange-700 border-orange-200";
    case "IN_PROGRESS":
      return "bg-yellow-50 text-yellow-700 border-yellow-200";
    case "DONE":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "CANCELED":
      return "bg-red-50 text-red-700 border-red-200";
    case "PLANNED":
    default:
      return "bg-blue-50 text-blue-700 border-blue-200";
  }
}

function getRemainingText(date?: string | null) {
  if (!date) return "-";

  const now = new Date();
  const planned = new Date(date);

  const diffDays = Math.ceil(
    (planned.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays < 0) return `En retard`;
  if (diffDays === 0) return "Aujourd’hui";
  if (diffDays === 1) return "Demain";

  return `Dans ${diffDays} jours`;
}

export default function UpcomingMaintenancesMini() {
  const [items, setItems] = useState<MaintenanceDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("ALL");

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
      today: items.filter((m) => getRemainingText(m.plannedDate) === "Aujourd’hui")
        .length,
    };
  }, [items]);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();

    return items
      .filter((m) => {
        const matchPriority =
          priorityFilter === "ALL" || m.priority === priorityFilter;

        const matchSearch =
          !q ||
          m.title.toLowerCase().includes(q) ||
          m.type.toLowerCase().includes(q) ||
          m.priority.toLowerCase().includes(q) ||
          m.status.toLowerCase().includes(q) ||
          (m.vehicleRegistrationNumber ?? "").toLowerCase().includes(q) ||
          (m.incidentTitle ?? "").toLowerCase().includes(q);

        return matchPriority && matchSearch;
      })
      .sort((a, b) => {
        const da = a.plannedDate ? new Date(a.plannedDate).getTime() : Infinity;
        const db = b.plannedDate ? new Date(b.plannedDate).getTime() : Infinity;
        return da - db;
      });
  }, [items, query, priorityFilter]);

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
              <CalendarClock size={14} />
              Maintenances à venir
            </div>

            <h2 className="text-xl font-black text-slate-900">
              Planning des prochaines interventions
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Liste simple des maintenances planifiées prochainement.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-slate-50 px-5 py-3 text-center">
              <p className="text-xs font-bold text-slate-500">Total</p>
              <p className="text-2xl font-black text-slate-900">{stats.total}</p>
            </div>

            <div className="rounded-2xl bg-red-50 px-5 py-3 text-center">
              <p className="text-xs font-bold text-red-600">Critiques</p>
              <p className="text-2xl font-black text-red-700">
                {stats.critical}
              </p>
            </div>

            <div className="rounded-2xl bg-emerald-50 px-5 py-3 text-center">
              <p className="text-xs font-bold text-emerald-600">Aujourd’hui</p>
              <p className="text-2xl font-black text-emerald-700">
                {stats.today}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher véhicule, titre, type..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none focus:border-blue-400 focus:bg-white"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {(["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"] as PriorityFilter[]).map(
              (p) => (
                <button
                  key={p}
                  onClick={() => setPriorityFilter(p)}
                  className={`rounded-xl px-4 py-2 text-xs font-black ${
                    priorityFilter === p
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {p}
                </button>
              )
            )}
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
          <CalendarClock className="mx-auto text-blue-600" size={42} />

          <h3 className="mt-4 text-xl font-black text-slate-900">
            Aucune maintenance à venir
          </h3>

          <p className="mt-2 text-sm text-slate-500">
            Aucune intervention planifiée ne correspond aux filtres.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h3 className="font-black text-slate-900">
              Liste des prochaines maintenances
            </h3>
            <p className="text-xs text-slate-500">
              {filteredItems.length} résultat(s)
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-4 text-left">Date</th>
                  <th className="px-5 py-4 text-left">Maintenance</th>
                  <th className="px-5 py-4 text-left">Véhicule</th>
                  <th className="px-5 py-4 text-left">Priorité</th>
                  <th className="px-5 py-4 text-left">Statut</th>
                  <th className="px-5 py-4 text-left">Échéance</th>
                  <th className="px-5 py-4 text-right">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4 font-bold text-slate-800">
                      {formatDate(m.plannedDate)}
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-black text-slate-900">{m.title}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {typeLabel(m.type)}
                      </p>
                    </td>

                    <td className="px-5 py-4 font-bold text-slate-700">
                      {m.vehicleRegistrationNumber ?? "-"}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-black ${priorityClass(
                          m.priority
                        )}`}
                      >
                        {m.priority}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-black ${statusClass(
                          m.status
                        )}`}
                      >
                        {m.status}
                      </span>
                    </td>

                    <td className="px-5 py-4 font-bold text-slate-600">
                      {getRemainingText(m.plannedDate)}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/owner/maintenances/${m.id}`}
                        className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-black text-white hover:bg-blue-700"
                      >
                        Détail
                        <ChevronRight size={14} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}