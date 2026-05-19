export type FuelType = "GASOLINE" | "DIESEL" | "ELECTRIC" | "HYBRID" | "LPG";

export type TransmissionType = "MANUAL" | "AUTOMATIC" | "SEMI_AUTOMATIC";

export type VehicleStatus =
  | "AVAILABLE"
  | "IN_USE"
  | "WITH_DRIVER"
  | "OUTSIDE_DEPOT"
  | "RETURNING_TO_DEPOT"
  | "PARKED"
  | "UNDER_MAINTENANCE"
  | "OUT_OF_SERVICE"
  | "RESERVED"
  | "BROKEN_DOWN";

export interface Vehicle {
  id: number;
  registrationNumber: string;
  brand: string;
  model: string;
  year: number;
  color?: string | null;
  vin?: string | null;
  fuelType?: FuelType | null;
  transmission?: TransmissionType | null;
  status: VehicleStatus;
  parked?: boolean | null;
  mileage?: number | null;
  lastMaintenanceDate?: string | null;
  nextMaintenanceDate?: string | null;
  lastFuelLevel?: number | null;

  currentLatitude?: number | null;
  currentLongitude?: number | null;
  currentCity?: string | null;

  homeDepotCity?: string | null;
  homeDepotLatitude?: number | null;
  homeDepotLongitude?: number | null;

  driverId?: number | null;
  driverName?: string | null;
  driverEmail?: string | null;

  createdAt: string;
  updatedAt: string;
  ownerId?: number | null;
}

export interface VehicleDTO {
  id?: number;
  registrationNumber: string;
  brand: string;
  model: string;
  year: number;
  color?: string | null;
  vin?: string | null;
  fuelType?: FuelType | null;
  transmission?: TransmissionType | null;
  status?: VehicleStatus;
  parked?: boolean | null;
  mileage?: number | null;
  lastMaintenanceDate?: string | null;
  nextMaintenanceDate?: string | null;
  lastFuelLevel?: number | null;

  currentLatitude?: number | null;
  currentLongitude?: number | null;
  currentCity?: string | null;

  homeDepotCity?: string | null;
  homeDepotLatitude?: number | null;
  homeDepotLongitude?: number | null;

  driverId?: number | null;
}

export interface VehicleFilters {
  search?: string;
  status?: VehicleStatus | "ALL";
  fuelType?: FuelType;
  yearFrom?: number;
  yearTo?: number;
  brand?: string;
}

export const VEHICLE_STATUS_OPTIONS = [
  { value: "AVAILABLE", label: "Available" },
  { value: "IN_USE", label: "In use" },
  { value: "RETURNING_TO_DEPOT", label: "Returning to depot" },
  { value: "UNDER_MAINTENANCE", label: "Under maintenance" },
  { value: "BROKEN_DOWN", label: "Broken down" },
  { value: "OUT_OF_SERVICE", label: "Out of service" },
  { value: "RESERVED", label: "Reserved" },
] as const;

export function getVehicleBusinessLabel(vehicle: Pick<Vehicle, "status" | "parked">) {
  if (vehicle.status === "AVAILABLE" && vehicle.parked) return "Available at depot";
  if (vehicle.status === "AVAILABLE" && !vehicle.parked) return "Available on field";
  if (vehicle.status === "RETURNING_TO_DEPOT") return "Returning to depot";
  if (vehicle.status === "IN_USE") return "In mission";
  if (vehicle.status === "BROKEN_DOWN") return "Broken down";
  if (vehicle.status === "UNDER_MAINTENANCE") return "Under maintenance";
  if (vehicle.status === "OUT_OF_SERVICE") return "Out of service";
  return vehicle.status;
}

export const getVehicleStatusColor = (status: VehicleStatus): string => {
  const colors: Record<VehicleStatus, string> = {
    AVAILABLE: "bg-green-100 text-green-800 border-green-200",
    IN_USE: "bg-blue-100 text-blue-800 border-blue-200",
    WITH_DRIVER: "bg-cyan-100 text-cyan-800 border-cyan-200",
    OUTSIDE_DEPOT: "bg-orange-100 text-orange-800 border-orange-200",
    RETURNING_TO_DEPOT: "bg-purple-100 text-purple-800 border-purple-200",
    PARKED: "bg-emerald-100 text-emerald-800 border-emerald-200",
    UNDER_MAINTENANCE: "bg-yellow-100 text-yellow-800 border-yellow-200",
    OUT_OF_SERVICE: "bg-red-100 text-red-800 border-red-200",
    RESERVED: "bg-slate-100 text-slate-800 border-slate-200",
    BROKEN_DOWN: "bg-red-100 text-red-800 border-red-200",
  };

  return colors[status] || "bg-gray-100 text-gray-800 border-gray-200";
};