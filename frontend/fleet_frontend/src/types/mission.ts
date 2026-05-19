export type MissionStatus =
  | "PLANNED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELED";

export type RouteCheckStatus =
  | "NOT_CHECKED"
  | "SAFE"
  | "ALTERNATIVE_SELECTED"
  | "LEAST_RISK_SELECTED";

export type RouteRiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type DriverStatus =
  | "AVAILABLE"
  | "ON_MISSION"
  | "RESTING"
  | "OFFLINE";

export interface RouteCheckResult {
  missionId: number;
  vehicleId?: number | null;
  status: RouteCheckStatus;
  riskLevel?: RouteRiskLevel | null;
  routeRecalculated: boolean;
  originalDurationMinutes?: number | null;
  selectedDurationMinutes?: number | null;
  estimatedDelayMinutes?: number | null;
  originalDistanceKm?: number | null;
  selectedDistanceKm?: number | null;
  message?: string | null;
  originalRouteJson?: string | null;
  selectedRouteJson?: string | null;
}

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
  driverStatus?: DriverStatus | null;
  driverAvailableAt?: string | null;

  vehicleId?: number | null;
  vehicleRegistrationNumber?: string | null;

  routeJson?: string | null;

  startedAt?: string | null;
  finishedAt?: string | null;

  originalRouteJson?: string | null;
  routeCheckStatus?: RouteCheckStatus | null;
  routeRiskLevel?: RouteRiskLevel | null;
  routeRecalculated?: boolean | null;
  originalDurationMinutes?: number | null;
  selectedDurationMinutes?: number | null;
  estimatedDelayMinutes?: number | null;
  originalDistanceKm?: number | null;
  selectedDistanceKm?: number | null;
  routeCheckedAt?: string | null;
  routeCheckMessage?: string | null;

  returnToDepotSuggested?: boolean;
vehicleStaysWithDriver?: boolean;
nextDayDecisionRequired?: boolean;
returnDepotReason?: string | null;
depotCity?: string | null;
finalCity?: string | null;
distanceToDepotKm?: number | null;
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