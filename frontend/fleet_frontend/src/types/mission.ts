export type MissionStatus =
  | "PLANNED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELED";

  
export interface Mission {
  id: number;
  title: string;
  description?: string | null;
  departure: string;
  destination: string;
  startDate?: string | null;
  endDate?: string | null;
  status: MissionStatus;

  ownerId?: number | null;

  driverId?: number | null;
  driverName?: string | null;

  vehicleId?: number | null;
  vehicleRegistrationNumber?: string | null;

  routeJson?: string | null;

  startedAt?: string | null;
  finishedAt?: string | null;
  driverStatus?: "AVAILABLE" | "ON_MISSION" | "RESTING" | "OFFLINE";
  driverAvailableAt?: string | null;
}

export interface MissionDTO {
  title: string;
  description?: string;
  departure: string;
  destination: string;
  startDate?: string;
  endDate?: string;
  driverId: number;
  vehicleId: number;
}