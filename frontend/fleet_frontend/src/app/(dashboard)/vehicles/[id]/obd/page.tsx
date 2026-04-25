"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ObdLiveCard from "@/components/obd/ObdLiveCard";
import VehicleHealthSummaryCard from "@/components/obd/VehicleHealthSummaryCard";
import ObdAlertList from "@/components/obd/ObdAlertList";
import { obdService } from "@/lib/services/obdService";
import { obdAnalysisService } from "@/lib/services/obdAnalysisService";
import type { VehicleObdLiveDTO } from "@/types/obd";
import type { ObdAlertDTO, VehicleHealthSummaryDTO } from "@/types/obd-alert";

export default function VehicleObdPage() {
  const params = useParams();
  const vehicleId = Number(params.id);

  const [live, setLive] = useState<VehicleObdLiveDTO | null>(null);
  const [summary, setSummary] = useState<VehicleHealthSummaryDTO | null>(null);
  const [alerts, setAlerts] = useState<ObdAlertDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!vehicleId || Number.isNaN(vehicleId)) return;

    try {
      setError(null);

      const [liveData, summaryData, alertsData] = await Promise.all([
        obdService.getVehicleLive(vehicleId),
        obdAnalysisService.getVehicleSummary(vehicleId),
        obdAnalysisService.getVehicleAlerts(vehicleId),
      ]);

      setLive(liveData);
      setSummary(summaryData);
      setAlerts(Array.isArray(alertsData) ? alertsData : []);
    } catch (e) {
      console.error(e);
      setError("Impossible de charger les données OBD.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!vehicleId || Number.isNaN(vehicleId)) return;

    load();
    const interval = window.setInterval(load, 5000);

    return () => window.clearInterval(interval);
  }, [vehicleId]);

  if (loading) {
    return <div className="p-6 text-sm text-slate-500">Chargement OBD...</div>;
  }

  if (error) {
    return <div className="p-6 text-sm text-red-600">{error}</div>;
  }

  if (!live || !summary) {
    return <div className="p-6 text-sm text-slate-500">Aucune donnée OBD.</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Diagnostic OBD</h1>
          <p className="text-sm text-slate-500">
            Suivi moteur, carburant, batterie, température et alertes techniques.
          </p>
        </div>

        <Link
          href={`/vehicles/${vehicleId}/obd/history`}
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Voir historique
        </Link>
      </div>

      <ObdLiveCard data={live} />
      <VehicleHealthSummaryCard data={summary} />
      <ObdAlertList alerts={alerts} />
    </div>
  );
}