export type MaintenanceType =
  | "OIL_CHANGE"
  | "ENGINE_CHECK"
  | "BRAKE_CHECK"
  | "BATTERY_CHECK"
  | "TIRE_CHANGE"
  | "TECHNICAL_INSPECTION"
  | "REPAIR"
  | "OTHER";

export type MaintenanceStatus =
  | "PLANNED"
  | "IN_PROGRESS"
  | "DONE"
  | "OVERDUE"
  | "CANCELED";

export type MaintenancePriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface MaintenanceDTO {
  id: number;
  vehicleId: number | null;
  vehicleRegistrationNumber: string | null;

  type: MaintenanceType;
  status: MaintenanceStatus;
  priority: MaintenancePriority;

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

  incidentId: number | null;
  incidentTitle: string | null;

  workOrderId: number | null;
  workOrderTitle: string | null;
}

export interface MaintenanceCreateRequest {
  vehicleId: number;
  type: MaintenanceType;
  priority?: MaintenancePriority;
  title: string;
  description?: string;
  status?: MaintenanceStatus;
  maintenanceDate?: string;
  plannedDate?: string;
  mileage?: number;
  cost?: number;
  incidentId?: number;
}

export type WorkOrderStatus =
  | "PLANNED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELED";

export interface MaintenanceWorkOrderDTO {
  id: number;
  vehicleId: number | null;
  vehicleRegistrationNumber: string | null;

  status: WorkOrderStatus;

  title: string;
  garageName: string | null;
  notes: string | null;

  startDate: string | null;
  endDate: string | null;

  estimatedDurationDays: number | null;
  estimatedCost: number | null;
  actualCost: number | null;

  createdByUserId: number | null;
  createdByEmail: string | null;

  createdAt: string;
  updatedAt: string;

  maintenances: MaintenanceDTO[];
}

export interface MaintenanceWorkOrderCreateRequest {
  vehicleId: number;
  title: string;
  garageName?: string;
  notes?: string;
  startDate?: string;
  endDate?: string;
  estimatedDurationDays?: number;
  estimatedCost?: number;
  maintenanceIds?: number[];
}

export interface MaintenanceWorkOrderStatusRequest {
  status: WorkOrderStatus;
  actualCost?: number;
}