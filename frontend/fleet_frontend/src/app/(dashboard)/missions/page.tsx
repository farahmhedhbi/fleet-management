"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { missionService } from "@/lib/services/missionService";
import { vehicleService } from "@/lib/services/vehicleService";
import { driverService } from "@/lib/services/driverService";
import type { Mission, MissionDTO } from "@/types/mission";
import type { Vehicle } from "@/types/vehicle";
import type { Driver } from "@/types/driver";
import MissionsView from "./MissionsView";

function minNowLocal() {
  const d = new Date();
  d.setSeconds(0, 0);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

export default function MissionsPage() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [openCreate, setOpenCreate] = useState(false);
  const [q, setQ] = useState("");

  const [form, setForm] = useState<MissionDTO>({
    title: "",
    description: "",
    departure: "",
    destination: "",
    startDate: "",
    endDate: "",
    vehicleId: 0,
    driverId: 0,
    routeJson: "",
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
      toast.error(e?.response?.data?.message || e?.message || "Failed to load data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return missions;

    return missions.filter((m) =>
      `${m.title} ${m.description ?? ""} ${m.departure} ${m.destination} ${m.status} ${m.driverName ?? ""} ${m.vehicleRegistrationNumber ?? ""}`
        .toLowerCase()
        .includes(query)
    );
  }, [missions, q]);

  const stats = useMemo(() => {
    return {
      total: missions.length,
      planned: missions.filter((m) => m.status === "PLANNED").length,
      inProgress: missions.filter((m) => m.status === "IN_PROGRESS").length,
      completed: missions.filter((m) => m.status === "COMPLETED").length,
    };
  }, [missions]);

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      departure: "",
      destination: "",
      startDate: "",
      endDate: "",
      vehicleId: 0,
      driverId: 0,
      routeJson: "",
    });
  };

  const submitCreate = async () => {
    if (!form.title.trim()) return toast.warn("Title is required");
    if (!form.departure.trim()) return toast.warn("Departure is required");
    if (!form.destination.trim()) return toast.warn("Destination is required");
    if (!form.startDate) return toast.warn("Start date is required");
    if (!form.endDate) return toast.warn("End date is required");
    if (!form.vehicleId) return toast.warn("Vehicle is required");
    if (!form.driverId) return toast.warn("Driver is required");

    if (new Date(form.endDate) <= new Date(form.startDate)) {
      return toast.warn("End date must be after start date");
    }

    setCreating(true);
    try {
      await missionService.create(form);
      toast.success("Mission created successfully");
      setOpenCreate(false);
      resetForm();
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
      toast.success("Mission deleted");
      await loadAll();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e?.message || "Delete failed");
    }
  };

  const cancelMission = async (id: number) => {
    if (!confirm("Cancel this mission?")) return;
    try {
      await missionService.cancel(id);
      toast.success("Mission canceled");
      await loadAll();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e?.message || "Cancel failed");
    }
  };

  return (
    <ProtectedRoute allowedRoles={["ROLE_OWNER", "ROLE_ADMIN"]}>
      <MissionsView
        missions={missions}
        vehicles={vehicles}
        drivers={drivers}
        filtered={filtered}
        loading={loading}
        refreshing={refreshing}
        creating={creating}
        openCreate={openCreate}
        setOpenCreate={setOpenCreate}
        q={q}
        setQ={setQ}
        form={form}
        setForm={setForm}
        stats={stats}
        minDateTime={minNowLocal()}
        onRefresh={loadAll}
        onSubmitCreate={submitCreate}
        onDeleteMission={deleteMission}
        onCancelMission={cancelMission}
      />
    </ProtectedRoute>
  );
}