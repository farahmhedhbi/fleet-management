export type DriverStatus = 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE' | 'SUSPENDED'

export interface Driver {
  id: number
  firstName: string
  lastName: string
  email: string
  phone?: string
  licenseNumber: string
  licenseExpiry?: string  // ISO string
  ecoScore?: number
  status: DriverStatus
  createdAt: string
  updatedAt: string
}

export interface DriverDTO {
  id?: number
  firstName: string
  lastName: string
  email: string
  phone?: string
  licenseNumber: string
  licenseExpiry?: string  // ISO string
  ecoScore?: number
  status?: DriverStatus
}

export interface DriverFilters {
  search?: string
  status?: DriverStatus | 'ALL'
}