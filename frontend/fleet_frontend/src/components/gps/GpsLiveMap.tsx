"use client";

import dynamic from "next/dynamic";
import type { GpsData, VehicleLiveStatusDTO } from "@/types/gps";

const GpsLiveMapClient = dynamic(() => import("./GpsLiveMapClient"), {
  ssr: false,
});

interface GpsLiveMapProps {
  vehicles: VehicleLiveStatusDTO[];
  selectedVehicleId: number | null;
  history: GpsData[];
}

export default function GpsLiveMap(props: GpsLiveMapProps) {
  return <GpsLiveMapClient {...props} />;
}