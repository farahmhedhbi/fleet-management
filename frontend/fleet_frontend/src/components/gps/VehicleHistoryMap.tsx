"use client";

import "leaflet/dist/leaflet.css";
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import type { LatLngTuple } from "leaflet";
import { useEffect, useMemo } from "react";
import type { GpsData } from "@/types/gps";
import { gpsMarkerIcon } from "@/components/gps/leafletIcon";

interface Props {
  history: GpsData[];
}

function FitBounds({ points }: { points: LatLngTuple[] }) {
  const map = useMap();

  useEffect(() => {
    const t1 = window.setTimeout(() => {
      map.invalidateSize();

      if (points.length > 1) {
        map.fitBounds(points, { padding: [30, 30] });
      } else if (points.length === 1) {
        map.setView(points[0], 14, { animate: false });
      }
    }, 100);

    const t2 = window.setTimeout(() => {
      map.invalidateSize();
    }, 300);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [map, points]);

  return null;
}

function isValidLatLng(lat?: number | null, lng?: number | null) {
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

export default function VehicleHistoryMap({ history }: Props) {
  const validHistory = useMemo(
    () =>
      history.filter((h) => isValidLatLng(h.latitude, h.longitude)),
    [history]
  );

  if (validHistory.length === 0) {
    return (
      <div className="rounded-xl border bg-white p-4">
        Aucun historique disponible.
      </div>
    );
  }

  const positions: LatLngTuple[] = validHistory.map(
    (item) => [item.latitude, item.longitude] as LatLngTuple
  );

  const center: LatLngTuple = positions[0];
  const startPoint = validHistory[0];
  const endPoint = validHistory[validHistory.length - 1];

  return (
    <div className="h-[400px] overflow-hidden rounded-2xl border bg-white">
      <MapContainer center={center} zoom={12} scrollWheelZoom className="h-full w-full">
        <FitBounds points={positions} />

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {positions.length > 1 && (
          <Polyline positions={positions} pathOptions={{ color: "green", weight: 4 }} />
        )}

        <Marker
          position={[startPoint.latitude, startPoint.longitude]}
          icon={gpsMarkerIcon}
        >
          <Popup>
            <div>
              <strong>Début du trajet</strong>
              <div>{new Date(startPoint.timestamp).toLocaleString()}</div>
            </div>
          </Popup>
        </Marker>

        <Marker
          position={[endPoint.latitude, endPoint.longitude]}
          icon={gpsMarkerIcon}
        >
          <Popup>
            <div>
              <strong>Dernière position</strong>
              <div>{new Date(endPoint.timestamp).toLocaleString()}</div>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}