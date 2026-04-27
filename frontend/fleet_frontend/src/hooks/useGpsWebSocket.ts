"use client";

import { useEffect } from "react";
import type { VehicleLiveStatusDTO } from "@/types/gps";
import { subscribeGpsLive, unsubscribeGpsLive } from "@/lib/websocket";

interface Options {
  onVehicleLive: (vehicle: VehicleLiveStatusDTO) => void;
}

export function useGpsWebSocket({ onVehicleLive }: Options) {
  useEffect(() => {
    subscribeGpsLive<VehicleLiveStatusDTO>((vehicle) => {
      onVehicleLive(vehicle);
    });

    return () => {
      unsubscribeGpsLive();
    };
  }, [onVehicleLive]);
}