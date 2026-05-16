export type DepotVehicleStatus =
  | "PARKED"
  | "OUTSIDE_DEPOT"
  | "ON_MISSION"
  | "NO_GPS";

export interface OwnerDepot {
  id: number;
  enabled: boolean;
  name: string;
  city: string;
  address: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
}

export interface CreateDepotRequest {
  name: string;
  city: string;
  address: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
}

export interface DepotVehicleDTO {
  vehicleId: number;
  plateNumber: string;
  latitude: number | null;
  longitude: number | null;
  status: DepotVehicleStatus;
  distanceFromDepotKm: number | null;
}