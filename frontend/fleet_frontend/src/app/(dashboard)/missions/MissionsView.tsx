"use client";

import Link from "next/link";
import type { Dispatch, SetStateAction } from "react";
import type { Mission } from "@/types/mission";
import {
  Plus,
  RefreshCcw,
  Search,
  Trash2,
  XCircle,
  Pencil,
  ClipboardList,
  Clock3,
  CheckCircle2,
  Ban,
  Route,
} from "lucide-react";

type MissionStatusFilter =
  | "ALL"
  | "PLANNED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELED";

function statusBadge(status?: string) {
  switch (status) {
    case "PLANNED":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "IN_PROGRESS":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "COMPLETED":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "CANCELED":
      return "bg-rose-50 text-rose-700 border-rose-200";
    default:
      return "bg-slate-50 text-slate-700 border-slate-200";
  }
}

function statusLabel(status?: string) {
  switch (status) {
    case "PLANNED":
      return "Planned";
    case "IN_PROGRESS":
      return "In progress";
    case "COMPLETED":
      return "Completed";
    case "CANCELED":
      return "Canceled";
    default:
      return status || "Unknown";
  }
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";

  const d = new Date(value);

  if (Number.isNaN(d.getTime())) {
    return value;
  }

  return d.toLocaleString();
}

function filterButtonClass(active: boolean) {
  return active
    ? "inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm"
    : "inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50";
}

interface Props {
  filtered: Mission[];
  loading: boolean;
  refreshing: boolean;

  q: string;
  setQ: Dispatch<SetStateAction<string>>;

  statusFilter: MissionStatusFilter;
  setStatusFilter: Dispatch<SetStateAction<MissionStatusFilter>>;

  stats: {
    total: number;
    planned: number;
    inProgress: number;
    completed: number;
    canceled: number;
  };

  onRefresh: () => void;
  onDeleteMission: (id: number) => void;
  onCancelMission: (id: number) => void;
}

export default function MissionsView({
  filtered,
  loading,
  refreshing,
  q,
  setQ,
  statusFilter,
  setStatusFilter,
  stats,
  onRefresh,
  onDeleteMission,
  onCancelMission,
}: Props) {
  const filterItems = [
    {
      key: "ALL" as MissionStatusFilter,
      label: "All",
      count: stats.total,
      icon: ClipboardList,
    },
    {
      key: "PLANNED" as MissionStatusFilter,
      label: "Planned",
      count: stats.planned,
      icon: Clock3,
    },
    {
      key: "IN_PROGRESS" as MissionStatusFilter,
      label: "In progress",
      count: stats.inProgress,
      icon: Route,
    },
    {
      key: "COMPLETED" as MissionStatusFilter,
      label: "Completed",
      count: stats.completed,
      icon: CheckCircle2,
    },
    {
      key: "CANCELED" as MissionStatusFilter,
      label: "Canceled",
      count: stats.canceled,
      icon: Ban,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl space-y-6 p-6 md:p-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                Fleet Management
              </p>

              <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900">
                Missions
              </h1>

              <p className="mt-2 max-w-2xl text-sm text-slate-600">
                Créez, filtrez et gérez les missions.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onRefresh}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
              >
                <RefreshCcw className="h-4 w-4" />
                {refreshing ? "Refreshing..." : "Refresh"}
              </button>

              <Link
                href="/missions/create"
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 font-semibold text-white hover:bg-slate-800"
              >
                <Plus className="h-4 w-4" />
                New mission
              </Link>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard label="Total missions" value={stats.total} />
          <StatCard
            label="Planned"
            value={stats.planned}
            className="border-amber-200 bg-amber-50 text-amber-800"
          />
          <StatCard
            label="In progress"
            value={stats.inProgress}
            className="border-blue-200 bg-blue-50 text-blue-800"
          />
          <StatCard
            label="Completed"
            value={stats.completed}
            className="border-emerald-200 bg-emerald-50 text-emerald-800"
          />
          <StatCard
            label="Canceled"
            value={stats.canceled}
            className="border-rose-200 bg-rose-50 text-rose-800"
          />
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by title, route, driver, vehicle..."
                className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-slate-400"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {filterItems.map((item) => {
                const Icon = item.icon;
                const active = statusFilter === item.key;

                return (
                  <button
                    type="button"
                    key={item.key}
                    onClick={() => setStatusFilter(item.key)}
                    className={filterButtonClass(active)}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                    <span
                      className={
                        active
                          ? "rounded-full bg-white/20 px-2 py-0.5 text-xs"
                          : "rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
                      }
                    >
                      {item.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-sm text-slate-600 shadow-sm">
            Loading...
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
            <h3 className="text-lg font-bold text-slate-900">
              No missions found
            </h3>

            <p className="mt-2 text-sm text-slate-600">
              Try changing the search or selecting another status filter.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filtered.map((m) => {
              const canEdit = m.status === "PLANNED";

              return (
                <div
                  key={m.id}
                  className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-lg font-bold text-slate-900">
                          {m.title}
                        </h3>

                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-bold ${statusBadge(
                            m.status
                          )}`}
                        >
                          {statusLabel(m.status)}
                        </span>
                      </div>

                      <p className="mt-2 text-sm text-slate-600">
                        {m.description || "No description"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    <Info label="Route" value={`${m.departure} → ${m.destination}`} />
                    <Info label="Vehicle" value={m.vehicleRegistrationNumber || "—"} />
                    <Info label="Driver" value={m.driverName || "—"} />
                    <Info label="Planned start" value={formatDateTime(m.startDate)} />
                    <Info label="Estimated end" value={formatDateTime(m.endDate)} />
                    <Info label="Started at" value={formatDateTime(m.startedAt)} />
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {canEdit && (
                      <Link
                        href={`/missions/${m.id}/edit`}
                        className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 font-semibold text-blue-700 hover:bg-blue-100"
                      >
                        <Pencil className="h-4 w-4" />
                        Edit
                      </Link>
                    )}

                    {m.status !== "COMPLETED" && m.status !== "CANCELED" && (
                      <button
                        type="button"
                        onClick={() => onCancelMission(m.id)}
                        className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 font-semibold text-amber-700 hover:bg-amber-100"
                      >
                        <XCircle className="h-4 w-4" />
                        Cancel
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onDeleteMission(m.id)}
                      className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 font-semibold text-rose-700 hover:bg-rose-100"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  className = "border-slate-200 bg-white text-slate-900",
}: {
  label: string;
  value: number;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${className}`}>
      <p className="text-sm opacity-80">{label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-sm font-medium text-slate-800">{value}</p>
    </div>
  );
}