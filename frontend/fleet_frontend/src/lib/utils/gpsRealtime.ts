import type { GpsData, VehicleLiveStatusDTO } from "@/types/gps";

export function liveToGpsPoint(live: VehicleLiveStatusDTO): GpsData | null {
  if (
    live.latitude == null ||
    live.longitude == null ||
    live.timestamp == null
  ) {
    return null;
  }

  return {
    id: Date.now(),
    vehicleId: live.vehicleId,
    latitude: live.latitude,
    longitude: live.longitude,
    speed: live.speed,
    engineOn: live.engineOn,
    timestamp: live.timestamp,
    routeId: live.routeId ?? null,
    routeSource: live.routeSource ?? null,
  };
}

export function appendUniqueGpsPoint(prev: GpsData[], point: GpsData): GpsData[] {
  const exists = prev.some(
    (p) =>
      p.timestamp === point.timestamp ||
      (
        p.vehicleId === point.vehicleId &&
        p.latitude === point.latitude &&
        p.longitude === point.longitude
      )
  );

  if (exists) return prev;

  return [...prev, point];
}