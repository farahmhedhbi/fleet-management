import React from 'react'

type DriverStatus = 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE' | 'SUSPENDED'
type VehicleStatus = 'AVAILABLE' | 'IN_USE' | 'UNDER_MAINTENANCE' | 'OUT_OF_SERVICE' | 'RESERVED'
type FuelType = 'GASOLINE' | 'DIESEL' | 'ELECTRIC' | 'HYBRID' | 'LPG'

interface StatusBadgeProps {
  type: 'driver' | 'vehicle' | 'fuel'
  status: DriverStatus | VehicleStatus | FuelType
  size?: 'sm' | 'md' | 'lg'
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ type, status, size = 'md' }) => {
  const getDriverStatusConfig = (status: DriverStatus) => {
    const config = {
      ACTIVE: { color: 'bg-green-100 text-green-800', icon: '🟢' },
      INACTIVE: { color: 'bg-gray-100 text-gray-800', icon: '⚪' },
      ON_LEAVE: { color: 'bg-yellow-100 text-yellow-800', icon: '🟡' },
      SUSPENDED: { color: 'bg-red-100 text-red-800', icon: '🔴' }
    }
    return config[status]
  }

  const getVehicleStatusConfig = (status: VehicleStatus) => {
    const config = {
      AVAILABLE: { color: 'bg-green-100 text-green-800', icon: '✅' },
      IN_USE: { color: 'bg-blue-100 text-blue-800', icon: '🚗' },
      UNDER_MAINTENANCE: { color: 'bg-yellow-100 text-yellow-800', icon: '🔧' },
      OUT_OF_SERVICE: { color: 'bg-red-100 text-red-800', icon: '🚫' },
      RESERVED: { color: 'bg-purple-100 text-purple-800', icon: '📅' }
    }
    return config[status]
  }

  const getFuelTypeConfig = (type: FuelType) => {
    const config = {
      GASOLINE: { color: 'bg-orange-100 text-orange-800', icon: '⛽' },
      DIESEL: { color: 'bg-gray-100 text-gray-800', icon: '🛢️' },
      ELECTRIC: { color: 'bg-emerald-100 text-emerald-800', icon: '🔌' },
      HYBRID: { color: 'bg-cyan-100 text-cyan-800', icon: '⚡' },
      LPG: { color: 'bg-yellow-100 text-yellow-800', icon: '🔥' }
    }
    return config[type]
  }

  const getConfig = () => {
    switch (type) {
      case 'driver':
        return getDriverStatusConfig(status as DriverStatus)
      case 'vehicle':
        return getVehicleStatusConfig(status as VehicleStatus)
      case 'fuel':
        return getFuelTypeConfig(status as FuelType)
      default:
        return { color: 'bg-gray-100 text-gray-800', icon: '' }
    }
  }

  const config = getConfig()
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-sm',
    lg: 'px-3 py-1 text-base'
  }

  return (
    <span className={`inline-flex items-center ${sizeClasses[size]} ${config.color} rounded-full font-medium`}>
      {config.icon && <span className="mr-1.5">{config.icon}</span>}
      {status}
    </span>
  )
}