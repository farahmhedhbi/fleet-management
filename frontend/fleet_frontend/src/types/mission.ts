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

  routeJson?: string | null;

  startedAt?: string;
  finishedAt?: string;

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