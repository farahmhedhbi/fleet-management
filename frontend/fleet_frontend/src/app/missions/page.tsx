"use client";

import { useEffect, useMemo, useState } from "react";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { useAuth } from "@/contexts/authContext";
import { vehicleService } from "@/lib/services/vehicleService";
import { driverService } from "@/lib/services/driverService";
import { missionService } from "@/lib/services/missionService";
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
import { toast } from "react-toastify";

function cn(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

function toApiLocalDateTime(v: string) {
  // input type="datetime-local" => "YYYY-MM-DDTHH:mm"
  if (!v) return v;
  return v.length === 16 ? `${v}:00` : v;
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

function driverLabel(d: Driver) {
  const name = `${d.firstName ?? ""} ${d.lastName ?? ""}`.trim();
  return name + (d.licenseNumber ? ` (${d.licenseNumber})` : "");
}

function vehicleLabel(v: Vehicle) {
  return `${v.registrationNumber ?? "—"} • ${v.brand ?? ""} ${v.model ?? ""}`.trim();
}

// ✅ robust role name
function getRoleNameFromUser(user: any): string {
  if (!user) return "";
  if (typeof user.role === "string") return user.role;
  if (typeof user.roleName === "string") return user.roleName;
  if (user.role && typeof user.role.name === "string") return user.role.name;
  return "";
}

// ✅ interval overlap: [aStart,aEnd] with [bStart,bEnd]
function overlaps(aStartISO: string, aEndISO: string, bStartISO: string, bEndISO: string) {
  const as = new Date(aStartISO).getTime();
  const ae = new Date(aEndISO).getTime();
  const bs = new Date(bStartISO).getTime();
  const be = new Date(bEndISO).getTime();
  if (Number.isNaN(as) || Number.isNaN(ae) || Number.isNaN(bs) || Number.isNaN(be)) return false;
  return as < be && ae > bs;
}

export default function MissionsPage() {
  const { user } = useAuth();

  const roleName = useMemo(() => getRoleNameFromUser(user), [user]);
  const canManage = roleName === "ROLE_OWNER" || roleName === "ROLE_ADMIN";

  const [missions, setMissions] = useState<Mission[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [q, setQ] = useState("");

  // modal
  const [openCreate, setOpenCreate] = useState(false);
  const [creating, setCreating] = useState(false);

  const [form, setForm] = useState<MissionDTO>({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    vehicleId: 0 as any,
    driverId: 0 as any,
    status: "PLANNED",
  });

  const loadAll = async () => {
    setRefreshing(true);
    try {
      const [ms, vs, ds] = await Promise.all([
        missionService.getAll(),
        vehicleService.getAll(),
        driverService.getAll(),
      ]);
      setMissions(ms);
      setVehicles(vs);
      setDrivers(ds);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.response?.data?.message || e?.message || "Failed to load missions");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return missions;

    return missions.filter((m) => {
      const t = `${m.title ?? ""} ${m.description ?? ""} ${m.vehicleRegistrationNumber ?? ""} ${m.driverName ?? ""} ${m.driverEmail ?? ""} ${m.status ?? ""}`.toLowerCase();
      return t.includes(query);
    });
  }, [missions, q]);

  const stats = useMemo(() => {
    const total = missions.length;
    const planned = missions.filter((m) => m.status === "PLANNED").length;
    const inProgress = missions.filter((m) => m.status === "IN_PROGRESS").length;
    const done = missions.filter((m) => m.status === "DONE").length;
    return { total, planned, inProgress, done };
  }, [missions]);

  // ✅ Compute busy sets based on selected form dates (ignore DONE/CANCELED)
  const busyVehicleIds = useMemo(() => {
    if (!form.startDate || !form.endDate) return new Set<number>();
    const s = toApiLocalDateTime(form.startDate);
    const e = toApiLocalDateTime(form.endDate);

    const set = new Set<number>();
    missions.forEach((m: any) => {
      if (m.status === "DONE" || m.status === "CANCELED") return;
      if (!m.startDate || !m.endDate) return;
      if (overlaps(s, e, m.startDate, m.endDate)) {
        if (m.vehicleId) set.add(Number(m.vehicleId));
      }
    });
    return set;
  }, [missions, form.startDate, form.endDate]);

  const busyDriverIds = useMemo(() => {
    if (!form.startDate || !form.endDate) return new Set<number>();
    const s = toApiLocalDateTime(form.startDate);
    const e = toApiLocalDateTime(form.endDate);

    const set = new Set<number>();
    missions.forEach((m: any) => {
      if (m.status === "DONE" || m.status === "CANCELED") return;
      if (!m.startDate || !m.endDate) return;
      if (overlaps(s, e, m.startDate, m.endDate)) {
        if (m.driverId) set.add(Number(m.driverId));
      }
    });
    return set;
  }, [missions, form.startDate, form.endDate]);

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      startDate: "",
      endDate: "",
      vehicleId: 0 as any,
      driverId: 0 as any,
      status: "PLANNED",
    });
  };

  const openModal = () => {
    resetForm();
    setOpenCreate(true);
  };

  const closeModal = () => {
    setOpenCreate(false);
    setCreating(false);
  };

  const submitCreate = async () => {
    if (!form.title?.trim()) return toast.warn("Title is required.");
    if (!form.startDate) return toast.warn("Start date is required.");
    if (!form.endDate) return toast.warn("End date is required.");
    if (!form.vehicleId) return toast.warn("Vehicle is required.");
    if (!form.driverId) return toast.warn("Driver is required.");

    // ✅ quick local validation
    const sISO = toApiLocalDateTime(form.startDate);
    const eISO = toApiLocalDateTime(form.endDate);
    if (!new Date(eISO).getTime() || !new Date(sISO).getTime()) return toast.warn("Invalid dates");
    if (new Date(eISO) <= new Date(sISO)) return toast.warn("End date must be after start date");

    if (busyVehicleIds.has(Number(form.vehicleId))) {
      return toast.error("This vehicle is busy in the selected period.");
    }
    if (busyDriverIds.has(Number(form.driverId))) {
      return toast.error("This driver is busy in the selected period.");
    }

    setCreating(true);
    try {
      const payload: MissionDTO = {
        ...form,
        startDate: sISO,
        endDate: eISO,
        vehicleId: Number(form.vehicleId),
        driverId: Number(form.driverId),
      };

      await missionService.create(payload);
      toast.success("Mission created ✅");
      closeModal();
      await loadAll();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.response?.data?.message || e?.message || "Create failed");
    } finally {
      setCreating(false);
    }
  };

  const deleteMission = async (id: number) => {
    if (!confirm("Delete this mission?")) return;
    try {
      await missionService.remove(id);
      toast.success("Mission deleted ✅");
      await loadAll();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.response?.data?.message || e?.message || "Delete failed");
    }
  };

  const updateStatus = async (id: number, status: MissionStatus) => {
    try {
      await missionService.updateStatus(id, status);
      toast.success("Status updated ✅");
      await loadAll();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.response?.data?.message || e?.message || "Update failed");
    }
  };

  return (
    <ProtectedRoute requiredRoles={["ROLE_OWNER", "ROLE_ADMIN"]}>
      <div className="p-6 md:p-10 space-y-6">
        {/* header */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
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
              onClick={loadAll}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-all"
            >
              <RefreshCcw className={refreshing ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
              Refresh
            </button>

            {canManage && (
              <button
                onClick={openModal}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 px-4 py-2 text-sm font-extrabold text-white shadow-md hover:shadow-lg transition-all"
              >
                <Plus className="h-4 w-4" />
                Create Mission
              </button>
            )}
          </div>
        </div>

        {/* stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
              <ClipboardList className="h-4 w-4" /> Total
            </div>
            <div className="mt-2 text-3xl font-extrabold text-slate-900">{stats.total}</div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg">
            <div className="text-sm font-semibold text-slate-600">Planned</div>
            <div className="mt-2 text-3xl font-extrabold text-slate-900">{stats.planned}</div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg">
            <div className="text-sm font-semibold text-slate-600">In Progress</div>
            <div className="mt-2 text-3xl font-extrabold text-slate-900">{stats.inProgress}</div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg">
            <div className="text-sm font-semibold text-slate-600">Done</div>
            <div className="mt-2 text-3xl font-extrabold text-slate-900">{stats.done}</div>
          </div>
        </div>

        {/* search */}
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

        {/* list */}
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filtered.map((m) => (
              <div key={m.id} className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
                <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-lg font-extrabold truncate">{m.title || "—"}</div>
                      <div className="mt-1 text-xs text-white/80 flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5" />
                        <span className="truncate">
                          {new Date(m.startDate).toLocaleString()} → {new Date(m.endDate).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <span className={cn("shrink-0 rounded-full border px-3 py-1 text-xs font-bold", statusBadge(m.status))}>
                      {statusLabel(m.status)}
                    </span>
                  </div>
                </div>

                <div className="p-5 space-y-3">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                      <Car className="h-4 w-4" />
                      Vehicle
                    </div>
                    <div className="mt-1 text-sm text-slate-900 font-semibold">
                      {m.vehicleRegistrationNumber || `#${m.vehicleId}`}
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="text-sm font-bold text-slate-700">Driver</div>
                    <div className="mt-1 text-sm text-slate-900 font-semibold">
                      {m.driverName || `#${m.driverId}`}
                    </div>
                    {m.driverEmail && <div className="text-sm text-slate-600">{m.driverEmail}</div>}
                  </div>

                  {m.description && (
                    <div className="text-sm text-slate-700">
                      <span className="font-bold text-slate-900">Notes: </span>
                      {m.description}
                    </div>
                  )}

                  <div className="pt-2 flex flex-col sm:flex-row gap-2">
                  

                    <button
                      onClick={() => deleteMission(m.id)}
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

        {/* Create Modal */}
        {openCreate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40" onClick={closeModal} />

            <div className="relative w-full max-w-2xl rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
              <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-xl font-extrabold">Create Mission</div>
                    <div className="text-sm text-white/80">
                      Choose vehicle + driver + dates
                    </div>
                  </div>

                  <button
                    onClick={closeModal}
                    className="rounded-xl border border-white/20 bg-white/10 p-2 hover:bg-white/20 transition"
                    aria-label="Close"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-bold text-slate-700">Title</label>
                    <input
                      value={form.title}
                      onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ex: Livraison Ariana"
                      disabled={creating}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-bold text-slate-700">Status</label>
                    <select
                      value={form.status || "PLANNED"}
                      onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as MissionStatus }))}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={creating}
                    >
                      <option value="PLANNED">Planned</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="DONE">Done</option>
                      <option value="CANCELED">Canceled</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-bold text-slate-700">Start Date</label>
                    <input
                      type="datetime-local"
                      value={form.startDate}
                      onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={creating}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-bold text-slate-700">End Date</label>
                    <input
                      type="datetime-local"
                      value={form.endDate}
                      onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))}
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
                    <label className="text-sm font-bold text-slate-700">Description (optional)</label>
                    <textarea
                      value={form.description ?? ""}
                      onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                      className="mt-1 w-full min-h-[90px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Notes, destination, contacts…"
                      disabled={creating}
                    />
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-end">
                  <button
                    onClick={closeModal}
                    disabled={creating}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </button>

                  <button
                    onClick={submitCreate}
                    disabled={creating}
                    className={cn(
                      "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-extrabold text-white shadow-md hover:shadow-lg transition-all",
                      creating
                        ? "bg-slate-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600"
                    )}
                  >
                    <CheckCircle className={creating ? "h-4 w-4 animate-pulse" : "h-4 w-4"} />
                    {creating ? "Creating..." : "Create"}
                  </button>
                </div>

                {/* hint */}
                {(form.startDate && form.endDate) && (
                  <div className="text-xs font-semibold text-slate-500">
                    Busy options are disabled based on existing missions (status not DONE/CANCELED).
                    Backend will also block conflicts.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}