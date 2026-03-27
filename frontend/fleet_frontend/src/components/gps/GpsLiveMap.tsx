"use client";

import { MapContainer, Marker, Popup, Polyline, TileLayer } from "react-leaflet";
import type { LatLngTuple } from "leaflet";
import { GpsData, VehicleLiveStatusDTO } from "@/types/gps";
import { gpsMarkerIcon } from "@/components/gps/leafletIcon";
import { getStatusLabel, formatTimestamp } from "@/lib/utils/gps";

interface GpsLiveMapProps {
  vehicles: VehicleLiveStatusDTO[];
  selectedVehicleId: number | null;
  history: GpsData[];
}

export default function GpsLiveMap({
  vehicles,
  selectedVehicleId,
  history,
}: GpsLiveMapProps) {
  const validVehicles = vehicles.filter(
    (vehicle) =>
      vehicle.latitude !== null &&
      vehicle.longitude !== null &&
      !Number.isNaN(vehicle.latitude) &&
      !Number.isNaN(vehicle.longitude)
  );

  const selectedVehicle =
    validVehicles.find((vehicle) => vehicle.vehicleId === selectedVehicleId) ?? null;

  const defaultCenter: LatLngTuple = [35.8256, 10.6369];

  const center: LatLngTuple = selectedVehicle
    ? [selectedVehicle.latitude!, selectedVehicle.longitude!]
    : validVehicles.length > 0
    ? [validVehicles[0].latitude!, validVehicles[0].longitude!]
    : defaultCenter;

  const historyPositions: LatLngTuple[] = history
    .filter(
      (item) =>
        item.latitude !== null &&
        item.longitude !== null &&
        !Number.isNaN(item.latitude) &&
        !Number.isNaN(item.longitude)
    )
    .map((item) => [item.latitude, item.longitude]);

  const missionRoutePositions: LatLngTuple[] = selectedVehicle
    ? selectedVehicle.missionRoute.map((point) => [point.latitude, point.longitude])
    : [];

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <MapContainer center={center} zoom={12} style={{ height: "540px", width: "100%" }}>
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {validVehicles.map((vehicle) => (
          <Marker
            key={vehicle.vehicleId}
            position={[vehicle.latitude!, vehicle.longitude!]}
            icon={gpsMarkerIcon}
          >
            <Popup>
              <div className="space-y-1 text-sm">
                <p>
                  <strong>Véhicule :</strong> {vehicle.vehicleName}
                </p>
                <p>
                  <strong>Statut :</strong> {getStatusLabel(vehicle.liveStatus)}
                </p>
                <p>
                  <strong>Vitesse :</strong> {vehicle.speed} km/h
                </p>
                <p>
                  <strong>Moteur :</strong> {vehicle.engineOn ? "ON" : "OFF"}
                </p>
                <p>
                  <strong>Mission active :</strong> {vehicle.missionActive ? "Oui" : "Non"}
                </p>
                <p>
                  <strong>Driver :</strong> {vehicle.currentDriverName || "Aucun"}
                </p>
                <p>
                  <strong>Route source :</strong> {vehicle.routeSource || "-"}
                </p>
                <p>
                  <strong>Timestamp :</strong> {formatTimestamp(vehicle.timestamp)}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}

        {missionRoutePositions.length > 0 && (
          <Polyline positions={missionRoutePositions} />
        )}

        {historyPositions.length > 1 && (
          <Polyline positions={historyPositions} />
        )}
      </MapContainer>
    </div>
  );
}