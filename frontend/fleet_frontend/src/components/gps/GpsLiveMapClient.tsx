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
import { getStatusLabel, formatTimestamp } from "@/lib/utils/gps";

interface GpsLiveMapClientProps {
  vehicles: VehicleLiveStatusDTO[];
  selectedVehicleId: number | null;
  setSelectedVehicleId: Dispatch<SetStateAction<number | null>>;
  history: GpsData[];
}

function isValidLatLng(lat: number | null | undefined, lng: number | null | undefined) {
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

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const earthRadius = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadius * c;
}

function normalizeHistory(history: GpsData[]): GpsData[] {
  const valid = history.filter((item) => isValidLatLng(item.latitude, item.longitude));

  const sorted = [...valid].sort((a, b) => {
    const ta = new Date(a.timestamp).getTime();
    const tb = new Date(b.timestamp).getTime();
    return ta - tb;
  });

  if (sorted.length <= 1) {
    return sorted;
  }

  const filtered: GpsData[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const prev = filtered[filtered.length - 1];
    const curr = sorted[i];

    const distance = haversineMeters(
      prev.latitude,
      prev.longitude,
      curr.latitude,
      curr.longitude
    );

    if (distance <= 20000) {
      filtered.push(curr);
    }
  }

  return filtered;
}

function normalizeMissionRoute(vehicle: VehicleLiveStatusDTO | null): LatLngTuple[] {
  if (!vehicle || !Array.isArray(vehicle.missionRoute)) {
    return [];
  }

  return vehicle.missionRoute
    .filter((point) => isValidLatLng(point.latitude, point.longitude))
    .map((point): LatLngTuple => [point.latitude, point.longitude]);
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

function MapAutoFit({
  selectedVehicle,
  liveVehicles,
  historyPositions,
  missionRoutePositions,
}: {
  selectedVehicle: VehicleLiveStatusDTO | null;
  liveVehicles: VehicleLiveStatusDTO[];
  historyPositions: LatLngTuple[];
  missionRoutePositions: LatLngTuple[];
}) {
  const map = useMap();

  useEffect(() => {
    const points: LatLngTuple[] = [];

    if (
      selectedVehicle &&
      isValidLatLng(selectedVehicle.latitude, selectedVehicle.longitude)
    ) {
      points.push([selectedVehicle.latitude!, selectedVehicle.longitude!]);
    }

    points.push(...historyPositions);
    points.push(...missionRoutePositions);

    if (points.length >= 2) {
      map.fitBounds(points, { padding: [40, 40] });
      return;
    }

    if (points.length === 1) {
      map.setView(points[0], 13, { animate: false });
      return;
    }

    if (liveVehicles.length > 0) {
      const fleetPoints = liveVehicles
        .filter((v) => isValidLatLng(v.latitude, v.longitude))
        .map((v) => [v.latitude!, v.longitude!] as LatLngTuple);

      if (fleetPoints.length >= 2) {
        map.fitBounds(fleetPoints, { padding: [40, 40] });
      } else if (fleetPoints.length === 1) {
        map.setView(fleetPoints[0], 10, { animate: false });
      }
    }
  }, [map, selectedVehicle, liveVehicles, historyPositions, missionRoutePositions]);

  return null;
}

export default function GpsLiveMapClient({
  vehicles,
  selectedVehicleId,
  setSelectedVehicleId,
  history,
}: GpsLiveMapClientProps) {
  const validVehicles = useMemo(
    () =>
      vehicles.filter((vehicle) =>
        isValidLatLng(vehicle.latitude, vehicle.longitude)
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

  const normalizedHistory = useMemo(() => normalizeHistory(history), [history]);

  const historyPositions: LatLngTuple[] = useMemo(
    () =>
      normalizedHistory.map(
        (item): LatLngTuple => [item.latitude, item.longitude]
      ),
    [normalizedHistory]
  );

  const missionRoutePositions: LatLngTuple[] = useMemo(
    () => normalizeMissionRoute(selectedVehicle),
    [selectedVehicle]
  );

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
          <MapAutoFit
            selectedVehicle={selectedVehicle}
            liveVehicles={validVehicles}
            historyPositions={historyPositions}
            missionRoutePositions={missionRoutePositions}
          />

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
                    <strong>Mission ID :</strong> {vehicle.missionId ?? "-"}
                  </p>
                  <p>
                    <strong>Mission status :</strong> {vehicle.missionStatus || "-"}
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
        </MapContainer>
      </div>
    </div>
  );
}