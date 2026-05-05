export type MaintenanceType =
  | "OIL_CHANGE"
  | "ENGINE_CHECK"
  | "BRAKE_CHECK"
  | "BATTERY_CHECK"
  | "TIRE_CHANGE"
  | "TECHNICAL_INSPECTION"
  | "REPAIR"
  | "OTHER";

export type MaintenanceStatus = "PLANNED" | "DONE" | "OVERDUE" | "CANCELED";

export interface MaintenanceDTO {
  id: number;
  vehicleId: number;
  vehicleRegistrationNumber: string;
  type: MaintenanceType;
  status: MaintenanceStatus;
  title: string;
  description: string | null;
  maintenanceDate: string | null;
  plannedDate: string | null;
  completedAt: string | null;
  mileage: number | null;
  cost: number | null;
  createdByUserId: number | null;
  createdByEmail: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MaintenanceCreateRequest {
  vehicleId: number;
  type: MaintenanceType;
  title: string;
  description?: string;
  status?: MaintenanceStatus;
  maintenanceDate?: string;
  plannedDate?: string;
  mileage?: number;
  cost?: number;
}