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
import { toast } from "react-toastify";

import MissionsView from "./MissionsView";

function toApiLocalDateTime(v: string) {
  if (!v) return v;
  return v.length === 16 ? `${v}:00` : v;
}

function minNowLocal() {
  const now = new Date();
  now.setSeconds(0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = now.getFullYear();
  const mm = pad(now.getMonth() + 1);
  const dd = pad(now.getDate());
  const hh = pad(now.getHours());
  const mi = pad(now.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

function driverLabel(d: Driver) {
  const name = `${d.firstName ?? ""} ${d.lastName ?? ""}`.trim();
  return name + (d.licenseNumber ? ` (${d.licenseNumber})` : "");
}

function vehicleLabel(v: Vehicle) {
  return `${v.registrationNumber ?? "—"} • ${v.brand ?? ""} ${v.model ?? ""}`.trim();
}

function getRoleNameFromUser(user: any): string {
  if (!user) return "";
  if (typeof user.role === "string") return user.role;
  if (typeof user.roleName === "string") return user.roleName;
  if (user.role && typeof user.role.name === "string") return user.role.name;
  return "";
}

function overlaps(
  aStartISO: string,
  aEndISO: string,
  bStartISO: string,
  bEndISO: string
) {
  const as = new Date(aStartISO).getTime();
  const ae = new Date(aEndISO).getTime();
  const bs = new Date(bStartISO).getTime();
  const be = new Date(bEndISO).getTime();

  if (
    Number.isNaN(as) ||
    Number.isNaN(ae) ||
    Number.isNaN(bs) ||
    Number.isNaN(be)
  ) {
    return false;
  }

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
      toast.error(
        e?.response?.data?.message || e?.message || "Failed to load missions"
      );
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
      const text = `${m.title ?? ""} ${m.description ?? ""} ${
        (m as any).vehicleRegistrationNumber ?? ""
      } ${(m as any).driverName ?? ""} ${(m as any).driverEmail ?? ""} ${
        m.status ?? ""
      }`.toLowerCase();

      return text.includes(query);
    });
  }, [missions, q]);

  const stats = useMemo(() => {
    const total = missions.length;
    const planned = missions.filter((m) => m.status === "PLANNED").length;
    const inProgress = missions.filter((m) => m.status === "IN_PROGRESS").length;
    const done = missions.filter((m) => m.status === "DONE").length;
    return { total, planned, inProgress, done };
  }, [missions]);

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

    const sISO = toApiLocalDateTime(form.startDate);
    const eISO = toApiLocalDateTime(form.endDate);

    const sTime = new Date(sISO).getTime();
    const eTime = new Date(eISO).getTime();

    if (Number.isNaN(sTime) || Number.isNaN(eTime)) {
      return toast.warn("Invalid dates");
    }

    const now = new Date();

    if (new Date(sISO) < now) {
      return toast.warn("Start date must be today or later.");
    }

    if (new Date(eISO) < now) {
      return toast.warn("End date must be today or later.");
    }

    if (new Date(eISO) <= new Date(sISO)) {
      return toast.warn("End date must be after start date");
    }

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
      <MissionsView
        canManage={canManage}
        missions={missions}
        vehicles={vehicles}
        drivers={drivers}
        filtered={filtered}
        loading={loading}
        refreshing={refreshing}
        q={q}
        setQ={setQ}
        stats={stats}
        form={form}
        setForm={setForm}
        openCreate={openCreate}
        creating={creating}
        busyVehicleIds={busyVehicleIds}
        busyDriverIds={busyDriverIds}
        minDateTime={minNowLocal()}
        onRefresh={loadAll}
        onOpenModal={openModal}
        onCloseModal={closeModal}
        onSubmitCreate={submitCreate}
        onDeleteMission={deleteMission}
        onUpdateStatus={updateStatus}
        driverLabel={driverLabel}
        vehicleLabel={vehicleLabel}
      />
    </ProtectedRoute>
  );
}