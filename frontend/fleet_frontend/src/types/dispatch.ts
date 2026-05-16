export type DispatchStepType = "MISSION" | "REST" | "RETURN_TO_DEPOT";

export interface DispatchMissionRequest {
  startCity: string;
  destinationCity: string;

  startLatitude: number;
  startLongitude: number;

  destinationLatitude: number;
  destinationLongitude: number;

  startTime: string;
  expectedEndTime: string;
}

export interface SmartAssignmentRequest extends DispatchMissionRequest {}

export interface SmartDailyPlanningRequest {
  date: string;
  depotCity: string;
  depotLatitude: number;
  depotLongitude: number;
  missions: DispatchMissionRequest[];
}

export interface DispatchStepDTO {
  type: DispatchStepType;
  label: string;

  fromCity?: string;
  toCity?: string;

  startTime?: string;
  endTime?: string;

  vehicleId?: number;
  vehiclePlate?: string;

  driverId?: number;
  driverName?: string;

  durationMinutes?: number;
}

export interface DispatchSuggestionDTO {
  mode: "SMART_ASSIGNMENT" | "SMART_DAILY_PLANNING";

  vehicleId: number;
  vehiclePlate: string;

  driverId: number;
  driverName: string;

  score: number;
  returnToDepotSuggested: boolean;

  reasons: string[];
  warnings: string[];
  steps: DispatchStepDTO[];
}