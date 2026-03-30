"use client";

import type { VehicleLiveStatusDTO } from "@/types/gps";
import { formatTimestamp, getStatusClasses, getStatusLabel } from "@/lib/utils/gps";

interface VehicleGpsCardProps {
  vehicle: VehicleLiveStatusDTO;
  isSelected: boolean;
  onClick: () => void;
}

export default function VehicleGpsCard({
  vehicle,
  isSelected,
  onClick,
}: VehicleGpsCardProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-2xl border p-4 text-left shadow-sm transition hover:shadow-md ${
        isSelected ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white"
      }`}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-gray-900">{vehicle.vehicleName}</h3>
          <p className="text-sm text-gray-500">
            Driver : {vehicle.currentDriverName || "Aucun"}
          </p>
        </div>

        <span
          className={`rounded-full border px-2 py-1 text-xs font-medium ${getStatusClasses(
            vehicle.liveStatus
          )}`}
        >
          {getStatusLabel(vehicle.liveStatus)}
        </span>
      </div>

      <div className="grid gap-1 text-sm text-gray-600">
        <p>
          <span className="font-medium">Vitesse :</span> {vehicle.speed} km/h
        </p>
        <p>
          <span className="font-medium">Mission active :</span>{" "}
          {vehicle.missionActive ? "Oui" : "Non"}
        </p>
        <p>
          <span className="font-medium">Moteur :</span>{" "}
          {vehicle.engineOn ? "ON" : "OFF"}
        </p>
        <p>
          <span className="font-medium">Source route :</span>{" "}
          {vehicle.routeSource || "-"}
        </p>
        <p>
          <span className="font-medium">Dernière mise à jour :</span>{" "}
          {formatTimestamp(vehicle.timestamp)}
        </p>
      </div>
    </button>
  );
}