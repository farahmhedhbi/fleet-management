export type MissionStatus =
  | "PLANNED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELED";

export interface Mission {
  id: number;
  title: string;
  description?: string;
  departure: string;
  destination: string;
  startDate?: string;
  endDate?: string;
  status: MissionStatus;

  ownerId?: number;

  driverId?: number;
  driverName?: string;

  vehicleId?: number;
  vehicleRegistrationNumber?: string;

  routeJson?: string;

  startedAt?: string;
  finishedAt?: string;
}

export interface MissionDTO {
  title: string;
  description?: string;
  departure: string;
  destination: string;
  startDate?: string;
  driverId: number;
  vehicleId: number;
}