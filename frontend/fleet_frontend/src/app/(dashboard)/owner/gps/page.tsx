"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { toast } from "react-toastify";

import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import ConfirmEventAsIncidentButton from "@/components/incidents/ConfirmEventAsIncidentButton";
import { gpsService } from "@/lib/services/gpsService";
import {
  subscribeEventsLive,
  subscribeGpsLive,
  unsubscribeEventsLive,
  unsubscribeGpsLive,
} from "@/lib/websocket";

import type {
  GpsData,
  VehicleEventDTO,
  VehicleLiveStatusDTO,
} from "@/types/gps";

const FleetLiveMap = dynamic(() => import("@/components/gps/FleetLiveMap"), {
  ssr: false,
});

type EventMode = "vehicle" | "global";
type StatusFilter = "ALL" | "MOVING" | "OFFLINE" | "MISSION" | "ALERT";

const CONFIRMABLE_EVENTS = new Set([
  "OFF_ROUTE",
  "STOP_LONG",
  "NO_SIGNAL",
  "OVERSPEED",
  "OBD_LOW_FUEL",
  "OBD_HIGH_TEMP",
  "OBD_LOW_BATTERY",
  "OBD_CHECK_ENGINE",
  "ENGINE_FAILURE",
  "MISSION_INTERRUPTED",
]);

function eventKey(event: VehicleEventDTO) {
  return event.id != null
    ? String(event.id)
    : `${event.vehicleId}-${event.missionId ?? "no-mission"}-${
        event.eventType
      }-${event.severity}-${event.createdAt}`;
}

function isDangerEvent(event: VehicleEventDTO) {
  return event.severity === "CRITICAL" || event.severity === "WARNING";
}

function isMissionCompletedEvent(event: VehicleEventDTO) {
  return event.eventType === "MISSION_COMPLETED";
}

function isLiveMissionFinished(live: VehicleLiveStatusDTO) {
  return (
    live.missionActive === false ||
    live.missionStatus === "COMPLETED" ||
    live.missionStatus === "CANCELED" ||
    live.liveStatus === "MISSION_COMPLETED"
  );
}

function canConfirmAsIncident(event: VehicleEventDTO) {
  return (
    !!event.id &&
    isDangerEvent(event) &&
    CONFIRMABLE_EVENTS.has(event.eventType || "")
  );
}

function isObdEvent(event: VehicleEventDTO) {
  const type = event.eventType || "";

  return (
    type.startsWith("OBD_") ||
    type === "ENGINE_FAILURE" ||
    type === "MISSION_INTERRUPTED"
  );
}

function toGpsPoint(live: VehicleLiveStatusDTO): GpsData | null {
  if (live.latitude == null || live.longitude == null || !live.timestamp) {
    return null;
  }

  return {
    id: Number(`${live.vehicleId}${Date.now()}`),
    vehicleId: live.vehicleId,
    missionId: live.missionId,
    latitude: live.latitude,
    longitude: live.longitude,
    speed: live.speed ?? 0,
    engineOn: live.engineOn ?? false,
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

function getEventLabel(type?: string | null) {
  switch (type) {
    case "MISSION_COMPLETED":
      return "Mission terminée";
    case "OBD_LOW_FUEL":
      return "Carburant faible";
    case "OBD_HIGH_TEMP":
      return "Température moteur élevée";
    case "OBD_LOW_BATTERY":
      return "Batterie faible";
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
  if (!isDangerEvent(event)) return list;

  const key = eventKey(event);
  const exists = list.some((item) => eventKey(item) === key);

  if (exists) return list;

  return [event, ...list].slice(0, 50);
}

function getStatusBadgeClasses(status?: string | null) {
  switch (status) {
    case "MOVING":
      return "border-emerald-200 bg-emerald-100 text-emerald-700";
    case "MISSION_COMPLETED":
      return "border-blue-200 bg-blue-100 text-blue-700";
    case "OFF_ROUTE":
    case "BREAKDOWN":
      return "border-red-200 bg-red-100 text-red-700";
    case "STOPPED":
    case "PARKED":
      return "border-amber-200 bg-amber-100 text-amber-700";
    case "OFFLINE":
    case "NO_DATA":
      return "border-slate-300 bg-slate-200 text-slate-700";
    default:
      return "border-slate-200 bg-slate-100 text-slate-700";
  }
}

function getVehicleCardClasses(vehicle: VehicleLiveStatusDTO, selected: boolean) {
  const base = "w-full border-b px-5 py-4 text-left transition hover:shadow-sm";

  if (selected) return `${base} border-sky-200 bg-sky-50`;

  switch (vehicle.liveStatus) {
    case "MOVING":
      return `${base} border-emerald-100 bg-emerald-50 hover:bg-emerald-100`;
    case "MISSION_COMPLETED":
      return `${base} border-blue-100 bg-blue-50 hover:bg-blue-100`;
    case "OFF_ROUTE":
    case "BREAKDOWN":
      return `${base} border-red-100 bg-red-50 hover:bg-red-100`;
    case "STOPPED":
    case "PARKED":
      return `${base} border-amber-100 bg-amber-50 hover:bg-amber-100`;
    case "OFFLINE":
    case "NO_DATA":
      return `${base} border-slate-100 bg-slate-50 hover:bg-slate-100`;
    default:
      return `${base} border-slate-100 bg-white hover:bg-slate-50`;
  }
}

export default function OwnerGpsPage() {
  const [vehicles, setVehicles] = useState<VehicleLiveStatusDTO[]>([]);
  const [globalEvents, setGlobalEvents] = useState<VehicleEventDTO[]>([]);
  const [vehicleEvents, setVehicleEvents] = useState<VehicleEventDTO[]>([]);
  const [history, setHistory] = useState<GpsData[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(
    null
  );

  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [eventMode, setEventMode] = useState<EventMode>("vehicle");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

  const selectedVehicleIdRef = useRef<number | null>(null);
  const vehiclesRef = useRef<VehicleLiveStatusDTO[]>([]);

  useEffect(() => {
    selectedVehicleIdRef.current = selectedVehicleId;
  }, [selectedVehicleId]);

  useEffect(() => {
    vehiclesRef.current = vehicles;
  }, [vehicles]);

  const loadFleet = useCallback(async () => {
    try {
      const [fleet, liveEvents] = await Promise.all([
        gpsService.getLiveFleet(),
        gpsService.getLatestEvents(),
      ]);

      const safeFleet = Array.isArray(fleet) ? fleet : [];
      const safeEvents = Array.isArray(liveEvents)
        ? liveEvents.filter(isDangerEvent).slice(0, 50)
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

  const loadVehicleDetails = useCallback(async (vehicleId: number) => {
    setHistoryLoading(true);

    try {
      const vehicle = vehiclesRef.current.find(
        (v) => v.vehicleId === vehicleId
      );

      const eventsPromise = gpsService.getVehicleEvents(vehicleId);

      const historyPromise =
        vehicle?.missionActive && vehicle.missionId
          ? gpsService.getMissionHistory(vehicle.missionId)
          : Promise.resolve([]);

      const [h, events] = await Promise.all([historyPromise, eventsPromise]);

      setHistory(Array.isArray(h) ? h : []);
      setVehicleEvents(
        Array.isArray(events) ? events.filter(isDangerEvent).slice(0, 50) : []
      );
    } catch (e) {
      console.error("Erreur détail véhicule:", e);
      toast.error("Erreur lors du chargement du détail véhicule");
      setHistory([]);
      setVehicleEvents([]);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const markVehicleMissionCompleted = useCallback(
    (vehicleId: number) => {
      setVehicles((prev) =>
        prev.map((vehicle) =>
          vehicle.vehicleId === vehicleId
            ? {
                ...vehicle,
                missionActive: false,
                missionId: null,
                missionStatus: "COMPLETED",
                liveStatus: "MISSION_COMPLETED",
                routeSource: "STATIC",
              }
            : vehicle
        )
      );

      if (vehicleId === selectedVehicleIdRef.current) {
        setHistory([]);
        setVehicleEvents([]);
      }

      setTimeout(() => {
        loadFleet();
      }, 300);
    },
    [loadFleet]
  );

  useEffect(() => {
    loadFleet();
  }, [loadFleet]);

  useEffect(() => {
    subscribeGpsLive<VehicleLiveStatusDTO>((liveVehicle) => {
      setVehicles((prev) => {
        const fixedLiveVehicle = isLiveMissionFinished(liveVehicle)
          ? {
              ...liveVehicle,
              missionActive: false,
              missionId:
                liveVehicle.missionStatus === "COMPLETED" ||
                liveVehicle.missionStatus === "CANCELED"
                  ? null
                  : liveVehicle.missionId,
              routeSource:
                liveVehicle.missionStatus === "COMPLETED" ||
                liveVehicle.missionStatus === "CANCELED"
                  ? "STATIC"
                  : liveVehicle.routeSource,
            }
          : liveVehicle;

        const exists = prev.some(
          (v) => v.vehicleId === fixedLiveVehicle.vehicleId
        );

        if (!exists) return [...prev, fixedLiveVehicle];

        return prev.map((v) =>
          v.vehicleId === fixedLiveVehicle.vehicleId ? fixedLiveVehicle : v
        );
      });

      setSelectedVehicleId((prev) => prev ?? liveVehicle.vehicleId);

      if (
        liveVehicle.vehicleId === selectedVehicleIdRef.current &&
        isLiveMissionFinished(liveVehicle)
      ) {
        setHistory([]);
        return;
      }

      setHistory((prev) => {
        if (selectedVehicleIdRef.current !== liveVehicle.vehicleId) {
          return prev;
        }

        const point = toGpsPoint(liveVehicle);
        if (!point) return prev;

        const last = prev[prev.length - 1];

        const exists =
          last &&
          last.vehicleId === point.vehicleId &&
          last.latitude === point.latitude &&
          last.longitude === point.longitude &&
          last.timestamp === point.timestamp;

        if (exists) return prev;

        return [...prev, point].slice(-300);
      });
    });

    subscribeEventsLive<VehicleEventDTO>((event) => {
      if (!event) return;

      if (isMissionCompletedEvent(event)) {
        markVehicleMissionCompleted(event.vehicleId);
        return;
      }

      if (!isDangerEvent(event)) return;

      setGlobalEvents((prev) => upsertEvent(prev, event));

      if (event.vehicleId === selectedVehicleIdRef.current) {
        setVehicleEvents((prev) => upsertEvent(prev, event));
      }
    });

    return () => {
      unsubscribeGpsLive();
      unsubscribeEventsLive();
    };
  }, [markVehicleMissionCompleted]);

  useEffect(() => {
    if (selectedVehicleId) {
      loadVehicleDetails(selectedVehicleId);
    } else {
      setHistory([]);
      setVehicleEvents([]);
    }
  }, [selectedVehicleId, loadVehicleDetails]);

  const alertVehicleIds = useMemo(() => {
    return new Set(globalEvents.map((event) => event.vehicleId).filter(Boolean));
  }, [globalEvents]);

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
        v.liveStatus === "BREAKDOWN" ||
        alertVehicleIds.has(v.vehicleId)
    );
  }, [vehicles, statusFilter, alertVehicleIds]);

  const selectedVehicle = useMemo(() => {
    return (
      filteredVehicles.find((v) => v.vehicleId === selectedVehicleId) ??
      vehicles.find((v) => v.vehicleId === selectedVehicleId) ??
      null
    );
  }, [filteredVehicles, vehicles, selectedVehicleId]);

  const eventsToShow = eventMode === "vehicle" ? vehicleEvents : globalEvents;

  const renderAlertsPanel = () => (
    <div className="rounded-2xl border border-red-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-red-100 bg-red-50 px-5 py-4">
        <h2 className="text-lg font-extrabold text-red-700">
          Dangers / alertes
        </h2>

        <div className="flex gap-2">
          <button
            onClick={() => setEventMode("vehicle")}
            className={`rounded-xl px-3 py-2 text-sm font-bold transition ${
              eventMode === "vehicle"
                ? "bg-red-600 text-white"
                : "bg-white text-red-700 hover:bg-red-100"
            }`}
          >
            Vehicle
          </button>

          <button
            onClick={() => setEventMode("global")}
            className={`rounded-xl px-3 py-2 text-sm font-bold transition ${
              eventMode === "global"
                ? "bg-red-600 text-white"
                : "bg-white text-red-700 hover:bg-red-100"
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

              <p className="mt-1 text-sm text-slate-600">{event.message}</p>

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

              {canConfirmAsIncident(event) && (
                <div className="mt-3 flex justify-end">
                  <ConfirmEventAsIncidentButton
                    event={event}
                    onConfirmed={() => {
                      setGlobalEvents((prev) =>
                        prev.filter((e) => eventKey(e) !== eventKey(event))
                      );

                      setVehicleEvents((prev) =>
                        prev.filter((e) => eventKey(e) !== eventKey(event))
                      );
                    }}
                  />
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <ProtectedRoute allowedRoles={["ROLE_OWNER"]}>
      <div className="space-y-6 p-6 md:p-10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Suivi GPS temps réel
            </h1>
            <p className="mt-1 text-slate-600">
              GPS, OBD, événements critiques et missions synchronisés via
              WebSocket.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {(
              ["ALL", "MOVING", "OFFLINE", "MISSION", "ALERT"] as StatusFilter[]
            ).map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`rounded-xl border px-4 py-2 text-sm font-bold transition ${
                  statusFilter === f
                    ? f === "ALERT"
                      ? "border-red-600 bg-red-600 text-white"
                      : "border-slate-900 bg-slate-900 text-white"
                    : f === "ALERT"
                      ? "border-red-200 bg-white text-red-700 hover:bg-red-50"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {statusFilter === "ALERT" && renderAlertsPanel()}

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
                        className={getVehicleCardClasses(
                          vehicle,
                          selectedVehicleId === vehicle.vehicleId
                        )}
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

                          <span
                            className={`rounded-full border px-2 py-1 text-xs font-bold ${getStatusBadgeClasses(
                              vehicle.liveStatus
                            )}`}
                          >
                            {vehicle.liveStatus || "UNKNOWN"}
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
                      <Info
                        label="Speed"
                        value={`${selectedVehicle.speed ?? 0} km/h`}
                      />
                      <Info
                        label="Engine"
                        value={selectedVehicle.engineOn ? "ON" : "OFF"}
                      />
                      <Info
                        label="Mission active"
                        value={
                          selectedVehicle.missionActive ? "Active" : "Inactive"
                        }
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
                        value={
                          historyLoading ? "Loading..." : String(history.length)
                        }
                      />
                    </div>
                  )}
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