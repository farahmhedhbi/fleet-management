export type ReturnDepotStatus =
  | "SUGGESTED"
  | "ACCEPTED"
  | "IN_PROGRESS"
  | "ARRIVED"
  | "REJECTED"
  | "REST_REQUIRED";

export interface ReturnDepotDTO {
  id: number;
  missionId?: number | null;
  vehicleId?: number | null;
  driverId?: number | null;

  depotLatitude?: number | null;
  depotLongitude?: number | null;
  currentLatitude?: number | null;
  currentLongitude?: number | null;

  distanceMeters?: number | null;
  etaMinutes?: number | null;

  status: ReturnDepotStatus;

  suggestedAt?: string | null;
  acceptedAt?: string | null;
  startedAt?: string | null;
  arrivedAt?: string | null;
}