"use client";

import { useEffect, useMemo } from "react";
import {
  MapContainer,
  Marker,
  Popup,
  Polyline,
  TileLayer,
  useMap,
} from "react-leaflet";
import type { LatLngTuple } from "leaflet";
import type { Dispatch, SetStateAction } from "react";
import type { GpsData, VehicleLiveStatusDTO } from "@/types/gps";
import { gpsMarkerIcon } from "@/components/gps/leafletIcon";
import { formatTimestamp, getStatusLabel } from "@/lib/utils/gps";

interface GpsLiveMapClientProps {
  vehicles: VehicleLiveStatusDTO[];
  selectedVehicleId: number | null;
  setSelectedVehicleId: Dispatch<SetStateAction<number | null>>;
  history: GpsData[];
}

function isValidLatLng(
  lat: number | null | undefined,
  lng: number | null | undefined
) {
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    !Number.isNaN(lat) &&
    !Number.isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

function normalizeHistory(history: GpsData[]): GpsData[] {
  return [...history]
    .filter((item) => isValidLatLng(item.latitude, item.longitude))
    .sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
}

function normalizeMissionRoute(
  vehicle: VehicleLiveStatusDTO | null
): LatLngTuple[] {
  if (!vehicle || !Array.isArray(vehicle.missionRoute)) return [];

  return vehicle.missionRoute
    .filter((point) => isValidLatLng(point.latitude, point.longitude))
    .map((point): LatLngTuple => [point.latitude, point.longitude]);
}

function MapResizeController() {
  const map = useMap();

  useEffect(() => {
    const fix = () => map.invalidateSize();

    const t1 = window.setTimeout(fix, 100);
    const t2 = window.setTimeout(fix, 300);
    const t3 = window.setTimeout(fix, 700);

    window.addEventListener("resize", fix);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
      window.removeEventListener("resize", fix);
    };
  }, [map]);

  return null;
}

function FollowSelectedVehicle({
  selectedVehicle,
}: {
  selectedVehicle: VehicleLiveStatusDTO | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (
      selectedVehicle &&
      isValidLatLng(selectedVehicle.latitude, selectedVehicle.longitude)
    ) {
      map.setView(
        [selectedVehicle.latitude!, selectedVehicle.longitude!],
        map.getZoom() < 13 ? 13 : map.getZoom(),
        { animate: true }
      );
    }
  }, [
    map,
    selectedVehicle?.vehicleId,
    selectedVehicle?.latitude,
    selectedVehicle?.longitude,
    selectedVehicle?.timestamp,
  ]);

  return null;
}

export default function GpsLiveMapClient({
  vehicles,
  selectedVehicleId,
  setSelectedVehicleId,
  history,
}: GpsLiveMapClientProps) {
  const validVehicles = useMemo(() => {
    return vehicles.filter((vehicle) =>
      isValidLatLng(vehicle.latitude, vehicle.longitude)
    );
  }, [vehicles]);

  const selectedVehicle = useMemo(() => {
    if (selectedVehicleId === null) return validVehicles[0] ?? null;

    return (
      validVehicles.find(
        (vehicle) => vehicle.vehicleId === selectedVehicleId
      ) ?? validVehicles[0] ?? null
    );
  }, [validVehicles, selectedVehicleId]);

  const defaultCenter: LatLngTuple = [35.8256, 10.6369];

  const center: LatLngTuple =
    selectedVehicle &&
    isValidLatLng(selectedVehicle.latitude, selectedVehicle.longitude)
      ? [selectedVehicle.latitude!, selectedVehicle.longitude!]
      : defaultCenter;

  const normalizedHistory = useMemo(
    () => normalizeHistory(history),
    [history]
  );

  const historyPositions: LatLngTuple[] = useMemo(() => {
    return normalizedHistory.map(
      (item): LatLngTuple => [item.latitude, item.longitude]
    );
  }, [normalizedHistory]);

  const missionRoutePositions: LatLngTuple[] = useMemo(() => {
    return normalizeMissionRoute(selectedVehicle);
  }, [selectedVehicle]);

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="h-[540px] w-full">
        <MapContainer
          center={center}
          zoom={13}
          scrollWheelZoom
          className="h-full w-full"
        >
          <MapResizeController />
          <FollowSelectedVehicle selectedVehicle={selectedVehicle} />

          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {missionRoutePositions.length > 1 && (
            <Polyline
              positions={missionRoutePositions}
              pathOptions={{ color: "green", weight: 4 }}
            />
          )}

          {historyPositions.length > 1 && (
            <Polyline
              positions={historyPositions}
              pathOptions={{ color: "blue", weight: 4 }}
            />
          )}

          {validVehicles.map((vehicle) => (
            <Marker
              key={`${vehicle.vehicleId}-${vehicle.timestamp}-${vehicle.latitude}-${vehicle.longitude}`}
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
                    <strong>Statut :</strong>{" "}
                    {getStatusLabel(vehicle.liveStatus)}
                  </p>

                  <p>
                    <strong>Vitesse :</strong> {vehicle.speed ?? 0} km/h
                  </p>

                  <p>
                    <strong>Moteur :</strong>{" "}
                    {vehicle.engineOn ? "ON" : "OFF"}
                  </p>

                  <p>
                    <strong>Mission active :</strong>{" "}
                    {vehicle.missionActive ? "Oui" : "Non"}
                  </p>

                  <p>
                    <strong>Mission ID :</strong>{" "}
                    {vehicle.missionId ?? "-"}
                  </p>

                  <p>
                    <strong>Mission status :</strong>{" "}
                    {vehicle.missionStatus || "-"}
                  </p>

                  <p>
                    <strong>Driver :</strong>{" "}
                    {vehicle.currentDriverName || "Aucun"}
                  </p>

                  <p>
                    <strong>Route source :</strong>{" "}
                    {vehicle.routeSource || "-"}
                  </p>

                  <p>
                    <strong>Timestamp :</strong>{" "}
                    {formatTimestamp(vehicle.timestamp)}
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}