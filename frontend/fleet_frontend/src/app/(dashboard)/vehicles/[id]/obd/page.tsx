"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import SockJS from "sockjs-client";
import { Client, type IMessage } from "@stomp/stompjs";

import ObdLiveCard from "@/components/obd/ObdLiveCard";
import VehicleHealthSummaryCard from "@/components/obd/VehicleHealthSummaryCard";
import ObdAlertList from "@/components/obd/ObdAlertList";
import { obdService } from "@/lib/services/obdService";
import { obdAnalysisService } from "@/lib/services/obdAnalysisService";
import type { VehicleObdLiveDTO } from "@/types/obd";
import type { ObdAlertDTO, VehicleHealthSummaryDTO } from "@/types/obd-alert";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export default function VehicleObdPage() {
  const params = useParams();
  const vehicleId = Number(params.id);
  const stompRef = useRef<Client | null>(null);

  const [live, setLive] = useState<VehicleObdLiveDTO | null>(null);
  const [summary, setSummary] = useState<VehicleHealthSummaryDTO | null>(null);
  const [alerts, setAlerts] = useState<ObdAlertDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [wsConnected, setWsConnected] = useState(false);
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

        client.subscribe(`/topic/vehicles/${vehicleId}/obd`, (message: IMessage) => {
          const data = JSON.parse(message.body) as VehicleObdLiveDTO;
          console.log("✅ WS OBD live:", data);
          setLive(data);
        });

        client.subscribe(`/topic/vehicles/${vehicleId}/events`, async (message: IMessage) => {
          const event = JSON.parse(message.body);
          console.log("✅ WS OBD/Event:", event);

          const alertsData = await obdAnalysisService.getVehicleAlerts(vehicleId);
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