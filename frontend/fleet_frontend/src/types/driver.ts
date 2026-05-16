export type DriverStatus =
  | "AVAILABLE"
  | "ON_MISSION"
  | "RESTING"
  | "OFF_DUTY"
  | "UNAVAILABLE"
  | "ACTIVE"
  | "INACTIVE"
  | "ON_LEAVE"
  | "SUSPENDED";

export interface Driver {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  licenseNumber: string;
  licenseExpiry?: string | null;
  ecoScore?: number | null;
  status: DriverStatus;
  availableAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DriverDTO {
  id?: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  licenseNumber: string;
  licenseExpiry?: string | null;
  ecoScore?: number | null;
  status?: DriverStatus;
  availableAt?: string | null;
}

export interface DriverFilters {
  search?: string;
  status?: DriverStatus | "ALL";
}