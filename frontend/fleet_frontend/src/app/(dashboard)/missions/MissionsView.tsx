"use client";

import type { Dispatch, SetStateAction } from "react";
import type { Vehicle } from "@/types/vehicle";
import type { Driver } from "@/types/driver";
import type { Mission, MissionDTO, MissionStatus } from "@/types/mission";
import {
  Calendar,
  Car,
  CheckCircle,
  ClipboardList,
  Plus,
  RefreshCcw,
  Search,
  X,
  Trash2,
} from "lucide-react";

function cn(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

function statusBadge(status?: MissionStatus) {
  const s = String(status || "PLANNED");
  if (s === "DONE") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (s === "IN_PROGRESS") return "bg-blue-50 text-blue-700 border-blue-200";
  if (s === "CANCELED") return "bg-rose-50 text-rose-700 border-rose-200";
  return "bg-slate-50 text-slate-700 border-slate-200";
}

function statusLabel(s: MissionStatus) {
  if (s === "PLANNED") return "Planned";
  if (s === "IN_PROGRESS") return "In Progress";
  if (s === "DONE") return "Done";
  return "Canceled";
}

interface MissionsViewProps {
  canManage: boolean;
  missions: Mission[];
  vehicles: Vehicle[];
  drivers: Driver[];
  filtered: Mission[];
  loading: boolean;
  refreshing: boolean;
  q: string;
  setQ: Dispatch<SetStateAction<string>>;
  stats: {
    total: number;
    planned: number;
    inProgress: number;
    done: number;
  };
  form: MissionDTO;
  setForm: Dispatch<SetStateAction<MissionDTO>>;
  openCreate: boolean;
  creating: boolean;
  busyVehicleIds: Set<number>;
  busyDriverIds: Set<number>;
  minDateTime: string;
  onRefresh: () => void;
  onOpenModal: () => void;
  onCloseModal: () => void;
  onSubmitCreate: () => void;
  onDeleteMission: (id: number) => void;
  onUpdateStatus: (id: number, status: MissionStatus) => void;
  driverLabel: (driver: Driver) => string;
  vehicleLabel: (vehicle: Vehicle) => string;
}

export default function MissionsView({
  canManage,
  filtered,
  vehicles,
  drivers,
  loading,
  refreshing,
  q,
  setQ,
  stats,
  form,
  setForm,
  openCreate,
  creating,
  busyVehicleIds,
  busyDriverIds,
  minDateTime,
  onRefresh,
  onOpenModal,
  onCloseModal,
  onSubmitCreate,
  onDeleteMission,
  driverLabel,
  vehicleLabel,
}: MissionsViewProps) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Missions
            </h1>
            <p className="mt-1 text-slate-600">
              Create and manage missions (vehicle ↔ driver) with dates.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-all"
            >
              <RefreshCcw className={refreshing ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
              Refresh
            </button>

            {canManage && (
              <button
                onClick={onOpenModal}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 px-4 py-2 text-sm font-extrabold text-white shadow-md hover:shadow-lg transition-all"
              >
                <Plus className="h-4 w-4" />
                Create Mission
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
              <ClipboardList className="h-4 w-4" />
              Total
            </div>
            <div className="mt-2 text-3xl font-extrabold text-slate-900">
              {stats.total}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg">
            <div className="text-sm font-semibold text-slate-600">Planned</div>
            <div className="mt-2 text-3xl font-extrabold text-slate-900">
              {stats.planned}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg">
            <div className="text-sm font-semibold text-slate-600">In Progress</div>
            <div className="mt-2 text-3xl font-extrabold text-slate-900">
              {stats.inProgress}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg">
            <div className="text-sm font-semibold text-slate-600">Done</div>
            <div className="mt-2 text-3xl font-extrabold text-slate-900">
              {stats.done}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-slate-200 bg-white p-2">
              <Search className="h-4 w-4 text-slate-600" />
            </div>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search missions (title, vehicle, driver, status...)"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg animate-pulse">
            <div className="h-5 w-48 rounded bg-slate-200" />
            <div className="mt-3 h-4 w-72 rounded bg-slate-200" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
            <div className="text-lg font-bold text-slate-900">No missions found</div>
            <div className="mt-1 text-slate-600">
              Create your first mission to start planning operations.
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {filtered.map((m) => (
              <div
                key={m.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg"
              >
                <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-5 text-white">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-lg font-extrabold">
                        {m.title || "—"}
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-white/80">
                        <Calendar className="h-3.5 w-3.5" />
                        <span className="truncate">
                          {new Date(m.startDate).toLocaleString()} →{" "}
                          {new Date(m.endDate).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <span
                      className={cn(
                        "shrink-0 rounded-full border px-3 py-1 text-xs font-bold",
                        statusBadge(m.status)
                      )}
                    >
                      {statusLabel(m.status)}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 p-5">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                      <Car className="h-4 w-4" />
                      Vehicle
                    </div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">
                      {(m as any).vehicleRegistrationNumber || `#${(m as any).vehicleId}`}
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="text-sm font-bold text-slate-700">Driver</div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">
                      {(m as any).driverName || `#${(m as any).driverId}`}
                    </div>
                    {(m as any).driverEmail && (
                      <div className="text-sm text-slate-600">
                        {(m as any).driverEmail}
                      </div>
                    )}
                  </div>

                  {m.description && (
                    <div className="text-sm text-slate-700">
                      <span className="font-bold text-slate-900">Notes: </span>
                      {m.description}
                    </div>
                  )}

                  <div className="flex flex-col gap-2 pt-2 sm:flex-row">
                    <button
                      onClick={() => onDeleteMission((m as any).id)}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100 transition-all"
                      title="Delete mission"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {openCreate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40" onClick={onCloseModal} />

            <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
              <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 text-white">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-xl font-extrabold">Create Mission</div>
                    <div className="text-sm text-white/80">
                      Choose vehicle + driver + dates
                    </div>
                  </div>

                  <button
                    onClick={onCloseModal}
                    className="rounded-xl border border-white/20 bg-white/10 p-2 hover:bg-white/20 transition"
                    aria-label="Close"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="space-y-4 p-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-bold text-slate-700">Title</label>
                    <input
                      value={form.title}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, title: e.target.value }))
                      }
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ex: Livraison Ariana"
                      disabled={creating}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-bold text-slate-700">Status</label>
                    <select
                      value={form.status || "PLANNED"}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          status: e.target.value as MissionStatus,
                        }))
                      }
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={creating}
                    >
                      <option value="PLANNED">Planned</option>
                     
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-bold text-slate-700">Start Date</label>
                    <input
                      type="datetime-local"
                      value={form.startDate}
                      min={minDateTime}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, startDate: e.target.value }))
                      }
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={creating}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-bold text-slate-700">End Date</label>
                    <input
                      type="datetime-local"
                      value={form.endDate}
                      min={minDateTime}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, endDate: e.target.value }))
                      }
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={creating}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-sm font-bold text-slate-700">Vehicle</label>
                    <select
                      value={form.vehicleId || ""}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          vehicleId: e.target.value ? Number(e.target.value) : (0 as any),
                        }))
                      }
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={creating}
                    >
                      <option value="">— Choose a vehicle —</option>
                      {vehicles.map((v: any) => {
                        const busy = busyVehicleIds.has(Number(v.id));
                        return (
                          <option key={v.id} value={v.id} disabled={busy}>
                            {vehicleLabel(v)} {busy ? " — (Busy)" : ""}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-sm font-bold text-slate-700">Driver</label>
                    <select
                      value={form.driverId || ""}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          driverId: e.target.value ? Number(e.target.value) : (0 as any),
                        }))
                      }
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={creating}
                    >
                      <option value="">— Choose a driver —</option>
                      {drivers.map((d: any) => {
                        const busy = busyDriverIds.has(Number(d.id));
                        return (
                          <option key={d.id} value={d.id} disabled={busy}>
                            {driverLabel(d)} {busy ? " — (Busy)" : ""}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-sm font-bold text-slate-700">
                      Description (optional)
                    </label>
                    <textarea
                      value={form.description ?? ""}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, description: e.target.value }))
                      }
                      className="mt-1 min-h-[90px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Notes, destination, contacts…"
                      disabled={creating}
                    />
                  </div>
                </div>

                <div className="flex flex-col justify-end gap-3 pt-2 sm:flex-row">
                  <button
                    onClick={onCloseModal}
                    disabled={creating}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </button>

                  <button
                    onClick={onSubmitCreate}
                    disabled={creating}
                    className={cn(
                      "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-extrabold text-white shadow-md hover:shadow-lg transition-all",
                      creating
                        ? "cursor-not-allowed bg-slate-400"
                        : "bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600"
                    )}
                  >
                    <CheckCircle className={creating ? "h-4 w-4 animate-pulse" : "h-4 w-4"} />
                    {creating ? "Creating..." : "Create"}
                  </button>
                </div>

                {form.startDate && form.endDate && (
                  <div className="text-xs font-semibold text-slate-500">
                    Busy options are disabled based on existing missions (status not
                    DONE/CANCELED). Backend will also block conflicts.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}