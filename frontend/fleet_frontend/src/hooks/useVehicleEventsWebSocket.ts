"use client";

import { useEffect } from "react";
import type { VehicleEventDTO } from "@/types/gps";
import { subscribeEventsLive, unsubscribeEventsLive } from "@/lib/websocket";

interface Options {
  onEventLive: (event: VehicleEventDTO) => void;
}

export function useVehicleEventsWebSocket({ onEventLive }: Options) {
  useEffect(() => {
    subscribeEventsLive<VehicleEventDTO>((event) => {
      if (event.severity !== "WARNING" && event.severity !== "CRITICAL") {
        return;
      }

      onEventLive(event);
    });

    return () => {
      unsubscribeEventsLive();
    };
  }, [onEventLive]);
}