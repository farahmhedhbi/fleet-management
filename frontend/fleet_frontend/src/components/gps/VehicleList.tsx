"use client";

import type { VehicleLiveStatusDTO } from "@/types/gps";
import { getStatusLabel } from "@/lib/utils/gps";

interface Props {
  vehicles: VehicleLiveStatusDTO[];
  selectedVehicleId: number | null;
  onSelect: (vehicleId: number) => void;
}

export default function VehicleList({
  vehicles,
  selectedVehicleId,
  onSelect,
}: Props) {
  return (
    <div className="grid gap-3">
      {vehicles.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-500">
          Aucun véhicule trouvé.
        </div>
      ) : (
        vehicles.map((vehicle) => (
          <button
            key={vehicle.vehicleId}
            onClick={() => onSelect(vehicle.vehicleId)}
            className={`rounded-xl border p-4 text-left transition ${
              selectedVehicleId === vehicle.vehicleId
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 bg-white hover:bg-gray-50"
            }`}
          >
            <div className="font-semibold">{vehicle.vehicleName}</div>
            <div className="text-sm text-gray-600">
              Statut: {getStatusLabel(vehicle.liveStatus)}
            </div>
            <div className="text-sm text-gray-600">Vitesse: {vehicle.speed} km/h</div>
            <div className="text-sm text-gray-600">
              Mission: {vehicle.missionActive ? "Oui" : "Non"}
            </div>
            <div className="text-sm text-gray-600">
              Driver: {vehicle.currentDriverName || "Aucun"}
            </div>
            <div className="text-sm text-gray-600">
              Route source: {vehicle.routeSource || "-"}
            </div>
          </button>
        ))
      )}
    </div>
  );
}