"use client";

import type { Dispatch, SetStateAction } from "react";
import type { Driver } from "@/types/driver";
import type { Vehicle } from "@/types/vehicle";
import type { Mission, MissionDTO } from "@/types/mission";
import type { PlaceSuggestion } from "@/lib/services/placeService";
import { Plus, RefreshCcw, Search, Trash2, XCircle } from "lucide-react";

function statusBadge(status?: string) {
  switch (status) {
    case "COMPLETED":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "IN_PROGRESS":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "CANCELED":
      return "bg-rose-50 text-rose-700 border-rose-200";
    default:
      return "bg-slate-50 text-slate-700 border-slate-200";
  }
}

function formatDateTime(value?: string) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

interface Props {
  missions: Mission[];
  vehicles: Vehicle[];
  drivers: Driver[];
  filtered: Mission[];
  loading: boolean;
  refreshing: boolean;
  creating: boolean;
  openCreate: boolean;
  setOpenCreate: Dispatch<SetStateAction<boolean>>;
  q: string;
  setQ: Dispatch<SetStateAction<string>>;
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
  onRefresh: () => void;
  onSubmitCreate: () => void;
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
  openCreate,
  setOpenCreate,
  q,
  setQ,
  form,
  setForm,
  stats,
  minDateTime,
  vehicles,
  drivers,
  onRefresh,
  onSubmitCreate,
  onDeleteMission,
  onCancelMission,
  departureSuggestions,
  destinationSuggestions,
  loadingDepartureSuggestions,
  loadingDestinationSuggestions,
  onPickDeparture,
  onPickDestination,
}: Props) {
  return (
    <div className="space-y-6 p-6 md:p-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Missions</h1>
          <p className="text-slate-600">
            Création et suivi des missions avec durée estimée automatiquement.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onRefresh}
            className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 font-bold"
          >
            <RefreshCcw className="h-4 w-4" />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>

          <button
            onClick={() => setOpenCreate(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 font-bold text-white"
          >
            <Plus className="h-4 w-4" />
            New mission
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <div className="rounded-2xl border bg-white p-4">Total: {stats.total}</div>
        <div className="rounded-2xl border bg-white p-4">Planned: {stats.planned}</div>
        <div className="rounded-2xl border bg-white p-4">In progress: {stats.inProgress}</div>
        <div className="rounded-2xl border bg-white p-4">Completed: {stats.completed}</div>
        <div className="rounded-2xl border bg-white p-4">Canceled: {stats.canceled}</div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search missions..."
          className="w-full rounded-2xl border bg-white py-3 pl-10 pr-4"
        />
      </div>

      {openCreate && (
        <div className="space-y-4 rounded-2xl border bg-white p-6">
          <h2 className="text-xl font-bold">Create mission</h2>

          <input
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            placeholder="Title"
            className="w-full rounded-xl border p-3"
          />

          <textarea
            value={form.description || ""}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            placeholder="Description"
            className="w-full rounded-xl border p-3"
          />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="relative">
              <input
                value={form.departure}
                onChange={(e) => setForm((p) => ({ ...p, departure: e.target.value }))}
                placeholder="Departure"
                className="w-full rounded-xl border p-3"
                autoComplete="off"
              />

              {(loadingDepartureSuggestions || departureSuggestions.length > 0) && (
                <div className="absolute z-[1000] mt-1 max-h-56 w-full overflow-auto rounded-xl border bg-white shadow-lg">
                  {loadingDepartureSuggestions && (
                    <div className="p-3 text-sm text-slate-500">Recherche...</div>
                  )}

                  {!loadingDepartureSuggestions &&
                    departureSuggestions.map((item) => (
                      <button
                        type="button"
                        key={item.placeId}
                        onClick={() => onPickDeparture(item.value)}
                        className="block w-full border-b px-3 py-2 text-left text-sm hover:bg-slate-50"
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
                className="w-full rounded-xl border p-3"
                autoComplete="off"
              />

              {(loadingDestinationSuggestions || destinationSuggestions.length > 0) && (
                <div className="absolute z-[1000] mt-1 max-h-56 w-full overflow-auto rounded-xl border bg-white shadow-lg">
                  {loadingDestinationSuggestions && (
                    <div className="p-3 text-sm text-slate-500">Recherche...</div>
                  )}

                  {!loadingDestinationSuggestions &&
                    destinationSuggestions.map((item) => (
                      <button
                        type="button"
                        key={item.placeId}
                        onClick={() => onPickDestination(item.value)}
                        className="block w-full border-b px-3 py-2 text-left text-sm hover:bg-slate-50"
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
              className="w-full rounded-xl border p-3"
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
              className="w-full rounded-xl border p-3"
            >
              <option value="">Select vehicle</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.registrationNumber}
                </option>
              ))}
            </select>

            <select
              value={form.driverId || ""}
              onChange={(e) =>
                setForm((p) => ({ ...p, driverId: Number(e.target.value) }))
              }
              className="w-full rounded-xl border p-3"
            >
              <option value="">Select driver</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.firstName} {d.lastName}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onSubmitCreate}
              disabled={creating}
              className="rounded-xl bg-slate-900 px-4 py-2 font-bold text-white"
            >
              {creating ? "Creating..." : "Create"}
            </button>

            <button
              onClick={() => setOpenCreate(false)}
              className="rounded-xl border px-4 py-2 font-bold"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border bg-white p-6">Loading...</div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((m) => (
            <div key={m.id} className="space-y-3 rounded-2xl border bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold">{m.title}</h3>
                  <p className="text-sm text-slate-600">{m.description || "—"}</p>
                </div>

                <span
                  className={`rounded-full border px-3 py-1 text-sm font-bold ${statusBadge(
                    m.status
                  )}`}
                >
                  {m.status}
                </span>
              </div>

              <div className="grid gap-2 text-sm text-slate-700 md:grid-cols-2">
                <div>
                  <strong>Route:</strong> {m.departure} → {m.destination}
                </div>
                <div>
                  <strong>Vehicle:</strong> {m.vehicleRegistrationNumber || "—"}
                </div>
                <div>
                  <strong>Driver:</strong> {m.driverName || "—"}
                </div>
                <div>
                  <strong>Planned start:</strong> {formatDateTime(m.startDate)}
                </div>
                <div>
                  <strong>Estimated end:</strong> {formatDateTime(m.endDate)}
                </div>
                <div>
                  <strong>Started at:</strong> {formatDateTime(m.startedAt)}
                </div>
                <div>
                  <strong>Finished at:</strong> {formatDateTime(m.finishedAt)}
                </div>
              </div>

              <div className="flex gap-2">
                {m.status !== "COMPLETED" && m.status !== "CANCELED" && (
                  <button
                    onClick={() => onCancelMission(m.id)}
                    className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 font-bold text-amber-700"
                  >
                    <XCircle className="h-4 w-4" />
                    Cancel
                  </button>
                )}

                <button
                  onClick={() => onDeleteMission(m.id)}
                  className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 font-bold text-rose-700"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}