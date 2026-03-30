"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, Marker, Polyline, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import type { GpsData } from "@/types/gps";

const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface Props {
  history: GpsData[];
}

export default function VehicleHistoryMap({ history }: Props) {
  const validHistory = history.filter(
    (h) => typeof h.latitude === "number" && typeof h.longitude === "number"
  );

  if (validHistory.length === 0) {
    return <div className="rounded-xl border bg-white p-4">Aucun historique disponible.</div>;
  }

  const center: [number, number] = [
    validHistory[0].latitude,
    validHistory[0].longitude,
  ];

  const positions = validHistory.map(
    (item) => [item.latitude, item.longitude] as [number, number]
  );

  const startPoint = validHistory[0];
  const endPoint = validHistory[validHistory.length - 1];

  return (
    <div className="h-[400px] overflow-hidden rounded-2xl border bg-white">
      <MapContainer center={center} zoom={12} scrollWheelZoom className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Polyline positions={positions} pathOptions={{ color: "green" }} />

        <Marker position={[startPoint.latitude, startPoint.longitude]} icon={markerIcon}>
          <Popup>
            <div>
              <strong>Début du trajet</strong>
              <div>{new Date(startPoint.timestamp).toLocaleString()}</div>
            </div>
          </Popup>
        </Marker>

        <Marker position={[endPoint.latitude, endPoint.longitude]} icon={markerIcon}>
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