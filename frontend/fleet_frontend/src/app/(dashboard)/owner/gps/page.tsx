"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { gpsService } from "@/lib/services/gpsService";
import type { GpsData, VehicleEventDTO, VehicleLiveStatusDTO } from "@/types/gps";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { toast } from "react-toastify";
import {
  subscribeGpsLive,
  subscribeEventsLive,
  unsubscribeGpsLive,
  unsubscribeEventsLive,
} from "@/lib/websocket";

const FleetLiveMap = dynamic(() => import("@/components/gps/FleetLiveMap"), {
  ssr: false,
});

type EventMode = "vehicle" | "global";
type StatusFilter = "ALL" | "MOVING" | "OFFLINE" | "MISSION" | "ALERT";

const EVENT_COOLDOWN_MS = 10 * 60 * 1000;

function eventKey(event: VehicleEventDTO) {
  return event.id != null
    ? String(event.id)
    : `${event.vehicleId}-${event.missionId ?? "no-mission"}-${event.eventType}-${event.severity}-${event.createdAt}`;
}

function eventSpamKey(event: VehicleEventDTO) {
  return `${event.vehicleId}-${event.missionId ?? "no-mission"}-${event.eventType}-${event.severity}`;
}

function isDangerEvent(event: VehicleEventDTO) {
  return event.severity === "CRITICAL" || event.severity === "WARNING";
}

function isToastEvent(event: VehicleEventDTO) {
  return event.severity === "CRITICAL";
}

function isObdEvent(event: VehicleEventDTO) {
  const type = event.eventType || "";
  return (
    type.includes("OBD_") ||
    type.includes("FUEL") ||
    type.includes("TEMP") ||
    type.includes("BATTERY") ||
    type.includes("CHECK_ENGINE") ||
    type === "ENGINE_FAILURE" ||
    type === "MISSION_INTERRUPTED"
  );
}

function isRecentEvent(event: VehicleEventDTO) {
  if (!event.createdAt) return false;

  const createdAt = new Date(event.createdAt).getTime();
  if (Number.isNaN(createdAt)) return false;

  return Date.now() - createdAt <= EVENT_COOLDOWN_MS;
}

function toGpsPoint(live: VehicleLiveStatusDTO): GpsData | null {
  if (live.latitude == null || live.longitude == null || !live.timestamp) {
    return null;
  }

  return {
    id: Date.now(),
    vehicleId: live.vehicleId,
    missionId: live.missionId,
    latitude: live.latitude,
    longitude: live.longitude,
    speed: live.speed,
    engineOn: live.engineOn,
    timestamp: live.timestamp,
    routeId: live.routeId,
    routeSource: live.routeSource,
  };
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

function getEventLabel(type: string) {
  switch (type) {
    case "LOW_FUEL_CRITICAL":
    case "LOW_FUEL_WARNING":
    case "OBD_LOW_FUEL":
      return "Carburant critique";

    case "HIGH_TEMP_CRITICAL":
    case "HIGH_TEMP_WARNING":
    case "OBD_HIGH_TEMP":
      return "Température moteur critique";

    case "LOW_BATTERY_CRITICAL":
    case "LOW_BATTERY_WARNING":
    case "OBD_LOW_BATTERY":
      return "Batterie critique";

    case "CHECK_ENGINE_ON":
    case "OBD_CHECK_ENGINE":
      return "Voyant moteur activé";

    case "ENGINE_FAILURE":
      return "Panne moteur probable";

    case "MISSION_INTERRUPTED":
      return "Mission interrompue";

    case "OVERSPEED":
      return "Dépassement de vitesse";

    case "OFF_ROUTE":
      return "Véhicule hors trajet";

    case "STOP_LONG":
      return "Arrêt prolongé";

    case "ENGINE_OFF":
      return "Moteur éteint";

    case "NO_SIGNAL":
      return "Signal perdu";

    default:
      return type || "Événement";
  }
}

function upsertEvent(list: VehicleEventDTO[], event: VehicleEventDTO) {
  const key = eventKey(event);
  const exists = list.some((item) => eventKey(item) === key);

  if (exists) return list;

  return [event, ...list]
    .filter(isDangerEvent)
    .slice(0, 50);
}

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

  const selectedVehicleIdRef = useRef<number | null>(null);
  const recentEventsRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    selectedVehicleIdRef.current = selectedVehicleId;
  }, [selectedVehicleId]);

  const isDuplicateLiveEvent = useCallback((event: VehicleEventDTO) => {
    const key = eventSpamKey(event);
    const now = Date.now();
    const last = recentEventsRef.current.get(key);

    if (last && now - last < EVENT_COOLDOWN_MS) {
      return true;
    }

    recentEventsRef.current.set(key, now);
Array.from(recentEventsRef.current.entries()).forEach(([k, t]) => {
  if (now - t > EVENT_COOLDOWN_MS * 2) {
    recentEventsRef.current.delete(k);
  }
});

    return false;
  }, []);

  const loadFleet = useCallback(async () => {
    try {
      const [fleet, liveEvents] = await Promise.all([
        gpsService.getLiveFleet(),
        gpsService.getLatestEvents(),
      ]);

      const safeFleet = Array.isArray(fleet) ? fleet : [];
      const safeEvents = Array.isArray(liveEvents)
        ? liveEvents.filter(isDangerEvent)
        : [];

      setVehicles(safeFleet);
      setGlobalEvents(safeEvents);

      setSelectedVehicleId((prev) => {
        if (safeFleet.length === 0) return null;
        if (prev && safeFleet.some((vehicle) => vehicle.vehicleId === prev)) {
          return prev;
        }
        return safeFleet[0].vehicleId;
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

  const loadVehicleDetails = useCallback(
    async (vehicleId: number) => {
      setHistoryLoading(true);

      try {
        const vehicle = vehicles.find((v) => v.vehicleId === vehicleId);
        const eventsPromise = gpsService.getVehicleEvents(vehicleId);

        const historyPromise =
          vehicle?.missionActive && vehicle.missionId
            ? gpsService.getMissionHistory(vehicle.missionId)
            : Promise.resolve([]);

        const [h, events] = await Promise.all([historyPromise, eventsPromise]);

        setHistory(Array.isArray(h) ? h : []);
        setVehicleEvents(
          Array.isArray(events) ? events.filter(isDangerEvent) : []
        );
      } catch (e) {
        console.error("Erreur détail véhicule:", e);
        toast.error("Erreur lors du chargement du détail véhicule");
        setHistory([]);
        setVehicleEvents([]);
      } finally {
        setHistoryLoading(false);
      }
    },
    [vehicles]
  );

  useEffect(() => {
    loadFleet();
  }, [loadFleet]);

  useEffect(() => {
    subscribeGpsLive<VehicleLiveStatusDTO>((liveVehicle) => {
      setVehicles((prev) => {
        const exists = prev.some((v) => v.vehicleId === liveVehicle.vehicleId);
        if (!exists) return [...prev, liveVehicle];

        return prev.map((v) =>
          v.vehicleId === liveVehicle.vehicleId ? liveVehicle : v
        );
      });

      setSelectedVehicleId((prev) => prev ?? liveVehicle.vehicleId);

      setHistory((prev) => {
        if (selectedVehicleIdRef.current !== liveVehicle.vehicleId) return prev;

        const point = toGpsPoint(liveVehicle);
        if (!point) return prev;

        const exists = prev.some(
          (p) =>
            p.timestamp === point.timestamp ||
            (p.vehicleId === point.vehicleId &&
              p.latitude === point.latitude &&
              p.longitude === point.longitude)
        );

        if (exists) return prev;

        return [...prev, point].slice(-300);
      });
    });

    subscribeEventsLive<VehicleEventDTO>((event) => {
      if (!event || !isDangerEvent(event)) return;

      setGlobalEvents((prev) => upsertEvent(prev, event));

      if (event.vehicleId === selectedVehicleIdRef.current) {
        setVehicleEvents((prev) => upsertEvent(prev, event));
      }

      if (!isRecentEvent(event)) return;
      if (!isToastEvent(event)) return;
      if (isDuplicateLiveEvent(event)) return;

      toast.error(event.message || getEventLabel(event.eventType), {
        toastId: eventSpamKey(event),
      });
    });

    return () => {
      unsubscribeGpsLive();
      unsubscribeEventsLive();
    };
  }, [isDuplicateLiveEvent]);

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
      (v) =>
        v.liveStatus === "OFF_ROUTE" ||
        v.liveStatus === "MISSION_COMPLETED" ||
        v.liveStatus === "BREAKDOWN"
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
    <ProtectedRoute allowedRoles={["ROLE_OWNER"]}>
      <div className="space-y-6 p-6 md:p-10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Suivi GPS temps réel
            </h1>
            <p className="mt-1 text-slate-600">
              GPS, OBD, événements critiques et missions synchronisés via WebSocket.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {(["ALL", "MOVING", "OFFLINE", "MISSION", "ALERT"] as StatusFilter[]).map(
              (f) => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={`rounded-xl border px-4 py-2 text-sm font-bold transition ${
                    statusFilter === f
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {f}
                </button>
              )
            )}
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-slate-500 shadow-sm">
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
                  <h2 className="text-lg font-extrabold text-slate-900">
                    Vehicles
                  </h2>
                </div>

                <div className="max-h-[520px] overflow-auto">
                  {filteredVehicles.length === 0 ? (
                    <div className="p-5 text-sm text-slate-500">
                      No vehicles found.
                    </div>
                  ) : (
                    filteredVehicles.map((vehicle) => (
                      <button
                        key={vehicle.vehicleId}
                        onClick={() => setSelectedVehicleId(vehicle.vehicleId)}
                        className={`w-full border-b border-slate-100 px-5 py-4 text-left transition hover:bg-slate-50 ${
                          selectedVehicleId === vehicle.vehicleId
                            ? "bg-sky-50"
                            : "bg-white"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-bold text-slate-900">
                              {vehicle.vehicleName}
                            </p>
                            <p className="text-xs text-slate-500">
                              Driver: {vehicle.currentDriverName || "Aucun"}
                            </p>
                            <p className="text-xs text-slate-500">
                              Mission ID: {vehicle.missionId ?? "-"}
                            </p>
                            <p className="text-xs text-slate-500">
                              Mission status: {vehicle.missionStatus || "-"}
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
                  <h2 className="text-lg font-extrabold text-slate-900">
                    Selected vehicle
                  </h2>

                  {!selectedVehicle ? (
                    <p className="mt-3 text-sm text-slate-500">
                      Aucun véhicule sélectionné.
                    </p>
                  ) : (
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <Info label="Vehicle" value={selectedVehicle.vehicleName} />
                      <Info label="Status" value={selectedVehicle.liveStatus} />
                      <Info label="Speed" value={`${selectedVehicle.speed} km/h`} />
                      <Info
                        label="Engine"
                        value={selectedVehicle.engineOn ? "ON" : "OFF"}
                      />
                      <Info
                        label="Mission active"
                        value={selectedVehicle.missionActive ? "Active" : "Inactive"}
                      />
                      <Info
                        label="Mission ID"
                        value={String(selectedVehicle.missionId ?? "-")}
                      />
                      <Info
                        label="Mission status"
                        value={selectedVehicle.missionStatus || "-"}
                      />
                      <Info
                        label="Driver"
                        value={selectedVehicle.currentDriverName || "-"}
                      />
                      <Info
                        label="Route source"
                        value={selectedVehicle.routeSource || "-"}
                      />
                      <Info
                        label="History points"
                        value={historyLoading ? "Loading..." : String(history.length)}
                      />
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                    <h2 className="text-lg font-extrabold text-slate-900">
                      Dangers / alertes
                    </h2>

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
                      <div className="p-5 text-sm text-slate-500">
                        Aucune alerte récente.
                      </div>
                    ) : (
                      eventsToShow.map((event) => (
                        <div key={eventKey(event)} className="p-5">
                          <div className="flex items-center justify-between gap-3">
                            <p className="font-bold text-slate-900">
                              {getEventLabel(event.eventType)}
                            </p>

                            <span
                              className={`rounded-full px-2 py-1 text-xs font-bold ${
                                event.severity === "CRITICAL"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-amber-100 text-amber-700"
                              }`}
                            >
                              {event.severity}
                            </span>
                          </div>

                          <p className="mt-1 text-sm text-slate-600">
                            {event.message}
                          </p>

                          <p className="mt-2 text-xs text-slate-400">
                            Vehicle #{event.vehicleId}
                            {event.missionId ? ` — Mission #${event.missionId}` : ""}
                            {" — "}
                            {formatDate(event.createdAt)}
                          </p>

                          {isObdEvent(event) && (
                            <p className="mt-1 text-xs font-bold text-blue-600">
                              OBD danger
                            </p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {historyLoading ? (
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">
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

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className="mt-1 font-bold text-slate-900">{value}</p>
    </div>
  );
}