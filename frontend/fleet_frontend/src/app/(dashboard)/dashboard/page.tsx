'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Users, 
  Car, 
  CheckCircle, 
  AlertTriangle,
  TrendingUp,
  Calendar,
  BarChart3,
  Clock,
  MapPin
} from 'lucide-react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { toastError } from '@/components/ui/Toast'
import { driverService } from '@/lib/services/driverService'
import { vehicleService } from '@/lib/services/vehicleService'
import { Driver } from '@/types/driver'
import { Vehicle } from '@/types/vehicle'

import { formatDate } from '@/lib/utils/helpers'
import { useAuth } from '@/contexts/authContext'

interface DashboardStats {
  totalDrivers: number
  totalVehicles: number
  availableVehicles: number
  activeDrivers: number
  vehiclesNeedingMaintenance: number
}

export default function DashboardPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalDrivers: 0,
    totalVehicles: 0,
    availableVehicles: 0,
    activeDrivers: 0,
    vehiclesNeedingMaintenance: 0
  })
  const [recentDrivers, setRecentDrivers] = useState<Driver[]>([])
  const [recentVehicles, setRecentVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const [drivers, vehicles] = await Promise.all([
        driverService.getAll(),
        vehicleService.getAll()
      ])

      const now = new Date()
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

      const vehiclesNeedingMaintenance = vehicles.filter(vehicle => {
        if (!vehicle.nextMaintenanceDate) return false
        const maintenanceDate = new Date(vehicle.nextMaintenanceDate)
        return maintenanceDate <= nextWeek
      }).length

      setStats({
        totalDrivers: drivers.length,
        totalVehicles: vehicles.length,
        availableVehicles: vehicles.filter(v => v.status === 'AVAILABLE').length,
        activeDrivers: drivers.filter(d => d.status === 'ACTIVE').length,
        vehiclesNeedingMaintenance
      })

      // Get recent items (last 5)
      setRecentDrivers(drivers.slice(0, 5))
      setRecentVehicles(vehicles.slice(0, 5))
    } catch (error) {
      toastError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const statsCards = [
    {
      title: 'Total Drivers',
      value: stats.totalDrivers,
      icon: Users,
      color: 'bg-blue-500',
      trend: '+12%',
      description: 'Active fleet drivers',
      action: () => router.push('/drivers')
    },
    {
      title: 'Total Vehicles',
      value: stats.totalVehicles,
      icon: Car,
      color: 'bg-green-500',
      trend: '+8%',
      description: 'Fleet vehicles',
      action: () => router.push('/vehicles')
    },
    {
      title: 'Available Vehicles',
      value: stats.availableVehicles,
      icon: CheckCircle,
      color: 'bg-emerald-500',
      trend: '+5%',
      description: 'Ready for assignment',
      action: () => router.push('/vehicles?status=AVAILABLE')
    },
    {
      title: 'Active Drivers',
      value: stats.activeDrivers,
      icon: Users,
      color: 'bg-purple-500',
      trend: '+15%',
      description: 'Currently working',
      action: () => router.push('/drivers?status=ACTIVE')
    }
  ]

  const quickActions = [
    {
      title: 'Add New Driver',
      description: 'Register a new driver',
      icon: Users,
      color: 'bg-blue-50 text-blue-700',
      hoverColor: 'hover:bg-blue-100',
      action: () => router.push('/drivers/create')
    },
    {
      title: 'Add New Vehicle',
      description: 'Register a new vehicle',
      icon: Car,
      color: 'bg-emerald-50 text-emerald-700',
      hoverColor: 'hover:bg-emerald-100',
      action: () => router.push('/vehicles/create')
    },
    {
      title: 'View Schedule',
      description: 'Check driver schedules',
      icon: Calendar,
      color: 'bg-purple-50 text-purple-700',
      hoverColor: 'hover:bg-purple-100',
      action: () => router.push('/schedule')
    },
    {
      title: 'Generate Reports',
      description: 'Create fleet reports',
      icon: BarChart3,
      color: 'bg-amber-50 text-amber-700',
      hoverColor: 'hover:bg-amber-100',
      action: () => router.push('/reports')
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-8 text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Welcome back, {user?.firstName}!</h1>
            <p className="mt-2 text-blue-100">
              Here's what's happening with your fleet today.
            </p>
            <div className="mt-4 flex items-center space-x-4">
              <div className="flex items-center">
                <Clock size={16} className="mr-2" />
                <span>{new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</span>
              </div>
              <div className="flex items-center">
                <MapPin size={16} className="mr-2" />
                <span>{stats.totalVehicles} Vehicles • {stats.totalDrivers} Drivers</span>
              </div>
            </div>
          </div>
          {stats.vehiclesNeedingMaintenance > 0 && (
            <div className="mt-4 md:mt-0 bg-white/20 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center">
                <AlertTriangle size={24} className="mr-3 text-yellow-300" />
                <div>
                  <div className="font-semibold">Maintenance Alert</div>
                  <div className="text-sm">
                    {stats.vehiclesNeedingMaintenance} vehicle(s) need maintenance
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp size={16} className="text-green-500 mr-1" />
                    <span className="text-sm text-green-600">{stat.trend}</span>
                    <span className="text-sm text-gray-500 ml-2">from last month</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-4"
                    onClick={stat.action}
                  >
                    View Details →
                  </Button>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <stat.icon size={24} className="text-white" />
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Vehicles */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Recent Vehicles</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/vehicles')}
                >
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                {recentVehicles.length === 0 ? (
                  <div className="text-center py-8">
                    <Car size={48} className="mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500">No vehicles found</p>
                  </div>
                ) : (
                  recentVehicles.map((vehicle) => (
                    <div 
                      key={vehicle.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => router.push(`/vehicles/edit/${vehicle.id}`)}
                    >
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Car size={20} className="text-gray-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {vehicle.registrationNumber}
                          </div>
                          <div className="text-sm text-gray-500">
                            {vehicle.brand} {vehicle.model} • {vehicle.year}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <StatusBadge 
                          type="vehicle" 
                          status={vehicle.status}
                          size="sm"
                        />
                        <div className="text-sm text-gray-500">
                          {(vehicle.mileage || 0).toLocaleString()} km
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Quick Actions & Recent Drivers */}
        <div className="space-y-8">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-3">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={action.action}
                    className={`w-full flex items-center p-3 rounded-lg transition ${action.color} ${action.hoverColor}`}
                  >
                    <action.icon size={20} className="mr-3" />
                    <div className="text-left">
                      <div className="font-medium">{action.title}</div>
                      <div className="text-sm opacity-90">{action.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* Recent Drivers */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Recent Drivers</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/drivers')}
                >
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                {recentDrivers.length === 0 ? (
                  <div className="text-center py-8">
                    <Users size={48} className="mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500">No drivers found</p>
                  </div>
                ) : (
                  recentDrivers.map((driver) => (
                    <div 
                      key={driver.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => router.push(`/drivers/edit/${driver.id}`)}
                    >
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="font-medium text-blue-600">
                            {driver.firstName[0]}{driver.lastName[0]}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {driver.firstName} {driver.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{driver.email}</div>
                        </div>
                      </div>
                      <StatusBadge 
                        type="driver" 
                        status={driver.status}
                        size="sm"
                      />
                    </div>
                  ))
                )}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}