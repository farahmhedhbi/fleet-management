"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { gpsService } from "@/lib/services/gpsService";
import type { GpsData, VehicleEventDTO, VehicleLiveStatusDTO } from "@/types/gps";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { toast } from "react-toastify";

const FleetLiveMap = dynamic(() => import("@/components/gps/FleetLiveMap"), {
  ssr: false,
});

type EventMode = "vehicle" | "global";
type StatusFilter = "ALL" | "MOVING" | "OFFLINE" | "MISSION" | "ALERT";

export default function OwnerGpsPage() {
  const [vehicles, setVehicles] = useState<VehicleLiveStatusDTO[]>([]);
  const [globalEvents, setGlobalEvents] = useState<VehicleEventDTO[]>([]);
  const [vehicleEvents, setVehicleEvents] = useState<VehicleEventDTO[]>([]);
  const [history, setHistory] = useState<GpsData[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [eventMode, setEventMode] = useState<EventMode>("vehicle");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

  const loadFleet = useCallback(async () => {
    try {
      const [fleet, liveEvents] = await Promise.all([
        gpsService.getLiveFleet(),
        gpsService.getLatestEvents(),
      ]);

      setVehicles(fleet);
      setGlobalEvents(liveEvents);

      setSelectedVehicleId((prev) => {
        if (fleet.length === 0) return null;
        if (prev && fleet.some((vehicle) => vehicle.vehicleId === prev)) return prev;
        return fleet[0].vehicleId;
      });
    } catch (e: any) {
      console.error("Erreur lors du chargement GPS:", e);
      toast.error(
        e?.response?.data?.message ||
          e?.response?.data?.error ||
          e?.message ||
          "Erreur lors du chargement GPS"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const loadVehicleDetails = useCallback(async (vehicleId: number) => {
    setHistoryLoading(true);
    try {
      const [h, events] = await Promise.all([
        gpsService.getHistory(vehicleId),
        gpsService.getVehicleEvents(vehicleId),
      ]);
      setHistory(h);
      setVehicleEvents(events);
    } catch (e: any) {
      console.error("Erreur lors du chargement du détail véhicule:", e);
      toast.error(
        e?.response?.data?.message ||
          e?.response?.data?.error ||
          e?.message ||
          "Erreur lors du chargement du détail véhicule"
      );
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFleet();
    const timer = window.setInterval(() => {
      loadFleet();
    }, 5000);

    return () => window.clearInterval(timer);
  }, [loadFleet]);

  useEffect(() => {
    if (selectedVehicleId) {
      loadVehicleDetails(selectedVehicleId);
    } else {
      setHistory([]);
      setVehicleEvents([]);
    }
  }, [selectedVehicleId, loadVehicleDetails]);

  const filteredVehicles = useMemo(() => {
    if (statusFilter === "ALL") return vehicles;

    if (statusFilter === "MOVING") {
      return vehicles.filter((v) => v.liveStatus === "MOVING");
    }

    if (statusFilter === "OFFLINE") {
      return vehicles.filter(
        (v) => v.liveStatus === "OFFLINE" || v.liveStatus === "NO_DATA"
      );
    }

    if (statusFilter === "MISSION") {
      return vehicles.filter((v) => v.missionActive);
    }

    return vehicles.filter(
      (v) => v.liveStatus === "OFF_ROUTE" || v.liveStatus === "MISSION_COMPLETED"
    );
  }, [vehicles, statusFilter]);

  const selectedVehicle = useMemo(() => {
    return (
      filteredVehicles.find((v) => v.vehicleId === selectedVehicleId) ??
      vehicles.find((v) => v.vehicleId === selectedVehicleId) ??
      null
    );
  }, [filteredVehicles, vehicles, selectedVehicleId]);

  const eventsToShow = eventMode === "vehicle" ? vehicleEvents : globalEvents;

  return (
    <ProtectedRoute allowedRoles={["ROLE_OWNER", "ROLE_ADMIN"]}>
      <div className="p-6 md:p-10 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Suivi GPS temps réel
            </h1>
            <p className="mt-1 text-slate-600">
              Visualisez vos véhicules, missions actives, historique et événements.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {(["ALL", "MOVING", "OFFLINE", "MISSION", "ALERT"] as StatusFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`rounded-xl px-4 py-2 text-sm font-bold border transition ${
                  statusFilter === f
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-slate-500">
            Chargement...
          </div>
        ) : (
          <>
            <FleetLiveMap
              vehicles={filteredVehicles}
              selectedVehicleId={selectedVehicleId}
              setSelectedVehicleId={setSelectedVehicleId}
              history={history}
            />

            <div className="grid gap-6 lg:grid-cols-[360px,1fr]">
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-5 py-4">
                  <h2 className="text-lg font-extrabold text-slate-900">Vehicles</h2>
                </div>

                <div className="max-h-[520px] overflow-auto">
                  {filteredVehicles.length === 0 ? (
                    <div className="p-5 text-sm text-slate-500">No vehicles found.</div>
                  ) : (
                    filteredVehicles.map((vehicle) => (
                      <button
                        key={vehicle.vehicleId}
                        onClick={() => setSelectedVehicleId(vehicle.vehicleId)}
                        className={`w-full border-b border-slate-100 px-5 py-4 text-left hover:bg-slate-50 transition ${
                          selectedVehicleId === vehicle.vehicleId ? "bg-sky-50" : "bg-white"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-bold text-slate-900">{vehicle.vehicleName}</p>
                            <p className="text-xs text-slate-500">
                              Driver: {vehicle.currentDriverName || "Aucun"}
                            </p>
                          </div>

                          <span className="rounded-full border border-slate-200 px-2 py-1 text-xs font-bold text-slate-700">
                            {vehicle.liveStatus}
                          </span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h2 className="text-lg font-extrabold text-slate-900">Selected vehicle</h2>

                  {!selectedVehicle ? (
                    <p className="mt-3 text-sm text-slate-500">Aucun véhicule sélectionné.</p>
                  ) : (
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <div className="rounded-xl bg-slate-50 p-4">
                        <p className="text-xs font-bold text-slate-500">Vehicle</p>
                        <p className="mt-1 font-bold text-slate-900">
                          {selectedVehicle.vehicleName}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-4">
                        <p className="text-xs font-bold text-slate-500">Status</p>
                        <p className="mt-1 font-bold text-slate-900">
                          {selectedVehicle.liveStatus}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-4">
                        <p className="text-xs font-bold text-slate-500">Speed</p>
                        <p className="mt-1 font-bold text-slate-900">
                          {selectedVehicle.speed} km/h
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-4">
                        <p className="text-xs font-bold text-slate-500">Engine</p>
                        <p className="mt-1 font-bold text-slate-900">
                          {selectedVehicle.engineOn ? "ON" : "OFF"}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-4">
                        <p className="text-xs font-bold text-slate-500">Mission</p>
                        <p className="mt-1 font-bold text-slate-900">
                          {selectedVehicle.missionActive ? "Active" : "Inactive"}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-4">
                        <p className="text-xs font-bold text-slate-500">Route source</p>
                        <p className="mt-1 font-bold text-slate-900">
                          {selectedVehicle.routeSource || "-"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                    <h2 className="text-lg font-extrabold text-slate-900">Events</h2>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setEventMode("vehicle")}
                        className={`rounded-xl px-3 py-2 text-sm font-bold transition ${
                          eventMode === "vehicle"
                            ? "bg-slate-900 text-white"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        Vehicle
                      </button>
                      <button
                        onClick={() => setEventMode("global")}
                        className={`rounded-xl px-3 py-2 text-sm font-bold transition ${
                          eventMode === "global"
                            ? "bg-slate-900 text-white"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        Global
                      </button>
                    </div>
                  </div>

                  <div className="max-h-[360px] overflow-auto divide-y divide-slate-100">
                    {eventsToShow.length === 0 ? (
                      <div className="p-5 text-sm text-slate-500">No events.</div>
                    ) : (
                      eventsToShow.map((event) => (
                        <div key={event.id} className="p-5">
                          <div className="flex items-center justify-between gap-3">
                            <p className="font-bold text-slate-900">{event.eventType}</p>
                            <span className="text-xs font-bold text-slate-500">
                              {event.severity}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-slate-600">{event.message}</p>
                          <p className="mt-2 text-xs text-slate-400">{event.createdAt}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {historyLoading ? (
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm text-sm text-slate-500">
                    Loading history...
                  </div>
                ) : null}
              </div>
            </div>
          </>
        )}
      </div>
    </ProtectedRoute>
  );
}