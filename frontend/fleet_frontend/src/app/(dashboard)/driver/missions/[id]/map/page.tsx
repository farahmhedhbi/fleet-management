"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "react-toastify";
import SockJS from "sockjs-client";
import { Client, type IMessage } from "@stomp/stompjs";

import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import FleetLiveMap from "@/components/gps/FleetLiveMap";
import ConfirmEventAsIncidentButton from "@/components/incidents/ConfirmEventAsIncidentButton";
import { missionService } from "@/lib/services/missionService";

import type { Mission, RouteCheckResult } from "@/types/mission";
import type { GpsData, VehicleEventDTO, VehicleLiveStatusDTO } from "@/types/gps";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

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

const IGNORED_AFTER_COMPLETED = new Set([
  "ENGINE_OFF",
  "STOP_LONG",
  "OFF_ROUTE",
  "NO_SIGNAL",
]);

function formatDateTime(value?: string) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

function routeBadge(status?: string | null) {
  if (status === "SAFE") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "ALTERNATIVE_SELECTED") return "border-orange-200 bg-orange-50 text-orange-700";
  if (status === "LEAST_RISK_SELECTED") return "border-red-200 bg-red-50 text-red-700";
  return "border-slate-200 bg-slate-50 text-slate-500";
}

function routeLabel(status?: string | null) {
  if (status === "SAFE") return "🟢 Route sûre";
  if (status === "ALTERNATIVE_SELECTED") return "🟠 Alternative sélectionnée";
  if (status === "LEAST_RISK_SELECTED") return "🔴 Route la moins dangereuse";
  return "⚪ Route non vérifiée";
}

function riskColor(risk?: string | null) {
  if (risk === "LOW") return "text-emerald-700";
  if (risk === "MEDIUM") return "text-orange-700";
  if (risk === "HIGH" || risk === "CRITICAL") return "text-red-700";
  return "text-slate-600";
}

function liveToHistoryPoint(live: VehicleLiveStatusDTO): GpsData {
  return {
    id: Date.now(),
    vehicleId: live.vehicleId,
    latitude: live.latitude!,
    longitude: live.longitude!,
    speed: live.speed ?? 0,
    engineOn: live.engineOn ?? false,
    timestamp: live.timestamp || new Date().toISOString(),
  } as GpsData;
}

function eventKey(event: VehicleEventDTO) {
  return event.id != null
    ? String(event.id)
    : `${event.vehicleId}-${event.missionId ?? "no-mission"}-${event.eventType}-${event.createdAt}`;
}

function canConfirm(event: VehicleEventDTO) {
  return (
    !!event.id &&
    (event.severity === "WARNING" || event.severity === "CRITICAL") &&
    CONFIRMABLE_EVENTS.has(event.eventType)
  );
}

export default function DriverMissionMapPage() {
  const params = useParams<{ id: string }>();
  const missionId = Number(params.id);
  const isValidMissionId = Number.isFinite(missionId) && missionId > 0;

  const stompRef = useRef<Client | null>(null);
  const completedToastShownRef = useRef(false);

  const [mission, setMission] = useState<Mission | null>(null);
  const [missionStatus, setMissionStatus] = useState<string>("");
  const [live, setLive] = useState<VehicleLiveStatusDTO | null>(null);
  const [history, setHistory] = useState<GpsData[]>([]);
  const [events, setEvents] = useState<VehicleEventDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingRoute, setCheckingRoute] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);

  const effectiveMissionStatus =
    live?.missionStatus || missionStatus || mission?.status || "—";

  const isMissionCompleted = effectiveMissionStatus === "COMPLETED";

  const handleMissionCompleted = useCallback((data?: VehicleLiveStatusDTO) => {
    setMissionStatus("COMPLETED");

    setMission((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        status: "COMPLETED" as Mission["status"],
        finishedAt: prev.finishedAt || data?.timestamp || undefined,
      };
    });

    setLive((prev) =>
      prev
        ? {
            ...prev,
            missionStatus: "COMPLETED",
            missionActive: false,
            liveStatus: data?.liveStatus ?? prev.liveStatus,
          }
        : data ?? prev
    );

    setEvents((prev) =>
      prev.filter((event) => !IGNORED_AFTER_COMPLETED.has(event.eventType))
    );

    if (!completedToastShownRef.current) {
      completedToastShownRef.current = true;
      toast.success("Mission terminée automatiquement");
    }
  }, []);

  const loadMissionMap = useCallback(async () => {
    if (!isValidMissionId) {
      setLoading(false);
      return;
    }

    try {
      const [missionData, liveData, historyData] = await Promise.all([
        missionService.getById(missionId),
        missionService.getLive(missionId),
        missionService.getHistory(missionId),
      ]);

      setMission(missionData);
      setMissionStatus(missionData?.status || liveData?.missionStatus || "");
      setLive(liveData);
      setHistory(historyData || []);

      if (
        missionData?.status === "COMPLETED" ||
        liveData?.missionStatus === "COMPLETED"
      ) {
        handleMissionCompleted(liveData);
      }
    } catch (e: any) {
      toast.error(
        e?.response?.data?.message ||
          e?.response?.data?.error ||
          e?.message ||
          "Impossible de charger la carte de la mission"
      );
    } finally {
      setLoading(false);
    }
  }, [missionId, isValidMissionId, handleMissionCompleted]);

  const handleCheckRoute = useCallback(async () => {
    if (!mission) return;

    try {
      setCheckingRoute(true);

      const result: RouteCheckResult = await missionService.checkRoute(mission.id);

      setMission((prev) =>
        prev
          ? {
              ...prev,
              routeCheckStatus: result.status,
              routeRiskLevel: result.riskLevel,
              routeRecalculated: result.routeRecalculated,
              originalDurationMinutes: result.originalDurationMinutes,
              selectedDurationMinutes: result.selectedDurationMinutes,
              estimatedDelayMinutes: result.estimatedDelayMinutes,
              originalDistanceKm: result.originalDistanceKm,
              selectedDistanceKm: result.selectedDistanceKm,
              routeCheckMessage: result.message,
              originalRouteJson: result.originalRouteJson,
              routeJson: result.selectedRouteJson || prev.routeJson,
            }
          : prev
      );

      toast.success(result.message || "Route vérifiée avec succès");
    } catch (e: any) {
      toast.error(
        e?.response?.data?.message ||
          e?.response?.data?.error ||
          e?.message ||
          "Impossible de vérifier la route"
      );
    } finally {
      setCheckingRoute(false);
    }
  }, [mission]);

  useEffect(() => {
    loadMissionMap();
  }, [loadMissionMap]);

  useEffect(() => {
    if (!live?.vehicleId || !isValidMissionId) return;

    const vehicleId = live.vehicleId;

    const client = new Client({
      webSocketFactory: () => new SockJS(`${API_BASE_URL}/ws`),
      reconnectDelay: 5000,

      debug: (msg) => {
        console.log("[STOMP]", msg);
      },

      onConnect: () => {
        setWsConnected(true);

        const handleLiveMessage = (message: IMessage) => {
          const data = JSON.parse(message.body) as VehicleLiveStatusDTO;

          if (data.vehicleId !== vehicleId) return;

          setLive(data);

          if (data.missionStatus) {
            setMissionStatus(data.missionStatus);
          }

          if (data.missionStatus === "COMPLETED") {
            handleMissionCompleted(data);
          }

          if (data.latitude != null && data.longitude != null) {
            setHistory((prev) => {
              const point = liveToHistoryPoint(data);
              const last = prev[prev.length - 1];

              if (
                last &&
                last.latitude === point.latitude &&
                last.longitude === point.longitude &&
                last.timestamp === point.timestamp
              ) {
                return prev;
              }

              return [...prev.slice(-499), point];
            });
          }
        };

        const handleRouteCheckMessage = (message: IMessage) => {
          const result = JSON.parse(message.body) as RouteCheckResult;

          if (result.missionId !== missionId) return;

          setMission((prev) =>
            prev
              ? {
                  ...prev,
                  routeCheckStatus: result.status,
                  routeRiskLevel: result.riskLevel,
                  routeRecalculated: result.routeRecalculated,
                  originalDurationMinutes: result.originalDurationMinutes,
                  selectedDurationMinutes: result.selectedDurationMinutes,
                  estimatedDelayMinutes: result.estimatedDelayMinutes,
                  originalDistanceKm: result.originalDistanceKm,
                  selectedDistanceKm: result.selectedDistanceKm,
                  routeCheckMessage: result.message,
                  originalRouteJson: result.originalRouteJson,
                  routeJson: result.selectedRouteJson || prev.routeJson,
                }
              : prev
          );

          toast.info(result.message || "Route mise à jour");
        };

        const handleEventMessage = (message: IMessage, fallbackMessage: string) => {
          const event = JSON.parse(message.body) as VehicleEventDTO;

          if (event.vehicleId !== vehicleId) return;
          if (event.missionId && event.missionId !== missionId) return;
          if (event.severity !== "WARNING" && event.severity !== "CRITICAL") return;

          if (
            effectiveMissionStatus === "COMPLETED" ||
            IGNORED_AFTER_COMPLETED.has(event.eventType)
          ) {
            return;
          }

          setEvents((prev) => {
            const exists = prev.some((e) => e.id === event.id);
            if (exists) return prev;
            return [event, ...prev].slice(0, 20);
          });

          toast.warning(event.message || fallbackMessage);
        };

        client.subscribe(`/topic/vehicles/${vehicleId}/live`, handleLiveMessage);
        client.subscribe(`/topic/missions/${missionId}/live`, handleLiveMessage);

        client.subscribe(
          `/topic/missions/${missionId}/route-check`,
          handleRouteCheckMessage
        );

        client.subscribe(`/topic/vehicles/${vehicleId}/route-check`, handleRouteCheckMessage);

        client.subscribe(`/topic/vehicles/${vehicleId}/events`, (message) =>
          handleEventMessage(message, "Nouvelle alerte détectée")
        );

        client.subscribe(`/topic/missions/${missionId}/events`, (message) =>
          handleEventMessage(message, "Nouvelle alerte mission")
        );
      },

      onStompError: () => {
        setWsConnected(false);
      },

      onWebSocketClose: () => {
        setWsConnected(false);
      },
    });

    stompRef.current = client;
    client.activate();

    return () => {
      client.deactivate();
      stompRef.current = null;
      setWsConnected(false);
    };
  }, [
    live?.vehicleId,
    missionId,
    isValidMissionId,
    handleMissionCompleted,
    effectiveMissionStatus,
  ]);

  useEffect(() => {
    if (!isValidMissionId) return;

    const interval = window.setInterval(async () => {
      if (wsConnected) return;

      try {
        const [missionData, liveData, historyData] = await Promise.all([
          missionService.getById(missionId),
          missionService.getLive(missionId),
          missionService.getHistory(missionId),
        ]);

        setMission(missionData);
        setMissionStatus(missionData?.status || liveData?.missionStatus || "");
        setLive(liveData);
        setHistory(historyData || []);

        if (
          missionData?.status === "COMPLETED" ||
          liveData?.missionStatus === "COMPLETED"
        ) {
          handleMissionCompleted(liveData);
        }
      } catch (e) {
        console.error("Erreur fallback refresh carte mission :", e);
      }
    }, 5000);

    return () => window.clearInterval(interval);
  }, [missionId, isValidMissionId, wsConnected, handleMissionCompleted]);

  const vehicles = useMemo(() => {
    return live ? [live] : [];
  }, [live]);

  if (!isValidMissionId) {
    return (
      <ProtectedRoute allowedRoles={["ROLE_DRIVER"]}>
        <div className="p-6 md:p-10">ID mission invalide.</div>
      </ProtectedRoute>
    );
  }

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["ROLE_DRIVER"]}>
        <div className="p-6 md:p-10">Chargement de la carte...</div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["ROLE_DRIVER"]}>
      <div className="space-y-6 p-6 md:p-10">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900">
                Carte live mission
              </h1>

              <p className="mt-1 text-slate-600">
                {mission?.title || "Mission"} — {mission?.departure || "—"} →{" "}
                {mission?.destination || "—"}
              </p>
            </div>

            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                wsConnected
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-amber-50 text-amber-700"
              }`}
            >
              {wsConnected ? "WebSocket connecté" : "Fallback API"}
            </span>
          </div>

          <div className="mt-4 grid gap-3 text-sm text-slate-700 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <strong>Véhicule :</strong>{" "}
              {mission?.vehicleRegistrationNumber || "—"}
            </div>

            <div>
              <strong>Statut :</strong>{" "}
              <span
                className={
                  isMissionCompleted
                    ? "font-bold text-emerald-700"
                    : "font-bold text-slate-800"
                }
              >
                {effectiveMissionStatus}
              </span>
            </div>

            <div>
              <strong>Début :</strong>{" "}
              {formatDateTime(mission?.startedAt || mission?.startDate)}
            </div>

            <div>
              <strong>Fin :</strong>{" "}
              {formatDateTime(mission?.finishedAt || mission?.endDate)}
            </div>
          </div>
        </div>

        {mission && !isMissionCompleted && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">
                  Vérification intelligente de la route
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Le système sélectionne la meilleure route avant ou pendant la mission.
                </p>
              </div>

              <span
                className={`inline-flex rounded-full border px-3 py-1 text-xs font-extrabold ${routeBadge(
                  mission.routeCheckStatus
                )}`}
              >
                {routeLabel(mission.routeCheckStatus)}
              </span>
            </div>

            {mission.routeCheckMessage ? (
              <p className="mt-4 rounded-xl bg-slate-50 p-3 text-sm font-semibold text-slate-700">
                {mission.routeCheckMessage}
              </p>
            ) : (
              <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-700">
                Route non vérifiée. Lance la vérification pour choisir la meilleure route.
              </p>
            )}

            <div className="mt-4 grid gap-3 text-sm md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-xl border border-slate-200 p-3">
                <p className="text-xs font-bold text-slate-400">Risque</p>
                <p className={`mt-1 font-extrabold ${riskColor(mission.routeRiskLevel)}`}>
                  {mission.routeRiskLevel || "—"}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 p-3">
                <p className="text-xs font-bold text-slate-400">Retard estimé</p>
                <p className="mt-1 font-extrabold text-slate-900">
                  +{mission.estimatedDelayMinutes ?? 0} min
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 p-3">
                <p className="text-xs font-bold text-slate-400">Durée initiale</p>
                <p className="mt-1 font-extrabold text-slate-900">
                  {mission.originalDurationMinutes ?? "—"} min
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 p-3">
                <p className="text-xs font-bold text-slate-400">Durée choisie</p>
                <p className="mt-1 font-extrabold text-slate-900">
                  {mission.selectedDurationMinutes ?? "—"} min
                </p>
              </div>
            </div>

            {(mission.routeCheckStatus === "ALTERNATIVE_SELECTED" ||
              mission.routeCheckStatus === "LEAST_RISK_SELECTED") && (
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-700">
                🔴 Route initiale : conservée pour comparaison <br />
                🟢 Route recommandée : sélectionnée comme route à suivre
              </div>
            )}

            <button
              onClick={handleCheckRoute}
              disabled={checkingRoute || mission.status === "COMPLETED"}
              className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-extrabold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
            >
              {checkingRoute ? "Vérification..." : "Vérifier / recalculer la route"}
            </button>
          </div>
        )}

        {!isMissionCompleted && events.length > 0 && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-red-700">
              Alertes GPS / OBD
            </h2>

            <div className="space-y-3">
              {events.map((event) => (
                <div
                  key={eventKey(event)}
                  className="rounded-xl border border-red-200 bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="font-bold text-slate-900">
                        {event.eventType}
                      </div>

                      <div className="mt-1 text-sm text-slate-600">
                        {event.message || "Aucun message"}
                      </div>

                      <div className="mt-2 text-xs text-slate-500">
                        {formatDateTime(event.createdAt)}
                      </div>
                    </div>

                    <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
                      {event.severity}
                    </span>
                  </div>

                  {canConfirm(event) && (
                    <div className="mt-4 flex justify-end">
                      <ConfirmEventAsIncidentButton
                        event={event}
                        onConfirmed={() => {
                          setEvents((prev) =>
                            prev.filter((e) => e.id !== event.id)
                          );
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {isMissionCompleted && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-800 shadow-sm">
            Mission terminée automatiquement. Aucune alerte normale de fin de
            trajet ne sera affichée.
          </div>
        )}

        {!live ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            Aucune donnée live disponible pour cette mission.
          </div>
        ) : (
       <FleetLiveMap
  vehicles={vehicles}
  selectedVehicleId={live.vehicleId}
  setSelectedVehicleId={() => {}}
  history={history}
  originalRoute={mission?.originalRouteJson ? JSON.parse(mission.originalRouteJson) : undefined}
  recommendedRoute={mission?.routeJson ? JSON.parse(mission.routeJson) : undefined}
  showRouteComparison={
    mission?.routeCheckStatus === "ALTERNATIVE_SELECTED" ||
    mission?.routeCheckStatus === "LEAST_RISK_SELECTED"
  }
/>
        )}
      </div>
    </ProtectedRoute>
  );
}