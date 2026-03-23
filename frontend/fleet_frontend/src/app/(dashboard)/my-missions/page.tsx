"use client";

import { useEffect, useMemo, useState } from "react";
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

  const load = async () => {
    setRefreshing(true);
    try {
      const ms = await missionService.getAll();
      setMissions(ms);
    } catch (e: any) {
      console.error(e);
      toast.error(
        e?.response?.data?.message || e?.message || "Failed to load missions"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return missions;

    return missions.filter((m) => {
      const text =
        `${m.title ?? ""} ${m.description ?? ""} ${m.vehicleRegistrationNumber ?? ""} ${m.status ?? ""}`.toLowerCase();

      return text.includes(query);
    });
  }, [missions, q]);

  const canStartMission = (m: Mission) => {
    if (m.status !== "PLANNED") return false;

    const startTime = new Date(m.startDate).getTime();
    if (Number.isNaN(startTime)) return false;

    return now >= startTime;
  };

  const canFinishMission = (m: Mission) => {
    if (m.status !== "IN_PROGRESS") return false;

    const endTime = new Date(m.endDate).getTime();
    if (Number.isNaN(endTime)) return false;

    return now >= endTime;
  };

  const getStartBlockedMessage = (m: Mission) => {
    if (m.status !== "PLANNED") return null;

    const startTime = new Date(m.startDate).getTime();
    if (Number.isNaN(startTime)) return "Invalid mission start date.";

    if (now < startTime) {
      return `You can start this mission only at ${formatDateTime(m.startDate)}.`;
    }

    return null;
  };

  const getFinishBlockedMessage = (m: Mission) => {
    if (m.status !== "IN_PROGRESS") return null;

    const endTime = new Date(m.endDate).getTime();
    if (Number.isNaN(endTime)) return "Invalid mission end date.";

    if (now < endTime) {
      return `You can finish this mission only at ${formatDateTime(m.endDate)}.`;
    }

    return null;
  };

  const start = async (m: Mission) => {
    if (!canStartMission(m)) {
      const msg =
        getStartBlockedMessage(m) || "You cannot start this mission yet.";
      toast.warning(msg);
      return;
    }

    setActingId(m.id);
    try {
      await missionService.start(m.id);
      toast.success("Mission started ✅ (Owner notified)");
      await load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e?.message || "Start failed");
    } finally {
      setActingId(null);
    }
  };

  const finish = async (m: Mission) => {
    if (!canFinishMission(m)) {
      const msg =
        getFinishBlockedMessage(m) || "You cannot finish this mission yet.";
      toast.warning(msg);
      return;
    }

    setActingId(m.id);
    try {
      await missionService.finish(m.id);
      toast.success("Mission finished ✅ (Owner notified)");
      await load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e?.message || "Finish failed");
    } finally {
      setActingId(null);
    }
  };

  return (
    <ProtectedRoute requiredRoles={["ROLE_DRIVER"]}>
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
        onStart={start}
        onFinish={finish}
        canStartMission={canStartMission}
        canFinishMission={canFinishMission}
        getStartBlockedMessage={getStartBlockedMessage}
        getFinishBlockedMessage={getFinishBlockedMessage}
        formatDateTime={formatDateTime}
      />
    </ProtectedRoute>
  );
}