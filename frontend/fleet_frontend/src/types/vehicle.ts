// types/vehicle.ts

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
  ownerId?: number;
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
  yearFrom?: number
  yearTo?: number
  brand?: string
}

// Constantes pour les formulaires
export const FUEL_TYPE_OPTIONS = [
  { value: 'GASOLINE', label: 'Gasoline' },
  { value: 'DIESEL', label: 'Diesel' },
  { value: 'ELECTRIC', label: 'Electric' },
  { value: 'HYBRID', label: 'Hybrid' },
  { value: 'LPG', label: 'LPG' },
] as const

export const TRANSMISSION_OPTIONS = [
  { value: 'MANUAL', label: 'Manual' },
  { value: 'AUTOMATIC', label: 'Automatic' },
  { value: 'SEMI_AUTOMATIC', label: 'Semi-Automatic' },
] as const

export const VEHICLE_STATUS_OPTIONS = [
  { value: 'AVAILABLE', label: 'Available' },
  { value: 'IN_USE', label: 'In Use' },
  { value: 'UNDER_MAINTENANCE', label: 'Under Maintenance' },
  { value: 'OUT_OF_SERVICE', label: 'Out of Service' },
  { value: 'RESERVED', label: 'Reserved' },
] as const

// Fonctions utilitaires
export const getVehicleStatusColor = (status: VehicleStatus): string => {
  const colors: Record<VehicleStatus, string> = {
    AVAILABLE: 'bg-green-100 text-green-800 border-green-200',
    IN_USE: 'bg-blue-100 text-blue-800 border-blue-200',
    UNDER_MAINTENANCE: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    OUT_OF_SERVICE: 'bg-red-100 text-red-800 border-red-200',
    RESERVED: 'bg-purple-100 text-purple-800 border-purple-200',
  }
  return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200'
}

export const getFuelTypeColor = (fuelType?: FuelType): string => {
  if (!fuelType) return 'bg-gray-100 text-gray-800'
  
  const colors: Record<FuelType, string> = {
    GASOLINE: 'bg-orange-100 text-orange-800',
    DIESEL: 'bg-gray-100 text-gray-800',
    ELECTRIC: 'bg-emerald-100 text-emerald-800',
    HYBRID: 'bg-cyan-100 text-cyan-800',
    LPG: 'bg-yellow-100 text-yellow-800',
  }
  return colors[fuelType]
}

export const getTransmissionIcon = (transmission?: TransmissionType): string => {
  switch (transmission) {
    case 'MANUAL':
      return '🚗'
    case 'AUTOMATIC':
      return '⚙️'
    case 'SEMI_AUTOMATIC':
      return '🔄'
    default:
      return '🚘'
  }
}

// Validation
export const validateVehicle = (vehicle: VehicleDTO): string[] => {
  const errors: string[] = []

  if (!vehicle.registrationNumber?.trim()) {
    errors.push('Registration number is required')
  }

  if (!vehicle.brand?.trim()) {
    errors.push('Brand is required')
  }

  if (!vehicle.model?.trim()) {
    errors.push('Model is required')
  }

  if (!vehicle.year) {
    errors.push('Year is required')
  } else if (vehicle.year < 1900 || vehicle.year > new Date().getFullYear() + 1) {
    errors.push('Invalid year')
  }

  if (vehicle.mileage && vehicle.mileage < 0) {
    errors.push('Mileage cannot be negative')
  }

  // Validation VIN si fourni
  if (vehicle.vin && vehicle.vin.length !== 17) {
    errors.push('VIN must be 17 characters')
  }

  return errors
}