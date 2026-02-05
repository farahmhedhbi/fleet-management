// API Constants
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'
export const API_TIMEOUT = 10000
export const API_MAX_RETRIES = 3

// App Constants
export const APP_NAME = 'Fleet Management'
export const APP_VERSION = '1.0.0'

// Role Constants
export const ROLES = {
  ADMIN: 'ROLE_ADMIN',
  OWNER: 'ROLE_OWNER',
  DRIVER: 'ROLE_DRIVER'
} as const

export type Role = typeof ROLES[keyof typeof ROLES]

// Driver Status Constants
export const DRIVER_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  ON_LEAVE: 'ON_LEAVE',
  SUSPENDED: 'SUSPENDED'
} as const

// Vehicle Status Constants
export const VEHICLE_STATUS = {
  AVAILABLE: 'AVAILABLE',
  IN_USE: 'IN_USE',
  UNDER_MAINTENANCE: 'UNDER_MAINTENANCE',
  OUT_OF_SERVICE: 'OUT_OF_SERVICE',
  RESERVED: 'RESERVED'
} as const

// Fuel Type Constants
export const FUEL_TYPES = {
  GASOLINE: 'GASOLINE',
  DIESEL: 'DIESEL',
  ELECTRIC: 'ELECTRIC',
  HYBRID: 'HYBRID',
  LPG: 'LPG'
} as const

// Transmission Type Constants
export const TRANSMISSION_TYPES = {
  MANUAL: 'MANUAL',
  AUTOMATIC: 'AUTOMATIC',
  SEMI_AUTOMATIC: 'SEMI_AUTOMATIC'
} as const

// Color Constants for UI
export const STATUS_COLORS = {
  // Driver Status Colors
  DRIVER_ACTIVE: 'bg-green-100 text-green-800',
  DRIVER_INACTIVE: 'bg-gray-100 text-gray-800',
  DRIVER_ON_LEAVE: 'bg-yellow-100 text-yellow-800',
  DRIVER_SUSPENDED: 'bg-red-100 text-red-800',
  
  // Vehicle Status Colors
  VEHICLE_AVAILABLE: 'bg-green-100 text-green-800',
  VEHICLE_IN_USE: 'bg-blue-100 text-blue-800',
  VEHICLE_UNDER_MAINTENANCE: 'bg-yellow-100 text-yellow-800',
  VEHICLE_OUT_OF_SERVICE: 'bg-red-100 text-red-800',
  VEHICLE_RESERVED: 'bg-purple-100 text-purple-800',
  
  // Fuel Type Colors
  FUEL_GASOLINE: 'bg-orange-100 text-orange-800',
  FUEL_DIESEL: 'bg-gray-100 text-gray-800',
  FUEL_ELECTRIC: 'bg-emerald-100 text-emerald-800',
  FUEL_HYBRID: 'bg-cyan-100 text-cyan-800',
  FUEL_LPG: 'bg-yellow-100 text-yellow-800'
} as const

// Local Storage Keys
export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  THEME: 'theme',
  LANGUAGE: 'language'
} as const

// Validation Constants
export const VALIDATION = {
  EMAIL_REGEX: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
  PHONE_REGEX: /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/,
  PASSWORD_MIN_LENGTH: 6,
  NAME_MAX_LENGTH: 50,
  LICENSE_MAX_LENGTH: 20,
  VIN_LENGTH: 17
} as const

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: 'MMM dd, yyyy',
  DISPLAY_WITH_TIME: 'MMM dd, yyyy HH:mm',
  API: 'yyyy-MM-dd',
  API_WITH_TIME: "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"
} as const

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZES: [10, 25, 50, 100],
  DEFAULT_PAGE: 1
} as const

// Navigation Items
export const NAVIGATION_ITEMS = [
  { name: 'Dashboard', href: '/dashboard', icon: 'Home', roles: ['ROLE_ADMIN', 'ROLE_OWNER', 'ROLE_DRIVER'] },
  { name: 'Drivers', href: '/drivers', icon: 'Users', roles: ['ROLE_ADMIN', 'ROLE_OWNER'] },
  { name: 'Vehicles', href: '/vehicles', icon: 'Car', roles: ['ROLE_ADMIN', 'ROLE_OWNER'] },
  { name: 'Schedule', href: '/schedule', icon: 'Calendar', roles: ['ROLE_ADMIN', 'ROLE_OWNER', 'ROLE_DRIVER'] },
  { name: 'Reports', href: '/reports', icon: 'BarChart3', roles: ['ROLE_ADMIN', 'ROLE_OWNER'] },
  { name: 'Documents', href: '/documents', icon: 'FileText', roles: ['ROLE_ADMIN', 'ROLE_OWNER', 'ROLE_DRIVER'] },
  { name: 'Settings', href: '/settings', icon: 'Settings', roles: ['ROLE_ADMIN'] }
] as const

// Test User Credentials (for development only)
export const TEST_USERS = {
  ADMIN: { email: 'admin@fleet.com', password: 'admin123', role: 'ROLE_ADMIN' },
  OWNER: { email: 'owner@fleet.com', password: 'owner123', role: 'ROLE_OWNER' },
  DRIVER: { email: 'driver@fleet.com', password: 'driver123', role: 'ROLE_DRIVER' }
} as const