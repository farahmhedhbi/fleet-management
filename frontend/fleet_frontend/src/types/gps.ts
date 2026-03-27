export interface MissionRoutePointDTO {
  latitude: number;
  longitude: number;
}

export type LiveStatus = "EN_MISSION" | "HORS_MISSION" | "INACTIF" | "OFFLINE";

export type GpsFilterStatus = "ALL" | LiveStatus;

export interface VehicleLiveStatusDTO {
  vehicleId: number;
  vehicleName: string;
  latitude: number | null;
  longitude: number | null;
  speed: number;
  engineOn: boolean;
  timestamp: string | null;
  liveStatus: LiveStatus;
  missionActive: boolean;
  missionId: number | null;
  currentDriverName: string | null;
  routeId: string | null;
  routeSource: "MISSION" | "STATIC" | null;
  missionRoute: MissionRoutePointDTO[];
}

export interface GpsData {
  id: number;
  latitude: number;
  longitude: number;
  speed: number;
  engineOn: boolean;
  timestamp: string;
  routeId: string | null;
  routeSource: string | null;
}