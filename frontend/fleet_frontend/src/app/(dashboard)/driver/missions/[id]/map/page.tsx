"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "react-toastify";

import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import FleetLiveMap from "@/components/gps/FleetLiveMap";
import { missionService } from "@/lib/services/missionService";

import type { Mission } from "@/types/mission";
import type { GpsData, VehicleLiveStatusDTO } from "@/types/gps";

function formatDateTime(value?: string) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

export default function DriverMissionMapPage() {
  const params = useParams<{ id: string }>();
  const missionId = Number(params.id);

  const [mission, setMission] = useState<Mission | null>(null);
  const [live, setLive] = useState<VehicleLiveStatusDTO | null>(null);
  const [history, setHistory] = useState<GpsData[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMissionMap = useCallback(async () => {
    if (!missionId || Number.isNaN(missionId)) {
      toast.error("ID mission invalide");
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
  }, [missionId]);

  useEffect(() => {
    loadMissionMap();
  }, [loadMissionMap]);

  useEffect(() => {
    if (!missionId || Number.isNaN(missionId)) return;

    const interval = window.setInterval(async () => {
      try {
        const [liveData, historyData] = await Promise.all([
          missionService.getLive(missionId),
          missionService.getHistory(missionId),
        ]);

        setLive(liveData);
        setHistory(historyData);
      } catch (e) {
        console.error("Erreur refresh carte mission :", e);
      }
    }, 10000);

    return () => window.clearInterval(interval);
  }, [missionId]);

  const vehicles = useMemo(() => {
    return live ? [live] : [];
  }, [live]);

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
          <h1 className="text-2xl font-extrabold text-slate-900">
            Carte live mission
          </h1>

          <p className="mt-1 text-slate-600">
            {mission?.title || "Mission"} — {mission?.departure || "—"} →{" "}
            {mission?.destination || "—"}
          </p>

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