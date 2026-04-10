"use client";

import "leaflet/dist/leaflet.css";
import {
  MapContainer,
  Marker,
  Popup,
  Polyline,
  TileLayer,
  useMap,
} from "react-leaflet";
import L, { type LatLngTuple } from "leaflet";
import type { GpsData, VehicleLiveStatusDTO } from "@/types/gps";
import { formatTimestamp, getStatusLabel } from "@/lib/utils/gps";
import { useEffect, useMemo } from "react";

const gpsMarkerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function MapResizeController({ center }: { center: LatLngTuple }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center);
  }, [map, center]);

  return null;
}

interface FleetLiveMapProps {
  vehicles: VehicleLiveStatusDTO[];
  selectedVehicleId: number | null;
  setSelectedVehicleId: (id: number) => void;
  history: GpsData[];
}

function isValidCoordinate(lat?: number | null, lng?: number | null) {
  return (
    lat !== null &&
    lng !== null &&
    lat !== undefined &&
    lng !== undefined &&
    !Number.isNaN(lat) &&
    !Number.isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

function simplifyPositions(points: LatLngTuple[], maxPoints = 500): LatLngTuple[] {
  if (points.length <= maxPoints) return points;

  const step = Math.ceil(points.length / maxPoints);
  const reduced = points.filter((_, index) => index % step === 0);

  const last = points[points.length - 1];
  const lastReduced = reduced[reduced.length - 1];

  if (!lastReduced || lastReduced[0] !== last[0] || lastReduced[1] !== last[1]) {
    reduced.push(last);
  }

  return reduced;
}

function removeConsecutiveDuplicates(points: LatLngTuple[]): LatLngTuple[] {
  if (points.length <= 1) return points;

  const result: LatLngTuple[] = [points[0]];

  for (let i = 1; i < points.length; i++) {
    const prev = result[result.length - 1];
    const curr = points[i];

    if (prev[0] !== curr[0] || prev[1] !== curr[1]) {
      result.push(curr);
    }
  }

  return result;
}

export default function FleetLiveMap({
  vehicles,
  selectedVehicleId,
  setSelectedVehicleId,
  history,
}: FleetLiveMapProps) {
  const validVehicles = useMemo(
    () =>
      vehicles.filter((v) => isValidCoordinate(v.latitude, v.longitude)),
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

  const historyPositions = useMemo<LatLngTuple[]>(() => {
    const points = history
      .filter((item) => isValidCoordinate(item.latitude, item.longitude))
      .map((item): LatLngTuple => [item.latitude!, item.longitude!]);

    return simplifyPositions(removeConsecutiveDuplicates(points), 400);
  }, [history]);

  const missionRoutePositions = useMemo<LatLngTuple[]>(() => {
    if (!selectedVehicle?.missionRoute?.length) return [];

    const points = selectedVehicle.missionRoute
      .filter((point) => isValidCoordinate(point.latitude, point.longitude))
      .map((point): LatLngTuple => [point.latitude, point.longitude]);

    return simplifyPositions(removeConsecutiveDuplicates(points), 400);
  }, [selectedVehicle]);

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="h-[540px] w-full">
        <MapContainer
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

          {missionRoutePositions.length > 1 && (
            <Polyline positions={missionRoutePositions} smoothFactor={0} />
          )}

          {historyPositions.length > 1 && (
            <Polyline positions={historyPositions} smoothFactor={0} />
          )}
        </MapContainer>
      </div>
    </div>
  );
}