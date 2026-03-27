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
import { GpsData, VehicleLiveStatusDTO } from "@/types/gps";
import { gpsMarkerIcon } from "@/components/gps/leafletIcon";
import { getStatusLabel, formatTimestamp } from "@/lib/utils/gps";

interface GpsLiveMapClientProps {
  vehicles: VehicleLiveStatusDTO[];
  selectedVehicleId: number | null;
  history: GpsData[];
}

function MapResizeController({ center }: { center: LatLngTuple }) {
  const map = useMap();

  useEffect(() => {
    const runFix = () => {
      map.invalidateSize();
      map.setView(center, map.getZoom(), { animate: false });
    };

    const t1 = window.setTimeout(runFix, 100);
    const t2 = window.setTimeout(runFix, 300);
    const t3 = window.setTimeout(runFix, 700);

    const onResize = () => {
      map.invalidateSize();
    };

    window.addEventListener("resize", onResize);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
      window.removeEventListener("resize", onResize);
    };
  }, [map, center]);

  return null;
}

export default function GpsLiveMapClient({
  vehicles,
  selectedVehicleId,
  history,
}: GpsLiveMapClientProps) {
  const validVehicles = useMemo(
    () =>
      vehicles.filter(
        (vehicle) =>
          vehicle.latitude !== null &&
          vehicle.longitude !== null &&
          !Number.isNaN(vehicle.latitude) &&
          !Number.isNaN(vehicle.longitude)
      ),
    [vehicles]
  );

  const selectedVehicle = useMemo(
    () =>
      validVehicles.find((vehicle) => vehicle.vehicleId === selectedVehicleId) ?? null,
    [validVehicles, selectedVehicleId]
  );

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