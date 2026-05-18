"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { missionService } from "@/lib/services/missionService";
import type { Mission } from "@/types/mission";
import MissionsView from "./MissionsView";

type MissionStatusFilter =
  | "ALL"
  | "PLANNED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELED";

export default function MissionsPage() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<MissionStatusFilter>("ALL");

  async function loadAll() {
    setRefreshing(true);

    try {
      const data = await missionService.getAll();
      setMissions(data || []);
    } catch (e: any) {
      console.error(e);
      toast.error(
        e?.response?.data?.message ||
          e?.response?.data?.error ||
          e?.message ||
          "Erreur chargement missions"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();

    return missions.filter((m) => {
      const matchesStatus =
        statusFilter === "ALL" ? true : m.status === statusFilter;

      const matchesSearch = !query
        ? true
        : `${m.title || ""} ${m.description || ""} ${m.departure || ""} ${
            m.destination || ""
          } ${m.status || ""} ${m.driverName || ""} ${
            m.vehicleRegistrationNumber || ""
          }`
            .toLowerCase()
            .includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [missions, q, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: missions.length,
      planned: missions.filter((m) => m.status === "PLANNED").length,
      inProgress: missions.filter((m) => m.status === "IN_PROGRESS").length,
      completed: missions.filter((m) => m.status === "COMPLETED").length,
      canceled: missions.filter((m) => m.status === "CANCELED").length,
    };
  }, [missions]);

  async function deleteMission(id: number) {
    if (!confirm("Supprimer cette mission ?")) return;

    try {
      await missionService.remove(id);
      toast.success("Mission supprimée.");
      await loadAll();
    } catch (e: any) {
      console.error(e);
      toast.error(
        e?.response?.data?.message ||
          e?.response?.data?.error ||
          e?.message ||
          "Erreur suppression mission"
      );
    }
  }

  async function cancelMission(id: number) {
    if (!confirm("Annuler cette mission ?")) return;

    try {
      await missionService.cancel(id);
      toast.success("Mission annulée.");
      await loadAll();
    } catch (e: any) {
      console.error(e);
      toast.error(
        e?.response?.data?.message ||
          e?.response?.data?.error ||
          e?.message ||
          "Erreur annulation mission"
      );
    }
  }

  return (
    <ProtectedRoute allowedRoles={["ROLE_OWNER"]}>
      <MissionsView
        filtered={filtered}
        loading={loading}
        refreshing={refreshing}
        q={q}
        setQ={setQ}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        stats={stats}
        onRefresh={loadAll}
        onDeleteMission={deleteMission}
        onCancelMission={cancelMission}
      />
    </ProtectedRoute>
  );
}