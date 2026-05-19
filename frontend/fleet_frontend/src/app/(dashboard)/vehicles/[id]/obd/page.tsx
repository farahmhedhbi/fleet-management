"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import SockJS from "sockjs-client";
import { Client, type IMessage } from "@stomp/stompjs";
import { Fuel, Loader2, RefreshCcw } from "lucide-react";
import { toast } from "react-toastify";

import ObdLiveCard from "@/components/obd/ObdLiveCard";
import VehicleHealthSummaryCard from "@/components/obd/VehicleHealthSummaryCard";
import ObdAlertList from "@/components/obd/ObdAlertList";
import { obdService } from "@/lib/services/obdService";
import { obdAnalysisService } from "@/lib/services/obdAnalysisService";
import type { VehicleObdLiveDTO } from "@/types/obd";
import type { ObdAlertDTO, VehicleHealthSummaryDTO } from "@/types/obd-alert";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

function hasFuelAlert(alerts: ObdAlertDTO[]) {
  return alerts.some((a) => String(a.code || "").startsWith("LOW_FUEL"));
}

export default function VehicleObdPage() {
  const params = useParams();
  const vehicleId = Number(params.id);
  const stompRef = useRef<Client | null>(null);

  const [live, setLive] = useState<VehicleObdLiveDTO | null>(null);
  const [summary, setSummary] = useState<VehicleHealthSummaryDTO | null>(null);
  const [alerts, setAlerts] = useState<ObdAlertDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [confirmingFuel, setConfirmingFuel] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load(showLoader = false) {
    if (!vehicleId || Number.isNaN(vehicleId)) return;

    try {
      if (showLoader) setRefreshing(true);
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
      setRefreshing(false);
    }
  }

  async function confirmFuelRefilled() {
    if (!vehicleId || Number.isNaN(vehicleId)) return;

    try {
      setConfirmingFuel(true);

      await obdService.confirmFuelRefilled(vehicleId);

      toast.success("Ravitaillement confirmé. Alerte carburant résolue.");

      await load(true);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Impossible de confirmer le ravitaillement."
      );
    } finally {
      setConfirmingFuel(false);
    }
  }

  useEffect(() => {
    load();
  }, [vehicleId]);

  useEffect(() => {
    if (!vehicleId || Number.isNaN(vehicleId)) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(`${API_BASE_URL}/ws`),
      reconnectDelay: 5000,
      debug: (msg) => console.log("[OBD-STOMP]", msg),

      onConnect: () => {
        console.log("✅ OBD WebSocket connected");
        setWsConnected(true);

        client.subscribe(`/topic/vehicles/${vehicleId}/obd`, async (message: IMessage) => {
          const data = JSON.parse(message.body) as VehicleObdLiveDTO;
          setLive(data);

          const [summaryData, alertsData] = await Promise.all([
            obdAnalysisService.getVehicleSummary(vehicleId),
            obdAnalysisService.getVehicleAlerts(vehicleId),
          ]);

          setSummary(summaryData);
          setAlerts(Array.isArray(alertsData) ? alertsData : []);
        });

        client.subscribe(`/topic/vehicles/${vehicleId}/events`, async () => {
          const [summaryData, alertsData] = await Promise.all([
            obdAnalysisService.getVehicleSummary(vehicleId),
            obdAnalysisService.getVehicleAlerts(vehicleId),
          ]);

          setSummary(summaryData);
          setAlerts(Array.isArray(alertsData) ? alertsData : []);
        });
      },

      onWebSocketClose: () => {
        setWsConnected(false);
      },

      onStompError: (frame) => {
        console.error("❌ OBD STOMP error:", frame);
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
  }, [vehicleId]);

  useEffect(() => {
    if (!vehicleId || Number.isNaN(vehicleId)) return;

    const interval = window.setInterval(() => {
      if (!wsConnected) load();
    }, 5000);

    return () => window.clearInterval(interval);
  }, [vehicleId, wsConnected]);

  if (loading) {
    return <div className="p-6 text-sm text-slate-500">Chargement OBD...</div>;
  }

  if (error) {
    return <div className="p-6 text-sm text-red-600">{error}</div>;
  }

  if (!live || !summary) {
    return <div className="p-6 text-sm text-slate-500">Aucune donnée OBD.</div>;
  }

  const fuelAlertActive = hasFuelAlert(alerts);

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Diagnostic OBD</h1>
          <p className="text-sm text-slate-500">
            Suivi moteur, carburant, batterie, température et alertes techniques.
          </p>
          <p className="mt-1 text-xs font-semibold">
            {wsConnected ? "🟢 OBD WebSocket connecté" : "🟠 Fallback API"}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => load(true)}
            disabled={refreshing || confirmingFuel}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            {refreshing ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <RefreshCcw size={16} />
            )}
            Actualiser
          </button>

          {fuelAlertActive && (
            <button
              type="button"
              onClick={confirmFuelRefilled}
              disabled={confirmingFuel || refreshing}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {confirmingFuel ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <Fuel size={16} />
              )}
              Confirmer ravitaillement
            </button>
          )}

          <Link
            href={`/vehicles/${vehicleId}/obd/history`}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Voir historique
          </Link>
        </div>
      </div>

      {fuelAlertActive && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <p className="font-bold">Carburant faible détecté</p>
          <p className="mt-1">
            Après ravitaillement, clique sur “Confirmer ravitaillement” pour
            résoudre l’alerte OBD et synchroniser le simulateur.
          </p>
        </div>
      )}

      <ObdLiveCard data={live} />
      <VehicleHealthSummaryCard data={summary} />
      <ObdAlertList alerts={alerts} />
    </div>
  );
}