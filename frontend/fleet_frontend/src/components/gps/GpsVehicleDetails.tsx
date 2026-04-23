"use client";

import type { GpsData, VehicleLiveStatusDTO } from "@/types/gps";
import { formatTimestamp, getStatusClasses, getStatusLabel } from "@/lib/utils/gps";

interface GpsVehicleDetailsProps {
  vehicle: VehicleLiveStatusDTO | null;
  history: GpsData[];
  loadingHistory: boolean;
}

export default function GpsVehicleDetails({
  vehicle,
  history,
  loadingHistory,
}: GpsVehicleDetailsProps) {
  if (!vehicle) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-gray-500">Sélectionnez un véhicule pour voir ses détails.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{vehicle.vehicleName}</h2>
          <p className="text-sm text-gray-500">
            Driver courant : {vehicle.currentDriverName || "Aucun"}
          </p>
        </div>

        <span
          className={`rounded-full border px-3 py-1 text-sm font-medium ${getStatusClasses(
            vehicle.liveStatus
          )}`}
        >
          {getStatusLabel(vehicle.liveStatus)}
        </span>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Mission active</p>
          <p className="font-semibold text-gray-900">
            {vehicle.missionActive ? "Oui" : "Non"}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Vitesse</p>
          <p className="font-semibold text-gray-900">{vehicle.speed} km/h</p>
        </div>

        <div className="rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Moteur</p>
          <p className="font-semibold text-gray-900">
            {vehicle.engineOn ? "ON" : "OFF"}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Dernier timestamp</p>
          <p className="font-semibold text-gray-900">
            {formatTimestamp(vehicle.timestamp)}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Route source</p>
          <p className="font-semibold text-gray-900">{vehicle.routeSource || "-"}</p>
        </div>

        <div className="rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Route ID</p>
          <p className="font-semibold text-gray-900">{vehicle.routeId || "-"}</p>
        </div>

        <div className="rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Mission ID</p>
          <p className="font-semibold text-gray-900">{vehicle.missionId ?? "-"}</p>
        </div>

        <div className="rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Mission status</p>
          <p className="font-semibold text-gray-900">{vehicle.missionStatus || "-"}</p>
        </div>

        <div className="rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Historique points</p>
          <p className="font-semibold text-gray-900">
            {loadingHistory ? "Chargement..." : history.length}
          </p>
        </div>
      </div>
    </div>
  );
}