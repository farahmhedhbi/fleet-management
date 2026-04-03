"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import VehicleHistoryMap from "@/components/gps/VehicleHistoryMap";
import { missionService } from "@/lib/services/missionService";
import type { Mission } from "@/types/mission";
import type { GpsData } from "@/types/gps";
import { toast } from "react-toastify";

function formatDateTime(value?: string) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

export default function DriverMissionHistoryPage() {
  const params = useParams<{ id: string }>();
  const missionId = Number(params.id);

  const [mission, setMission] = useState<Mission | null>(null);
  const [history, setHistory] = useState<GpsData[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [missionData, historyData] = await Promise.all([
        missionService.getById(missionId),
        missionService.getHistory(missionId),
      ]);

      setMission(missionData);
      setHistory(historyData);
    } catch (e: any) {
      console.error(e);
      toast.error(
        e?.response?.data?.message ||
          e?.response?.data?.error ||
          e?.message ||
          "Impossible de charger l'historique"
      );
    } finally {
      setLoading(false);
    }
  }, [missionId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["ROLE_DRIVER"]}>
        <div className="p-6 md:p-10">Chargement...</div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["ROLE_DRIVER"]}>
      <div className="p-6 md:p-10 space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h1 className="text-2xl font-extrabold text-slate-900">Historique trajet</h1>
          <p className="mt-1 text-slate-600">
            {mission?.title || "Mission"} — {mission?.departure} → {mission?.destination}
          </p>

          <div className="mt-4 grid gap-2 text-sm text-slate-700 md:grid-cols-2">
            <div><strong>Véhicule :</strong> {mission?.vehicleRegistrationNumber || "—"}</div>
            <div><strong>Statut :</strong> {mission?.status || "—"}</div>
            <div><strong>Début réel :</strong> {formatDateTime(mission?.startedAt || mission?.startDate)}</div>
            <div><strong>Fin réelle :</strong> {formatDateTime(mission?.finishedAt || mission?.endDate)}</div>
            <div><strong>Nombre de points GPS :</strong> {history.length}</div>
          </div>
        </div>

        <VehicleHistoryMap history={history} />

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Points GPS</h2>

          {history.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">Aucun point GPS trouvé pour cette mission.</p>
          ) : (
            <div className="mt-4 max-h-[420px] overflow-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold text-slate-700">Date</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-700">Latitude</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-700">Longitude</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-700">Speed</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-700">Engine</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((point) => (
                    <tr key={point.id} className="border-t border-slate-100">
                      <td className="px-3 py-2">{formatDateTime(point.timestamp)}</td>
                      <td className="px-3 py-2">{point.latitude}</td>
                      <td className="px-3 py-2">{point.longitude}</td>
                      <td className="px-3 py-2">{point.speed}</td>
                      <td className="px-3 py-2">{point.engineOn ? "ON" : "OFF"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}