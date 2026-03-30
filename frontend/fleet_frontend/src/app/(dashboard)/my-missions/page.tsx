"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { missionService } from "@/lib/services/missionService";
import type { Mission } from "@/types/mission";
import { toast } from "react-toastify";
import MyMissionsView from "./MyMissionsView";

function formatDateTime(value?: string) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

export default function MyMissionsPage() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [q, setQ] = useState("");
  const [actingId, setActingId] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const ms = await missionService.getAll();
      setMissions(ms);
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
  }, [load]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return missions;

    return missions.filter((m) => {
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
  }, [missions, q]);

  const canStartMission = useCallback((mission: Mission) => {
    return mission.status === "PLANNED";
  }, []);

  const canFinishMission = useCallback((mission: Mission) => {
    return mission.status === "IN_PROGRESS";
  }, []);

  const getStartBlockedMessage = useCallback((mission: Mission) => {
    if (mission.status !== "PLANNED") {
      return "Only a planned mission can be started";
    }
    return null;
  }, []);

  const getFinishBlockedMessage = useCallback((mission: Mission) => {
    if (mission.status !== "IN_PROGRESS") {
      return "Only a mission in progress can be finished";
    }
    return null;
  }, []);

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