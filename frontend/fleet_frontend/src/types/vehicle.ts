export type FuelType = 'GASOLINE' | 'DIESEL' | 'ELECTRIC' | 'HYBRID' | 'LPG'
export type TransmissionType = 'MANUAL' | 'AUTOMATIC' | 'SEMI_AUTOMATIC'
export type VehicleStatus = 'AVAILABLE' | 'IN_USE' | 'UNDER_MAINTENANCE' | 'OUT_OF_SERVICE' | 'RESERVED'

export interface Vehicle {
  id: number
  registrationNumber: string
  brand: string
  model: string
  year: number
  color?: string
  vin?: string
  fuelType?: FuelType
  transmission?: TransmissionType
  status: VehicleStatus
  mileage?: number
  lastMaintenanceDate?: string
  nextMaintenanceDate?: string
  driverId?: number
  driverName?: string
  driverEmail?: string
  createdAt: string
  updatedAt: string
}

export interface VehicleDTO {
  id?: number
  registrationNumber: string
  brand: string
  model: string
  year: number
  color?: string
  vin?: string
  fuelType?: FuelType
  transmission?: TransmissionType
  status?: VehicleStatus
  mileage?: number
  lastMaintenanceDate?: string
  nextMaintenanceDate?: string
  driverId?: number
}

export interface VehicleFilters {
  search?: string
  status?: VehicleStatus | 'ALL'
  fuelType?: FuelType
}