"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";

type GpsData = {
  id: number;
  vehicleId: number;
  latitude: number;
  longitude: number;
  speed: number;
  engineOn: boolean;
  timestamp: string;
};

const GpsMapView = dynamic(() => import("./GpsMapView"), {
  ssr: false,
});

export default function GpsMap() {
  const [data, setData] = useState<GpsData | null>(null);
  const [error, setError] = useState("");
  const [mapReady, setMapReady] = useState(false);

  const apiUrl = useMemo(
    () => "http://localhost:8080/api/gps/vehicle/1/last",
    []
  );

  useEffect(() => {
    setMapReady(true);
  }, []);

  useEffect(() => {
    const fetchLastPosition = async () => {
      try {
        setError("");

        const response = await fetch(apiUrl, {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`Erreur API: ${response.status}`);
        }

        const result: GpsData = await response.json();
        setData(result);
      } catch (err) {
        console.error(err);
        setError("Impossible de charger les données GPS");
      }
    };

    fetchLastPosition();
    const interval = setInterval(fetchLastPosition, 2000);

    return () => clearInterval(interval);
  }, [apiUrl]);

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
        {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-2xl border p-4 shadow-sm">
        Chargement des données GPS...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border p-4 shadow-sm">
          <p className="text-sm text-gray-500">Latitude</p>
          <p className="text-lg font-semibold">{data.latitude}</p>
        </div>

        <div className="rounded-2xl border p-4 shadow-sm">
          <p className="text-sm text-gray-500">Longitude</p>
          <p className="text-lg font-semibold">{data.longitude}</p>
        </div>

        <div className="rounded-2xl border p-4 shadow-sm">
          <p className="text-sm text-gray-500">Vitesse</p>
          <p className="text-lg font-semibold">{data.speed} km/h</p>
        </div>

        <div className="rounded-2xl border p-4 shadow-sm">
          <p className="text-sm text-gray-500">Moteur</p>
          <p className="text-lg font-semibold">
            {data.engineOn ? "ON" : "OFF"}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border p-4 shadow-sm">
        <p className="mb-2 text-sm text-gray-500">Dernière mise à jour</p>
        <p className="font-medium">
          {new Date(data.timestamp).toLocaleString()}
        </p>
      </div>

      {mapReady && <GpsMapView data={data} />}
    </div>
  );
}