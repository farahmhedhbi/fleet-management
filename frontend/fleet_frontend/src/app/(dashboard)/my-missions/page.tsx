"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { missionService } from "@/lib/services/missionService";
import type { Mission } from "@/types/mission";
import type { VehicleLiveStatusDTO } from "@/types/gps";
import { toast } from "react-toastify";
import MyMissionsView from "./MyMissionsView";

function formatDateTime(value?: string) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

function toTimestamp(value?: string) {
  if (!value) return 0;
  const t = new Date(value).getTime();
  return Number.isNaN(t) ? 0 : t;
}

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
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
  const [now, setNow] = useState(Date.now());
  const [liveByMissionId, setLiveByMissionId] = useState<Record<number, VehicleLiveStatusDTO>>({});

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const ms = await missionService.getAll();
      setMissions(ms);

      const inProgress = ms.filter((m) => m.status === "IN_PROGRESS");

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
      console.error("Failed to load missions:", e);
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
    load();

    const interval = window.setInterval(() => {
      load();
    }, 3000);

    return () => window.clearInterval(interval);
  }, [load]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const sortedMissions = useMemo(() => {
    return [...missions].sort((a, b) => {
      const aInProgress = a.status === "IN_PROGRESS" ? 1 : 0;
      const bInProgress = b.status === "IN_PROGRESS" ? 1 : 0;

      if (aInProgress !== bInProgress) {
        return bInProgress - aInProgress;
      }

      const aPlanned = a.status === "PLANNED" ? 1 : 0;
      const bPlanned = b.status === "PLANNED" ? 1 : 0;

      if (aPlanned !== bPlanned) {
        return bPlanned - aPlanned;
      }

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

      const startTime = toTimestamp(mission.startDate);
      if (!startTime) return true;

      return now >= startTime;
    },
    [now]
  );

  const canFinishMission = useCallback(
    (mission: Mission) => {
      if (mission.status !== "IN_PROGRESS") return false;

      const live = liveByMissionId[mission.id];
      if (!live) return false;
      if (live.latitude == null || live.longitude == null) return false;
      if (!live.missionRoute || live.missionRoute.length === 0) return false;

      const lastPoint = live.missionRoute[live.missionRoute.length - 1];
      if (lastPoint.latitude == null || lastPoint.longitude == null) return false;

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

      const startTime = toTimestamp(mission.startDate);
      if (startTime && now < startTime) {
        return `Mission can start at ${formatDateTime(mission.startDate)}`;
      }

      return null;
    },
    [now]
  );

  const getFinishBlockedMessage = useCallback(
    (mission: Mission) => {
      if (mission.status !== "IN_PROGRESS") {
        return "Only a mission in progress can be finished";
      }

      const live = liveByMissionId[mission.id];
      if (!live) {
        return "Live position unavailable";
      }

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
        return `Vehicle is still ${Math.round(distance)} m away from destination`;
      }

      return null;
    },
    [liveByMissionId]
  );

  const handleStart = useCallback(
    async (mission: Mission) => {
      try {
        setActingId(mission.id);
        await missionService.start(mission.id);
        toast.success("Mission démarrée");
        await load();
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
        await load();
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
        now={now}
        onRefresh={load}
        onStart={handleStart}
        onFinish={handleFinish}
        canStartMission={canStartMission}
        canFinishMission={canFinishMission}
        getStartBlockedMessage={getStartBlockedMessage}
        getFinishBlockedMessage={getFinishBlockedMessage}
        formatDateTime={formatDateTime}
      />
    </ProtectedRoute>
  );
}