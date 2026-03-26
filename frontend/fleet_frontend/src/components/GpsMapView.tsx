"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import { useEffect, useRef } from "react";

type GpsData = {
  id: number;
  vehicleId: number;
  latitude: number;
  longitude: number;
  speed: number;
  engineOn: boolean;
  timestamp: string;
};

delete (L.Icon.Default.prototype as L.Icon.Default & { _getIconUrl?: unknown })
  ._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function MapUpdater({ data }: { data: GpsData }) {
  const map = useMap();
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      return;
    }

    map.setView([data.latitude, data.longitude], map.getZoom(), {
      animate: true,
    });
  }, [data.latitude, data.longitude, map]);

  return null;
}

export default function GpsMapView({ data }: { data: GpsData }) {
  return (
    <div className="overflow-hidden rounded-2xl border shadow-sm">
      <div style={{ height: "500px", width: "100%" }}>
        <MapContainer
          center={[data.latitude, data.longitude]}
          zoom={13}
          scrollWheelZoom={true}
          style={{ height: "100%", width: "100%" }}
        >
          <MapUpdater data={data} />

          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <Marker position={[data.latitude, data.longitude]}>
            <Popup>
              <div>
                <p><strong>Véhicule #{data.vehicleId}</strong></p>
                <p>Vitesse: {data.speed} km/h</p>
                <p>Moteur: {data.engineOn ? "ON" : "OFF"}</p>
                <p>Maj: {new Date(data.timestamp).toLocaleString()}</p>
              </div>
            </Popup>
          </Marker>
        </MapContainer>
      </div>
    </div>
  );
}