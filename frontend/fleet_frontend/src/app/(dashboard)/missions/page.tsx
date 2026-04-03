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

function minNowLocal() {
  const d = new Date();
  d.setSeconds(0, 0);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
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
  const [openCreate, setOpenCreate] = useState(false);
  const [q, setQ] = useState("");
  const [form, setForm] = useState<MissionDTO>(emptyForm);

  const [departureSuggestions, setDepartureSuggestions] = useState<PlaceSuggestion[]>([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState<PlaceSuggestion[]>([]);
  const [loadingDepartureSuggestions, setLoadingDepartureSuggestions] = useState(false);
  const [loadingDestinationSuggestions, setLoadingDestinationSuggestions] = useState(false);

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
      canceled: missions.filter((m) => m.status === "CANCELED").length,
    };
  }, [missions]);

  const resetForm = () => {
    setForm(emptyForm);
    setDepartureSuggestions([]);
    setDestinationSuggestions([]);
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

    if (!openCreate || !query || query.length < 2) {
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
  }, [form.departure, openCreate]);

  useEffect(() => {
    const query = form.destination?.trim();

    if (!openCreate || !query || query.length < 2) {
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
  }, [form.destination, openCreate]);

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