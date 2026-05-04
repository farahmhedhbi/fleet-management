"use client";

import type { Dispatch, SetStateAction } from "react";
import type { Driver } from "@/types/driver";
import type { Vehicle } from "@/types/vehicle";
import type { Mission, MissionDTO } from "@/types/mission";
import type { PlaceSuggestion } from "@/lib/services/placeService";
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

function formatDateTime(value?: string) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

function filterButtonClass(active: boolean) {
  return active
    ? "inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm"
    : "inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50";
}

interface Props {
  missions: Mission[];
  vehicles: Vehicle[];
  drivers: Driver[];
  filtered: Mission[];
  loading: boolean;
  refreshing: boolean;
  creating: boolean;
  updating: boolean;
  openCreate: boolean;
  openEdit: boolean;
  setOpenCreate: Dispatch<SetStateAction<boolean>>;
  setOpenEdit: Dispatch<SetStateAction<boolean>>;
  q: string;
  setQ: Dispatch<SetStateAction<string>>;
  statusFilter: MissionStatusFilter;
  setStatusFilter: Dispatch<SetStateAction<MissionStatusFilter>>;
  form: MissionDTO;
  setForm: Dispatch<SetStateAction<MissionDTO>>;
  stats: {
    total: number;
    planned: number;
    inProgress: number;
    completed: number;
    canceled: number;
  };
  minDateTime: string;
  editingMissionId: number | null;
  onRefresh: () => void;
  onSubmitCreate: () => void;
  onSubmitUpdate: () => void;
  onStartEdit: (mission: Mission) => void;
  onDeleteMission: (id: number) => void;
  onCancelMission: (id: number) => void;
  departureSuggestions: PlaceSuggestion[];
  destinationSuggestions: PlaceSuggestion[];
  loadingDepartureSuggestions: boolean;
  loadingDestinationSuggestions: boolean;
  onPickDeparture: (value: string) => void;
  onPickDestination: (value: string) => void;
}

export default function MissionsView({
  filtered,
  loading,
  refreshing,
  creating,
  updating,
  openCreate,
  openEdit,
  setOpenCreate,
  setOpenEdit,
  q,
  setQ,
  statusFilter,
  setStatusFilter,
  form,
  setForm,
  stats,
  minDateTime,
  vehicles,
  drivers,
  editingMissionId,
  onRefresh,
  onSubmitCreate,
  onSubmitUpdate,
  onStartEdit,
  onDeleteMission,
  onCancelMission,
  departureSuggestions,
  destinationSuggestions,
  loadingDepartureSuggestions,
  loadingDestinationSuggestions,
  onPickDeparture,
  onPickDestination,
}: Props) {
  const filterItems = [
    { key: "ALL" as MissionStatusFilter, label: "All", count: stats.total, icon: ClipboardList },
    { key: "PLANNED" as MissionStatusFilter, label: "Planned", count: stats.planned, icon: Clock3 },
    { key: "IN_PROGRESS" as MissionStatusFilter, label: "In progress", count: stats.inProgress, icon: Route },
    { key: "COMPLETED" as MissionStatusFilter, label: "Completed", count: stats.completed, icon: CheckCircle2 },
    { key: "CANCELED" as MissionStatusFilter, label: "Canceled", count: stats.canceled, icon: Ban },
  ];

  const formBlock = (
    <div className="space-y-4">
      <input
        value={form.title}
        onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
        placeholder="Title"
        className="w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-slate-400"
      />

      <textarea
        value={form.description || ""}
        onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
        placeholder="Description"
        className="min-h-[110px] w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-slate-400"
      />

      <div className="grid gap-4 md:grid-cols-2">
        <div className="relative">
          <input
            value={form.departure}
            onChange={(e) => setForm((p) => ({ ...p, departure: e.target.value }))}
            placeholder="Departure"
            className="w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-slate-400"
            autoComplete="off"
          />

          {(loadingDepartureSuggestions || departureSuggestions.length > 0) && (
            <div className="absolute z-[1000] mt-1 max-h-56 w-full overflow-auto rounded-xl border border-slate-200 bg-white shadow-lg">
              {loadingDepartureSuggestions && (
                <div className="p-3 text-sm text-slate-500">Recherche...</div>
              )}

              {!loadingDepartureSuggestions &&
                departureSuggestions.map((item) => (
                  <button
                    type="button"
                    key={item.placeId}
                    onClick={() => onPickDeparture(item.value)}
                    className="block w-full border-b border-slate-100 px-3 py-2 text-left text-sm hover:bg-slate-50"
                  >
                    {item.label}
                  </button>
                ))}
            </div>
          )}
        </div>

        <div className="relative">
          <input
            value={form.destination}
            onChange={(e) => setForm((p) => ({ ...p, destination: e.target.value }))}
            placeholder="Destination"
            className="w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-slate-400"
            autoComplete="off"
          />

          {(loadingDestinationSuggestions || destinationSuggestions.length > 0) && (
            <div className="absolute z-[1000] mt-1 max-h-56 w-full overflow-auto rounded-xl border border-slate-200 bg-white shadow-lg">
              {loadingDestinationSuggestions && (
                <div className="p-3 text-sm text-slate-500">Recherche...</div>
              )}

              {!loadingDestinationSuggestions &&
                destinationSuggestions.map((item) => (
                  <button
                    type="button"
                    key={item.placeId}
                    onClick={() => onPickDestination(item.value)}
                    className="block w-full border-b border-slate-100 px-3 py-2 text-left text-sm hover:bg-slate-50"
                  >
                    {item.label}
                  </button>
                ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <input
          type="datetime-local"
          min={minDateTime}
          value={form.startDate || ""}
          onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))}
          className="w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-slate-400"
        />

        <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
          La date de fin sera estimée automatiquement à partir du trajet réel.
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <select
          value={form.vehicleId || ""}
          onChange={(e) =>
            setForm((p) => ({ ...p, vehicleId: Number(e.target.value) }))
          }
          className="w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-slate-400"
        >
          <option value="">Select available vehicle</option>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>
              {v.registrationNumber} {v.status ? `- ${v.status}` : ""}
            </option>
          ))}
        </select>

        <select
          value={form.driverId || ""}
          onChange={(e) =>
            setForm((p) => ({ ...p, driverId: Number(e.target.value) }))
          }
          className="w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-slate-400"
        >
          <option value="">Select available driver</option>
          {drivers.map((d) => (
            <option key={d.id} value={d.id}>
              {d.firstName} {d.lastName}
            </option>
          ))}
        </select>
      </div>
    </div>
  );

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
                Créez, filtrez et gérez les missions avec une édition autorisée uniquement pour les missions planifiées.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={onRefresh}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
              >
                <RefreshCcw className="h-4 w-4" />
                {refreshing ? "Refreshing..." : "Refresh"}
              </button>

              <button
                onClick={() => setOpenCreate(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 font-semibold text-white hover:bg-slate-800"
              >
                <Plus className="h-4 w-4" />
                New mission
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Total missions</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{stats.total}</p>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
            <p className="text-sm text-amber-700">Planned</p>
            <p className="mt-2 text-2xl font-bold text-amber-800">{stats.planned}</p>
          </div>

          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
            <p className="text-sm text-blue-700">In progress</p>
            <p className="mt-2 text-2xl font-bold text-blue-800">{stats.inProgress}</p>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
            <p className="text-sm text-emerald-700">Completed</p>
            <p className="mt-2 text-2xl font-bold text-emerald-800">{stats.completed}</p>
          </div>

          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 shadow-sm">
            <p className="text-sm text-rose-700">Canceled</p>
            <p className="mt-2 text-2xl font-bold text-rose-800">{stats.canceled}</p>
          </div>
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

        {openCreate && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-slate-900">Create mission</h2>
              <button
                onClick={() => setOpenCreate(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
            </div>

            {formBlock}

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={onSubmitCreate}
                disabled={creating}
                className="rounded-xl bg-slate-900 px-4 py-2 font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {creating ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        )}

        {openEdit && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-slate-900">
                Edit mission #{editingMissionId}
              </h2>
              <button
                onClick={() => setOpenEdit(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
            </div>

            {formBlock}

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={onSubmitUpdate}
                disabled={updating}
                className="rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {updating ? "Saving..." : "Save changes"}
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-sm text-slate-600 shadow-sm">
            Loading...
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
            <h3 className="text-lg font-bold text-slate-900">No missions found</h3>
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
                        <h3 className="text-lg font-bold text-slate-900">{m.title}</h3>
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
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Route
                      </p>
                      <p className="mt-1 text-sm font-medium text-slate-800">
                        {m.departure} → {m.destination}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Vehicle
                      </p>
                      <p className="mt-1 text-sm font-medium text-slate-800">
                        {m.vehicleRegistrationNumber || "—"}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Driver
                      </p>
                      <p className="mt-1 text-sm font-medium text-slate-800">
                        {m.driverName || "—"}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Planned start
                      </p>
                      <p className="mt-1 text-sm font-medium text-slate-800">
                        {formatDateTime(m.startDate)}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Estimated end
                      </p>
                      <p className="mt-1 text-sm font-medium text-slate-800">
                        {formatDateTime(m.endDate)}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Started at
                      </p>
                      <p className="mt-1 text-sm font-medium text-slate-800">
                        {formatDateTime(m.startedAt)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {canEdit && (
                      <button
                        onClick={() => onStartEdit(m)}
                        className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 font-semibold text-blue-700 hover:bg-blue-100"
                      >
                        <Pencil className="h-4 w-4" />
                        Edit
                      </button>
                    )}

                    {m.status !== "COMPLETED" && m.status !== "CANCELED" && (
                      <button
                        onClick={() => onCancelMission(m.id)}
                        className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 font-semibold text-amber-700 hover:bg-amber-100"
                      >
                        <XCircle className="h-4 w-4" />
                        Cancel
                      </button>
                    )}

                    <button
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