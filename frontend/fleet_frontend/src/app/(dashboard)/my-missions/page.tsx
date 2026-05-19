"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { missionService } from "@/lib/services/missionService";
import { returnDepotService } from "@/lib/services/returnDepotService";
import type { Mission, RouteCheckResult } from "@/types/mission";
import type { VehicleLiveStatusDTO } from "@/types/gps";
import { toast } from "react-toastify";
import MyMissionsView from "./MyMissionsView";
import { driverRestService } from "@/lib/services/driverRestService";

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

function toTimestamp(value?: string | null) {
  if (!value) return 0;
  const t = new Date(value).getTime();
  return Number.isNaN(t) ? 0 : t;
}

function formatRemaining(ms: number) {
  if (ms <= 0) return "0 min";

  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes <= 0) return `${seconds}s`;

  return `${minutes} min ${seconds}s`;
}

function haversineMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const earthRadius = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadius * c;
}

const FINISH_RADIUS_METERS = 30;

export default function MyMissionsPage() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [q, setQ] = useState("");
  const [actingId, setActingId] = useState<number | null>(null);
  const [checkingRouteId, setCheckingRouteId] = useState<number | null>(null);
  const [restLoading, setRestLoading] = useState(false);
  const [now, setNow] = useState(Date.now());

  const [liveByMissionId, setLiveByMissionId] = useState<
    Record<number, VehicleLiveStatusDTO>
  >({});

  const load = useCallback(async (initial = false) => {
    if (initial) setLoading(true);
    setRefreshing(true);

    try {
      const ms = await missionService.getAll();
      setMissions(ms || []);

      const inProgress = (ms || []).filter((m) => m.status === "IN_PROGRESS");

      const liveEntries = await Promise.allSettled(
        inProgress.map(async (m) => ({
          missionId: m.id,
          live: await missionService.getLive(m.id),
        }))
      );

      const nextLiveMap: Record<number, VehicleLiveStatusDTO> = {};

      for (const entry of liveEntries) {
        if (entry.status === "fulfilled") {
          nextLiveMap[entry.value.missionId] = entry.value.live;
        }
      }

      setLiveByMissionId(nextLiveMap);
    } catch (e: any) {
      toast.error(
        e?.response?.data?.message ||
          e?.response?.data?.error ||
          e?.message ||
          "Failed to load missions"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load(true);

    const interval = window.setInterval(() => {
      load(false);
    }, 3000);

    return () => window.clearInterval(interval);
  }, [load]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const driverRestInfo = useMemo(() => {
    const restingMission = missions.find(
      (m) => m.driverStatus === "RESTING" && m.driverAvailableAt
    );

    if (!restingMission?.driverAvailableAt) return null;

    const availableAtMs = toTimestamp(restingMission.driverAvailableAt);
    const remainingMs = Math.max(availableAtMs - now, 0);

    return {
      status: restingMission.driverStatus || undefined,
      availableAt: restingMission.driverAvailableAt,
      remainingMs,
      remainingText: formatRemaining(remainingMs),
      canMarkReady: remainingMs <= 0,
    };
  }, [missions, now]);

  const sortedMissions = useMemo(() => {
    return [...missions].sort((a, b) => {
      const aInProgress = a.status === "IN_PROGRESS" ? 1 : 0;
      const bInProgress = b.status === "IN_PROGRESS" ? 1 : 0;

      if (aInProgress !== bInProgress) return bInProgress - aInProgress;

      const aPlanned = a.status === "PLANNED" ? 1 : 0;
      const bPlanned = b.status === "PLANNED" ? 1 : 0;

      if (aPlanned !== bPlanned) return bPlanned - aPlanned;

      return toTimestamp(b.startDate) - toTimestamp(a.startDate);
    });
  }, [missions]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return sortedMissions;

    return sortedMissions.filter((m) => {
      const text = [
        m.title,
        m.description,
        m.vehicleRegistrationNumber,
        m.status,
        m.departure,
        m.destination,
        m.driverName,
        m.driverStatus,
        m.routeCheckStatus,
        m.routeRiskLevel,
        m.returnDepotReason,
        m.depotCity,
        m.finalCity,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return text.includes(query);
    });
  }, [sortedMissions, q]);

  const canStartMission = useCallback(
    (mission: Mission) => {
      if (mission.status !== "PLANNED") return false;

      if (
        mission.routeCheckStatus === "NOT_CHECKED" ||
        !mission.routeCheckStatus
      ) {
        return false;
      }

      if (driverRestInfo && !driverRestInfo.canMarkReady) return false;

      const startTime = toTimestamp(mission.startDate);
      if (!startTime) return true;

      return now >= startTime;
    },
    [now, driverRestInfo]
  );

  const canFinishMission = useCallback(
    (mission: Mission) => {
      if (mission.status !== "IN_PROGRESS") return false;

      const live = liveByMissionId[mission.id];

      if (!live) return false;
      if (live.latitude == null || live.longitude == null) return false;
      if (!live.missionRoute || live.missionRoute.length === 0) return false;

      const lastPoint = live.missionRoute[live.missionRoute.length - 1];

      if (lastPoint.latitude == null || lastPoint.longitude == null) {
        return false;
      }

      const distance = haversineMeters(
        live.latitude,
        live.longitude,
        lastPoint.latitude,
        lastPoint.longitude
      );

      return distance <= FINISH_RADIUS_METERS;
    },
    [liveByMissionId]
  );

  const getStartBlockedMessage = useCallback(
    (mission: Mission) => {
      if (mission.status !== "PLANNED") {
        return "Only a planned mission can be started";
      }

      if (
        mission.routeCheckStatus === "NOT_CHECKED" ||
        !mission.routeCheckStatus
      ) {
        return "Veuillez vérifier la route avant de démarrer";
      }

      if (driverRestInfo && !driverRestInfo.canMarkReady) {
        return `Vous êtes en repos jusqu'à ${formatDateTime(
          driverRestInfo.availableAt
        )}`;
      }

      const startTime = toTimestamp(mission.startDate);

      if (startTime && now < startTime) {
        return `Mission can start at ${formatDateTime(mission.startDate)}`;
      }

      return null;
    },
    [now, driverRestInfo]
  );

  const getFinishBlockedMessage = useCallback(
    (mission: Mission) => {
      if (mission.status !== "IN_PROGRESS") {
        return "Only a mission in progress can be finished";
      }

      const live = liveByMissionId[mission.id];

      if (!live) return "Live position unavailable";

      if (live.latitude == null || live.longitude == null) {
        return "Current vehicle position unavailable";
      }

      if (!live.missionRoute || live.missionRoute.length === 0) {
        return "Mission route unavailable";
      }

      const lastPoint = live.missionRoute[live.missionRoute.length - 1];

      if (lastPoint.latitude == null || lastPoint.longitude == null) {
        return "Mission destination unavailable";
      }

      const distance = haversineMeters(
        live.latitude,
        live.longitude,
        lastPoint.latitude,
        lastPoint.longitude
      );

      if (distance > FINISH_RADIUS_METERS) {
        return `Vehicle is still ${Math.round(
          distance
        )} m away from destination`;
      }

      return null;
    },
    [liveByMissionId]
  );

  const handleCheckRoute = useCallback(async (mission: Mission) => {
    try {
      setCheckingRouteId(mission.id);

      const result: RouteCheckResult = await missionService.checkRoute(
        mission.id
      );

      setMissions((prev) =>
        prev.map((m) =>
          m.id === mission.id
            ? {
                ...m,
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
                routeJson: result.selectedRouteJson || m.routeJson,
              }
            : m
        )
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
      setCheckingRouteId(null);
    }
  }, []);

  const handleReady = useCallback(async () => {
    try {
      setRestLoading(true);

      await driverRestService.markReady();

      toast.success("Vous êtes maintenant disponible");
      await load(false);
    } catch (e: any) {
      toast.error(
        e?.response?.data?.message ||
          e?.response?.data?.error ||
          e?.message ||
          "Impossible de changer le statut du driver"
      );
    } finally {
      setRestLoading(false);
    }
  }, [load]);

  const handleMiddleRest = useCallback(
    async (mission: Mission) => {
      try {
        setRestLoading(true);

        await driverRestService.startMiddleRest(mission.id);

        toast.success("Repos de 30 minutes démarré");
        await load(false);
      } catch (e: any) {
        toast.error(
          e?.response?.data?.message ||
            e?.response?.data?.error ||
            e?.message ||
            "Impossible de démarrer le repos"
        );
      } finally {
        setRestLoading(false);
      }
    },
    [load]
  );

  const handleStart = useCallback(
    async (mission: Mission) => {
      try {
        setActingId(mission.id);

        await missionService.start(mission.id);

        toast.success("Mission démarrée");
        await load(false);
      } catch (e: any) {
        toast.error(
          e?.response?.data?.message ||
            e?.response?.data?.error ||
            e?.message ||
            "Impossible de démarrer la mission"
        );
      } finally {
        setActingId(null);
      }
    },
    [load]
  );

  const handleFinish = useCallback(
    async (mission: Mission) => {
      try {
        setActingId(mission.id);

        await missionService.finish(mission.id);

        toast.success("Mission terminée");
        await load(false);
      } catch (e: any) {
        toast.error(
          e?.response?.data?.message ||
            e?.response?.data?.error ||
            e?.message ||
            "Impossible de terminer la mission"
        );
      } finally {
        setActingId(null);
      }
    },
    [load]
  );

  const handleReturnToDepot = useCallback(
    async (mission: Mission) => {
      try {
        setActingId(mission.id);

        const result = await returnDepotService.suggest(mission.id);

        toast.success(
          result?.etaMinutes
            ? `Retour dépôt suggéré. ETA ${result.etaMinutes} min.`
            : "Retour dépôt suggéré."
        );

        await load(false);
      } catch (e: any) {
        toast.error(
          e?.response?.data?.message ||
            e?.response?.data?.error ||
            e?.message ||
            "Impossible de demander le retour dépôt"
        );
      } finally {
        setActingId(null);
      }
    },
    [load]
  );

  return (
    <ProtectedRoute allowedRoles={["ROLE_DRIVER"]}>
      <MyMissionsView
        missions={missions}
        filtered={filtered}
        loading={loading}
        refreshing={refreshing}
        q={q}
        setQ={setQ}
        actingId={actingId}
        checkingRouteId={checkingRouteId}
        now={now}
        driverRestInfo={driverRestInfo}
        restLoading={restLoading}
        onReady={handleReady}
        onRefresh={() => load(false)}
        onCheckRoute={handleCheckRoute}
        onStart={handleStart}
        onFinish={handleFinish}
        onMiddleRest={handleMiddleRest}
        onReturnToDepot={handleReturnToDepot}
        canStartMission={canStartMission}
        canFinishMission={canFinishMission}
        getStartBlockedMessage={getStartBlockedMessage}
        getFinishBlockedMessage={getFinishBlockedMessage}
        formatDateTime={formatDateTime}
      />
    </ProtectedRoute>
  );
}