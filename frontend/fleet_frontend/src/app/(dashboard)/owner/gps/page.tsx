"use client";

import GpsFilterBar from "@/components/gps/GpsFilterBar";
import GpsLiveMap from "@/components/gps/GpsLiveMap";
import GpsVehicleDetails from "@/components/gps/GpsVehicleDetails";
import VehicleGpsCard from "@/components/gps/VehicleGpsCard";
import { useGpsDashboard } from "@/hooks/useGpsDashboard";

export default function OwnerGpsPage() {
  const {
    vehicles,
    filteredVehicles,
    selectedVehicle,
    selectedVehicleId,
    setSelectedVehicleId,
    history,
    loadingFleet,
    loadingHistory,
    error,
    filter,
    setFilter,
    search,
    setSearch,
  } = useGpsDashboard({ role: "owner" });

  if (loadingFleet) {
    return <div className="p-6 text-gray-700">Chargement GPS owner...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">GPS Owner</h1>
        <p className="text-sm text-gray-600">
          Suivi en temps réel des véhicules du propriétaire.
        </p>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      <GpsFilterBar
        vehicles={vehicles}
        filter={filter}
        setFilter={setFilter}
        search={search}
        setSearch={setSearch}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-3 xl:col-span-1">
          {filteredVehicles.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm text-gray-500">
              Aucun véhicule trouvé.
            </div>
          ) : (
            filteredVehicles.map((vehicle) => (
              <VehicleGpsCard
                key={vehicle.vehicleId}
                vehicle={vehicle}
                isSelected={vehicle.vehicleId === selectedVehicleId}
                onClick={() => setSelectedVehicleId(vehicle.vehicleId)}
              />
            ))
          )}
        </div>

        <div className="xl:col-span-2">
          <GpsLiveMap
            vehicles={filteredVehicles}
            selectedVehicleId={selectedVehicleId}
            history={history}
          />
        </div>
      </div>

      <GpsVehicleDetails
        vehicle={selectedVehicle}
        history={history}
        loadingHistory={loadingHistory}
      />
    </div>
  );
}