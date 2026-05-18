export type DispatchStepType = "MISSION";

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
  mode: "SMART_ASSIGNMENT";

  vehicleId: number;
  vehiclePlate: string;

  driverId: number;
  driverName: string;

  score: number;

  reasons: string[];
  warnings: string[];
  steps: DispatchStepDTO[];
}