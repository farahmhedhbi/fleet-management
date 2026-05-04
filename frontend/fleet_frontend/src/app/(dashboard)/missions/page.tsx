"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { missionService } from "@/lib/services/missionService";
import { vehicleService } from "@/lib/services/vehicleService";
import { driverService } from "@/lib/services/driverService";
import { placeService, type PlaceSuggestion } from "@/lib/services/placeService";
import type { Mission, MissionDTO } from "@/types/mission";
import type { Vehicle } from "@/types/vehicle";
import type { Driver } from "@/types/driver";
import MissionsView from "./MissionsView";

type MissionStatusFilter =
  | "ALL"
  | "PLANNED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELED";

function minNowLocal() {
  const d = new Date();
  d.setSeconds(0, 0);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

function toInputDateTime(value?: string | null) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

function rangesOverlap(
  aStart?: string,
  aEnd?: string,
  bStart?: string,
  bEnd?: string
) {
  if (!aStart || !aEnd || !bStart || !bEnd) return false;

  const as = new Date(aStart).getTime();
  const ae = new Date(aEnd).getTime();
  const bs = new Date(bStart).getTime();
  const be = new Date(bEnd).getTime();

  if ([as, ae, bs, be].some(Number.isNaN)) return false;

  return as < be && ae > bs;
}

function isDriverLicenseValidForMission(driver: Driver, missionEnd?: string) {
  if (driver.status !== "ACTIVE") return false;
  if (!driver.licenseExpiry) return false;
  if (!missionEnd) return true;

  const expiry = new Date(driver.licenseExpiry).getTime();
  const end = new Date(missionEnd).getTime();

  if (Number.isNaN(expiry) || Number.isNaN(end)) return false;

  return expiry > end;
}

const emptyForm: MissionDTO = {
  title: "",
  description: "",
  departure: "",
  destination: "",
  startDate: "",
  vehicleId: 0,
  driverId: 0,
};

export default function MissionsPage() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editingMissionId, setEditingMissionId] = useState<number | null>(null);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<MissionStatusFilter>("ALL");
  const [form, setForm] = useState<MissionDTO>(emptyForm);

  const [departureSuggestions, setDepartureSuggestions] = useState<
    PlaceSuggestion[]
  >([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState<
    PlaceSuggestion[]
  >([]);
  const [loadingDepartureSuggestions, setLoadingDepartureSuggestions] =
    useState(false);
  const [loadingDestinationSuggestions, setLoadingDestinationSuggestions] =
    useState(false);

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
        e?.response?.data?.message ||
          e?.response?.data?.error ||
          e?.message ||
          "Failed to load data"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const estimatedCreateEnd = useMemo(() => {
    if (!form.startDate) return "";

    const d = new Date(form.startDate);
    if (Number.isNaN(d.getTime())) return "";

    // Estimation front simple فقط للفلترة.
    // Backend يحسب الوقت الحقيقي بالـ RoutePlannerService.
    d.setHours(d.getHours() + 2);
    return d.toISOString();
  }, [form.startDate]);

  const unavailableVehicleIds = useMemo(() => {
    return new Set(
      missions
        .filter((m) => {
          if (m.status === "IN_PROGRESS") return true;

          if (m.status === "PLANNED") {
            return rangesOverlap(
              form.startDate,
              estimatedCreateEnd,
              m.startDate,
              m.endDate
            );
          }

          return false;
        })
        .map((m) => m.vehicleId)
        .filter((id): id is number => Boolean(id))
    );
  }, [missions, form.startDate, estimatedCreateEnd]);

  const unavailableDriverIds = useMemo(() => {
    return new Set(
      missions
        .filter((m) => {
          if (m.status === "IN_PROGRESS") return true;

          if (m.status === "PLANNED") {
            return rangesOverlap(
              form.startDate,
              estimatedCreateEnd,
              m.startDate,
              m.endDate
            );
          }

          return false;
        })
        .map((m) => m.driverId)
        .filter((id): id is number => Boolean(id))
    );
  }, [missions, form.startDate, estimatedCreateEnd]);

  const vehiclesForForm = useMemo(() => {
    if (openEdit) return vehicles;

    return vehicles.filter(
      (v) => v.status === "AVAILABLE" && !unavailableVehicleIds.has(v.id)
    );
  }, [vehicles, unavailableVehicleIds, openEdit]);

  const driversForForm = useMemo(() => {
    if (openEdit) return drivers;

    return drivers.filter(
      (d) =>
        !unavailableDriverIds.has(d.id) &&
        isDriverLicenseValidForMission(d, estimatedCreateEnd)
    );
  }, [drivers, unavailableDriverIds, estimatedCreateEnd, openEdit]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();

    return missions.filter((m) => {
      const matchesStatus =
        statusFilter === "ALL" ? true : m.status === statusFilter;

      const matchesSearch = !query
        ? true
        : `${m.title} ${m.description ?? ""} ${m.departure} ${
            m.destination
          } ${m.status} ${m.driverName ?? ""} ${
            m.vehicleRegistrationNumber ?? ""
          }`
            .toLowerCase()
            .includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [missions, q, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: missions.length,
      planned: missions.filter((m) => m.status === "PLANNED").length,
      inProgress: missions.filter((m) => m.status === "IN_PROGRESS").length,
      completed: missions.filter((m) => m.status === "COMPLETED").length,
      canceled: missions.filter((m) => m.status === "CANCELED").length,
    };
  }, [missions]);

  const resetForm = () => {
    setForm(emptyForm);
    setDepartureSuggestions([]);
    setDestinationSuggestions([]);
    setEditingMissionId(null);
  };

  const submitCreate = async () => {
    if (!form.title.trim()) return toast.warn("Title is required");
    if (!form.departure.trim()) return toast.warn("Departure is required");
    if (!form.destination.trim()) return toast.warn("Destination is required");
    if (!form.startDate) return toast.warn("Start date is required");
    if (!form.vehicleId) return toast.warn("Vehicle is required");
    if (!form.driverId) return toast.warn("Driver is required");

    setCreating(true);

    try {
      await missionService.create(form);
      toast.success("Mission created successfully");
      setOpenCreate(false);
      resetForm();
      await loadAll();
    } catch (e: any) {
      console.error(e);
      toast.error(
        e?.response?.data?.message ||
          e?.response?.data?.error ||
          e?.message ||
          "Create failed"
      );
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (mission: Mission) => {
    if (mission.status !== "PLANNED") {
      toast.warn("Only planned missions can be edited");
      return;
    }

    setEditingMissionId(mission.id);
    setForm({
      title: mission.title || "",
      description: mission.description || "",
      departure: mission.departure || "",
      destination: mission.destination || "",
      startDate: toInputDateTime(mission.startDate),
      vehicleId: mission.vehicleId || 0,
      driverId: mission.driverId || 0,
    });

    setOpenEdit(true);
    setOpenCreate(false);
  };

  const submitUpdate = async () => {
    if (!editingMissionId) return toast.warn("No mission selected");
    if (!form.title.trim()) return toast.warn("Title is required");
    if (!form.departure.trim()) return toast.warn("Departure is required");
    if (!form.destination.trim()) return toast.warn("Destination is required");
    if (!form.startDate) return toast.warn("Start date is required");
    if (!form.vehicleId) return toast.warn("Vehicle is required");
    if (!form.driverId) return toast.warn("Driver is required");

    setUpdating(true);

    try {
      await missionService.update(editingMissionId, form);
      toast.success("Mission updated successfully");
      setOpenEdit(false);
      resetForm();
      await loadAll();
    } catch (e: any) {
      console.error(e);
      toast.error(
        e?.response?.data?.message ||
          e?.response?.data?.error ||
          e?.message ||
          "Update failed"
      );
    } finally {
      setUpdating(false);
    }
  };

  const deleteMission = async (id: number) => {
    if (!confirm("Delete this mission?")) return;

    try {
      await missionService.remove(id);
      toast.success("Mission deleted");
      await loadAll();
    } catch (e: any) {
      console.error(e);
      toast.error(
        e?.response?.data?.message ||
          e?.response?.data?.error ||
          e?.message ||
          "Delete failed"
      );
    }
  };

  const cancelMission = async (id: number) => {
    if (!confirm("Cancel this mission?")) return;

    try {
      await missionService.cancel(id);
      toast.success("Mission canceled");
      await loadAll();
    } catch (e: any) {
      console.error(e);
      toast.error(
        e?.response?.data?.message ||
          e?.response?.data?.error ||
          e?.message ||
          "Cancel failed"
      );
    }
  };

  useEffect(() => {
    const query = form.departure?.trim();

    if ((!openCreate && !openEdit) || !query || query.length < 2) {
      setDepartureSuggestions([]);
      return;
    }

    const timer = window.setTimeout(async () => {
      try {
        setLoadingDepartureSuggestions(true);
        const results = await placeService.search(query);
        setDepartureSuggestions(results);
      } catch (e) {
        console.error(e);
        setDepartureSuggestions([]);
      } finally {
        setLoadingDepartureSuggestions(false);
      }
    }, 350);

    return () => window.clearTimeout(timer);
  }, [form.departure, openCreate, openEdit]);

  useEffect(() => {
    const query = form.destination?.trim();

    if ((!openCreate && !openEdit) || !query || query.length < 2) {
      setDestinationSuggestions([]);
      return;
    }

    const timer = window.setTimeout(async () => {
      try {
        setLoadingDestinationSuggestions(true);
        const results = await placeService.search(query);
        setDestinationSuggestions(results);
      } catch (e) {
        console.error(e);
        setDestinationSuggestions([]);
      } finally {
        setLoadingDestinationSuggestions(false);
      }
    }, 350);

    return () => window.clearTimeout(timer);
  }, [form.destination, openCreate, openEdit]);

  return (
    <ProtectedRoute allowedRoles={["ROLE_OWNER"]}>
      <MissionsView
        missions={missions}
        vehicles={vehiclesForForm}
        drivers={driversForForm}
        filtered={filtered}
        loading={loading}
        refreshing={refreshing}
        creating={creating}
        updating={updating}
        openCreate={openCreate}
        openEdit={openEdit}
        setOpenCreate={(value) => {
          setOpenCreate(value);

          if (value) {
            setOpenEdit(false);
            resetForm();
          }
        }}
        setOpenEdit={(value) => {
          setOpenEdit(value);

          if (!value) {
            resetForm();
          }
        }}
        q={q}
        setQ={setQ}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        form={form}
        setForm={setForm}
        stats={stats}
        minDateTime={minNowLocal()}
        editingMissionId={editingMissionId}
        onRefresh={loadAll}
        onSubmitCreate={submitCreate}
        onSubmitUpdate={submitUpdate}
        onStartEdit={startEdit}
        onDeleteMission={deleteMission}
        onCancelMission={cancelMission}
        departureSuggestions={departureSuggestions}
        destinationSuggestions={destinationSuggestions}
        loadingDepartureSuggestions={loadingDepartureSuggestions}
        loadingDestinationSuggestions={loadingDestinationSuggestions}
        onPickDeparture={(value) => {
          setForm((p) => ({ ...p, departure: value }));
          setDepartureSuggestions([]);
        }}
        onPickDestination={(value) => {
          setForm((p) => ({ ...p, destination: value }));
          setDestinationSuggestions([]);
        }}
      />
    </ProtectedRoute>
  );
}