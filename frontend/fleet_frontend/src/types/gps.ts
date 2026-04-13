export interface MissionRoutePointDTO {
  latitude: number;
  longitude: number;
}

export interface VehicleLiveStatusDTO {
  vehicleId: number;
  vehicleName: string;
  latitude: number | null;
  longitude: number | null;
  speed: number;
  engineOn: boolean;
  timestamp: string | null;
  liveStatus: string;
  missionActive: boolean;
  missionId: number | null;
  missionStatus: string | null;
  driverId: number | null;
  currentDriverName: string | null;
  routeId: string | null;
  routeSource: string | null;
  missionRoute: MissionRoutePointDTO[];
}

export interface GpsData {
  id: number;
  vehicleId: number;
  latitude: number;
  longitude: number;
  speed: number;
  engineOn: boolean;
  timestamp: string;
  routeId?: string | null;
  routeSource?: string | null;
}

export interface VehicleEventDTO {
  id: number;
  vehicleId: number;
  missionId: number | null;
  eventType: string;
  severity: string;
  message: string;
  latitude: number | null;
  longitude: number | null;
  speed: number | null;
  createdAt: string;
  acknowledged: boolean;
}

export type GpsFilterStatus = "ALL" | "MOVING" | "OFFLINE" | "MISSION" | "ALERT";