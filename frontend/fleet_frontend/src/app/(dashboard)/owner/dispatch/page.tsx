"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import SmartAssignmentForm from "@/components/dispatch/SmartAssignmentForm";
import DispatchResult from "@/components/dispatch/DispatchResult";
import { missionService } from "@/lib/services/missionService";
import { subscribeGpsLive } from "@/lib/websocket";

import type {
  DispatchSuggestionDTO,
  SmartAssignmentRequest,
} from "@/types/dispatch";
import type { MissionDTO } from "@/types/mission";
import type { VehicleLiveStatusDTO } from "@/types/gps";

export default function OwnerDispatchPage() {
  const [result, setResult] = useState<DispatchSuggestionDTO | null>(null);
  const [lastForm, setLastForm] = useState<SmartAssignmentRequest | null>(null);
  const [creating, setCreating] = useState(false);

  const [liveVehicles, setLiveVehicles] = useState<
    Record<number, VehicleLiveStatusDTO>
  >({});

  useEffect(() => {
    const unsubscribe = subscribeGpsLive((data: VehicleLiveStatusDTO) => {
      if (!data?.vehicleId) return;

      setLiveVehicles((prev) => ({
        ...prev,
        [data.vehicleId]: data,
      }));
    });

    return () => {
      unsubscribe?.();
    };
  }, []);

  async function confirmMission() {
    if (!result) return toast.warn("Génère d'abord une suggestion.");
    if (!lastForm) return toast.warn("Données mission manquantes.");
    if (!result.vehicleId || !result.driverId) {
      return toast.warn("Véhicule ou driver invalide.");
    }

    setCreating(true);

    try {
      const payload: MissionDTO = {
        title: `${lastForm.startCity} → ${lastForm.destinationCity}`,
        description: "Mission créée depuis Smart Assignment",
        departure: lastForm.startCity,
        destination: lastForm.destinationCity,
        startDate: lastForm.startTime,
        endDate: lastForm.expectedEndTime,
        vehicleId: result.vehicleId,
        driverId: result.driverId,
      };

      await missionService.create(payload);

      toast.success("Mission créée avec succès.");
      setResult(null);
      setLastForm(null);

      window.location.href = "/missions";
    } catch (e: any) {
      console.error(e);
      toast.error(
        e?.response?.data?.message ||
          e?.response?.data?.error ||
          e?.message ||
          "Erreur création mission"
      );
    } finally {
      setCreating(false);
    }
  }

  const liveList = Object.values(liveVehicles);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">
            Smart Dispatch Center
          </h1>

          <p className="mt-1 text-gray-500">
            Suggestion intelligente avec position GPS live des véhicules.
          </p>
        </div>

        <LiveFleetStatus vehicles={liveList} />

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <SmartAssignmentForm
            onResult={(res, formData) => {
              setResult(res);
              setLastForm(formData);
            }}
          />

          <div className="space-y-4">
            <DispatchResult result={result} />

            <button
              type="button"
              onClick={confirmMission}
              disabled={creating || !result}
              className={`w-full rounded-xl px-4 py-3 font-bold text-white transition ${
                result
                  ? "bg-green-600 hover:bg-green-700"
                  : "cursor-not-allowed bg-gray-400"
              } disabled:opacity-70`}
            >
              {creating
                ? "Création en cours..."
                : "Confirmer et créer la mission"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function LiveFleetStatus({ vehicles }: { vehicles: VehicleLiveStatusDTO[] }) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">
            Live Fleet Status
          </h2>
          <p className="text-sm text-gray-500">
            Positions reçues en temps réel depuis WebSocket.
          </p>
        </div>

        <span className="rounded-full bg-green-50 px-3 py-1 text-sm font-bold text-green-700">
          Live
        </span>
      </div>

      {vehicles.length === 0 ? (
        <div className="mt-4 rounded-xl bg-gray-50 p-4 text-sm text-gray-500">
          Aucun véhicule reçu en temps réel pour le moment.
        </div>
      ) : (
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {vehicles.map((v) => (
            <div
              key={v.vehicleId}
              className="rounded-xl border border-gray-200 bg-gray-50 p-4"
            >
              <div className="flex items-center justify-between">
                <p className="font-bold text-gray-900">
                  {v.registrationNumber || `Vehicle #${v.vehicleId}`}
                </p>

                <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700">
                  {v.liveStatus || "LIVE"}
                </span>
              </div>

              <div className="mt-3 space-y-1 text-sm text-gray-600">
                <p>Latitude: {v.latitude ?? "—"}</p>
                <p>Longitude: {v.longitude ?? "—"}</p>
                <p>Speed: {v.speed ?? 0} km/h</p>
                <p>Engine: {v.engineOn ? "ON" : "OFF"}</p>
                <p>Updated: {formatDate(v.timestamp)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;

  return d.toLocaleString("fr-FR");
}