"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, Marker, Popup, Polyline, TileLayer, useMap } from "react-leaflet";
import L, { type LatLngTuple } from "leaflet";
import type { GpsData, VehicleLiveStatusDTO } from "@/types/gps";
import { formatTimestamp, getStatusLabel } from "@/lib/utils/gps";
import { useMemo } from "react";

const gpsMarkerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function MapResizeController({ center }: { center: LatLngTuple }) {
  const map = useMap();
  map.setView(center);
  return null;
}

interface FleetLiveMapProps {
  vehicles: VehicleLiveStatusDTO[];
  selectedVehicleId: number | null;
  setSelectedVehicleId: (id: number) => void;
  history: GpsData[];
}

export default function FleetLiveMap({
  vehicles,
  selectedVehicleId,
  setSelectedVehicleId,
  history,
}: FleetLiveMapProps) {
  const validVehicles = useMemo(
    () =>
      vehicles.filter(
        (v) =>
          v.latitude !== null &&
          v.longitude !== null &&
          !Number.isNaN(v.latitude) &&
          !Number.isNaN(v.longitude)
      ),
    [vehicles]
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
    .map((item): LatLngTuple => [item.latitude, item.longitude]);

  const missionRoutePositions: LatLngTuple[] = selectedVehicle
    ? selectedVehicle.missionRoute.map(
        (point): LatLngTuple => [point.latitude, point.longitude]
      )
    : [];

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="h-[540px] w-full">
        <MapContainer
          key={`${selectedVehicleId ?? "all"}-${validVehicles.length}`}
          center={center}
          zoom={12}
          scrollWheelZoom
          className="h-full w-full"
        >
          <MapResizeController center={center} />

          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {validVehicles.map((vehicle) => (
            <Marker
              key={vehicle.vehicleId}
              position={[vehicle.latitude!, vehicle.longitude!]}
              icon={gpsMarkerIcon}
              eventHandlers={{
                click: () => setSelectedVehicleId(vehicle.vehicleId),
              }}
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
    </div>
  );
}