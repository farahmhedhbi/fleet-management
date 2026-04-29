"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "react-toastify";
import SockJS from "sockjs-client";
import { Client, type IMessage } from "@stomp/stompjs";

import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import FleetLiveMap from "@/components/gps/FleetLiveMap";
import { missionService } from "@/lib/services/missionService";

import type { Mission } from "@/types/mission";
import type { GpsData, VehicleLiveStatusDTO } from "@/types/gps";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

function formatDateTime(value?: string) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
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

export default function DriverMissionMapPage() {
  const params = useParams<{ id: string }>();
  const missionId = Number(params.id);
  const isValidMissionId = Number.isFinite(missionId) && missionId > 0;

  const stompRef = useRef<Client | null>(null);

  const [mission, setMission] = useState<Mission | null>(null);
  const [live, setLive] = useState<VehicleLiveStatusDTO | null>(null);
  const [history, setHistory] = useState<GpsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [wsConnected, setWsConnected] = useState(false);

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
      setLive(liveData);
      setHistory(historyData);
    } catch (e: any) {
      console.error("Erreur chargement carte mission :", e);
      toast.error(
        e?.response?.data?.message ||
          e?.response?.data?.error ||
          e?.message ||
          "Impossible de charger la carte de la mission"
      );
    } finally {
      setLoading(false);
    }
  }, [missionId, isValidMissionId]);

  useEffect(() => {
    loadMissionMap();
  }, [loadMissionMap]);

  useEffect(() => {
    if (!live?.vehicleId) return;

    const vehicleId = live.vehicleId;

    const client = new Client({
      webSocketFactory: () => new SockJS(`${API_BASE_URL}/ws`),
      reconnectDelay: 5000,
      debug: (msg) => console.log("[STOMP]", msg),

      onConnect: () => {
        console.log("✅ WebSocket connected");
        setWsConnected(true);

        client.subscribe(`/topic/vehicles/${vehicleId}/live`, (message: IMessage) => {
          const data = JSON.parse(message.body) as VehicleLiveStatusDTO;

          console.log("✅ WS vehicle live:", data);

          if (data.vehicleId !== vehicleId) return;

          setLive(data);

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
        });
      },

      onStompError: (frame) => {
        console.error("❌ STOMP error:", frame);
        setWsConnected(false);
      },

      onWebSocketClose: () => {
        console.warn("⚠️ WebSocket closed");
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
  }, [live?.vehicleId]);

  // fallback léger si WS ne marche pas
  useEffect(() => {
    if (!isValidMissionId) return;

    const interval = window.setInterval(async () => {
      if (wsConnected) return;

      try {
        const [liveData, historyData] = await Promise.all([
          missionService.getLive(missionId),
          missionService.getHistory(missionId),
        ]);

        setLive(liveData);
        setHistory(historyData);
      } catch (e) {
        console.error("Erreur fallback refresh carte mission :", e);
      }
    }, 5000);

    return () => window.clearInterval(interval);
  }, [missionId, isValidMissionId, wsConnected]);

  const vehicles = useMemo(() => {
    return live ? [live] : [];
  }, [live]);

  if (!isValidMissionId) {
    return (
      <ProtectedRoute allowedRoles={["ROLE_DRIVER"]}>
        <div className="p-6 md:p-10">
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700 shadow-sm">
            ID mission invalide.
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["ROLE_DRIVER"]}>
        <div className="p-6 md:p-10">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            Chargement de la carte...
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["ROLE_DRIVER"]}>
      <div className="p-6 md:p-10 space-y-6">
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
              <strong>Statut :</strong> {mission?.status || "—"}
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
          />
        )}
      </div>
    </ProtectedRoute>
  );
}