import { DriverStatus } from '@/types/driver'
import { VehicleStatus, FuelType } from '@/types/vehicle' // Corrigé ici
import { DATE_FORMATS, STATUS_COLORS } from './constants'
import { format, parseISO } from 'date-fns'

// Format date for display
export const formatDate = (dateString?: string, formatStr: string = DATE_FORMATS.DISPLAY): string => {
  if (!dateString) return 'N/A'
  
  try {
    const date = parseISO(dateString)
    return format(date, formatStr)
  } catch (error) {
    console.error('Error formatting date:', error)
    return 'Invalid Date'
  }
}

// Format date with time
export const formatDateTime = (dateString?: string): string => {
  return formatDate(dateString, DATE_FORMATS.DISPLAY_WITH_TIME)
}

// Get status color class
export const getDriverStatusColor = (status: DriverStatus): string => {
  const colors: Record<DriverStatus, string> = {
    ACTIVE: STATUS_COLORS.DRIVER_ACTIVE,
    INACTIVE: STATUS_COLORS.DRIVER_INACTIVE,
    ON_LEAVE: STATUS_COLORS.DRIVER_ON_LEAVE,
    SUSPENDED: STATUS_COLORS.DRIVER_SUSPENDED
  }
  return colors[status] || STATUS_COLORS.DRIVER_INACTIVE
}

export const getVehicleStatusColor = (status: VehicleStatus): string => {
  const colors: Record<VehicleStatus, string> = {
    AVAILABLE: STATUS_COLORS.VEHICLE_AVAILABLE,
    IN_USE: STATUS_COLORS.VEHICLE_IN_USE,
    UNDER_MAINTENANCE: STATUS_COLORS.VEHICLE_UNDER_MAINTENANCE,
    OUT_OF_SERVICE: STATUS_COLORS.VEHICLE_OUT_OF_SERVICE,
    RESERVED: STATUS_COLORS.VEHICLE_RESERVED
  }
  return colors[status] || STATUS_COLORS.VEHICLE_OUT_OF_SERVICE
}

export const getFuelTypeColor = (fuelType: FuelType): string => {
  const colors: Record<FuelType, string> = {
    GASOLINE: STATUS_COLORS.FUEL_GASOLINE,
    DIESEL: STATUS_COLORS.FUEL_DIESEL,
    ELECTRIC: STATUS_COLORS.FUEL_ELECTRIC,
    HYBRID: STATUS_COLORS.FUEL_HYBRID,
    LPG: STATUS_COLORS.FUEL_LPG
  }
  return colors[fuelType] || STATUS_COLORS.FUEL_GASOLINE
}

// Format currency
export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(amount)
}

// Format number with commas
export const formatNumber = (number: number): string => {
  return new Intl.NumberFormat('en-US').format(number)
}

// Validate email
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i
  return emailRegex.test(email)
}

// Validate phone number
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/
  return phoneRegex.test(phone)
}

// Validate password strength
export const validatePasswordStrength = (password: string): {
  isValid: boolean
  errors: string[]
} => {
  const errors: string[] = []
  
  if (password.length < 6) {
    errors.push('Password must be at least 6 characters long')
  }
  
  if (!/(?=.*[a-z])/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }
  
  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }
  
  if (!/(?=.*\d)/.test(password)) {
    errors.push('Password must contain at least one number')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// Generate initials from name
export const getInitials = (firstName: string, lastName: string): string => {
  return `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase()
}

// Capitalize first letter
export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

// Debounce function
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Throttle function
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

// Check if object is empty
export const isEmpty = (obj: object): boolean => {
  return Object.keys(obj).length === 0
}

// Remove undefined/null values from object
export const removeEmptyValues = <T extends object>(obj: T): Partial<T> => {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, value]) => value != null)
  ) as Partial<T>
}

// Generate random ID
export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9)
}

// Get user role display name
export const getRoleDisplayName = (role: string): string => {
  const roleMap: Record<string, string> = {
    'ROLE_ADMIN': 'Administrator',
    'ROLE_OWNER': 'Owner',
    'ROLE_DRIVER': 'Driver'
  }
  
  return roleMap[role] || role.replace('ROLE_', '')
}

// Calculate days between dates
export const daysBetween = (date1: Date, date2: Date): number => {
  const diffTime = Math.abs(date2.getTime() - date1.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

// Check if date is expired
export const isExpired = (dateString?: string): boolean => {
  if (!dateString) return false
  
  try {
    const date = parseISO(dateString)
    return date < new Date()
  } catch (error) {
    return false
  }
}

// Format file size
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}