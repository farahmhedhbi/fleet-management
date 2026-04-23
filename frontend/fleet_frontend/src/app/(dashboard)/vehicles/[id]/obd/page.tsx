"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ObdLiveCard from "@/components/obd/ObdLiveCard";
import { obdService } from "@/lib/services/obdService";
import type { VehicleObdLiveDTO } from "@/types/obd";
import VehicleHealthSummaryCard from "@/components/obd/VehicleHealthSummaryCard";
import ObdAlertList from "@/components/obd/ObdAlertList";
import { obdAnalysisService } from "@/lib/services/obdAnalysisService";
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
    try {
      setError(null);

      const [liveData, summaryData, alertsData] = await Promise.all([
        obdService.getVehicleLive(vehicleId),
        obdAnalysisService.getVehicleSummary(vehicleId),
        obdAnalysisService.getVehicleAlerts(vehicleId),
      ]);

      setLive(liveData);
      setSummary(summaryData);
      setAlerts(alertsData);
    } catch {
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
      <ObdLiveCard data={live} />
      <VehicleHealthSummaryCard data={summary} />
      <ObdAlertList alerts={alerts} />
    </div>
  );
}