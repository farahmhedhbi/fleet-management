"use client";

import { useEffect } from "react";
import L from "leaflet";
import {
  Circle,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";

import type { DepotVehicleDTO, OwnerDepot } from "@/types/depot";

import "leaflet/dist/leaflet.css";

const depotIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const vehicleIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface Props {
  depot: OwnerDepot;
  vehicles: DepotVehicleDTO[];
  editable?: boolean;
  onDepotPositionChange?: (lat: number, lng: number) => void;
}

export default function DepotMap({
  depot,
  vehicles,
  editable = false,
  onDepotPositionChange,
}: Props) {
  const center: [number, number] = [
    depot.latitude || 35.8256,
    depot.longitude || 10.6369,
  ];

  return (
    <MapContainer
      center={center}
      zoom={14}
      scrollWheelZoom
      className="h-full w-full"
    >
      <MapFixer center={center} />

      {editable && (
        <ClickHandler onDepotPositionChange={onDepotPositionChange} />
      )}

      <TileLayer
        attribution="&copy; OpenStreetMap"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <Marker position={center} icon={depotIcon}>
        <Popup>
          <strong>{depot.name || "Dépôt"}</strong>
          <br />
          {depot.city}
          <br />
          {depot.address}
        </Popup>
      </Marker>

      <Circle
        center={center}
        radius={depot.radiusMeters || 100}
        pathOptions={{ color: "blue" }}
      />

      {vehicles
        .filter((v) => v.latitude != null && v.longitude != null)
        .map((v) => (
          <Marker
            key={v.vehicleId}
            position={[v.latitude as number, v.longitude as number]}
            icon={vehicleIcon}
          >
            <Popup>
              <strong>{v.plateNumber}</strong>
              <br />
              Status: {v.status}
              <br />
              Distance:{" "}
              {v.distanceFromDepotKm != null
                ? `${v.distanceFromDepotKm.toFixed(2)} km`
                : "-"}
            </Popup>
          </Marker>
        ))}
    </MapContainer>
  );
}

function MapFixer({ center }: { center: [number, number] }) {
  const map = useMap();

  useEffect(() => {
    setTimeout(() => {
      map.invalidateSize();
      map.setView(center);
    }, 200);
  }, [map, center]);

  return null;
}

function ClickHandler({
  onDepotPositionChange,
}: {
  onDepotPositionChange?: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onDepotPositionChange?.(e.latlng.lat, e.latlng.lng);
    },
  });

  return null;
}