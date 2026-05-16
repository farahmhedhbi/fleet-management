import {api} from "@/lib/api";

export interface SmartAssignmentRequest {
  startCity: string;
  destinationCity: string;

  startLatitude: number;
  startLongitude: number;

  destinationLatitude: number;
  destinationLongitude: number;

  startTime: string;
  expectedEndTime: string;
}

export interface DispatchStepDTO {
  type: "MISSION" | "REST" | "RETURN_TO_DEPOT";
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
  mode: "SMART_ASSIGNMENT" | "SMART_DAILY_PLANNING" | string;
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

export const smartDispatchService = {
  async smartAssignment(payload: SmartAssignmentRequest) {
    const res = await api.post<DispatchSuggestionDTO>(
      "/api/owner/dispatch/smart-assignment",
      payload
    );

    return res.data;
  },
};