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
  MapPin,
  Gauge,
  Fuel,
  Wrench,
  Route,
  Settings,
  Shield,
  BatteryCharging,
  Navigation,
  Zap,
  Cpu,
  RefreshCw,
  Sparkles
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
  totalMileage: number
  fleetHealth: number
}

export default function DashboardPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalDrivers: 0,
    totalVehicles: 0,
    availableVehicles: 0,
    activeDrivers: 0,
    vehiclesNeedingMaintenance: 0,
    totalMileage: 0,
    fleetHealth: 85
  })
  const [recentDrivers, setRecentDrivers] = useState<Driver[]>([])
  const [recentVehicles, setRecentVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setIsRefreshing(true)
    try {
      const [drivers, vehicles] = await Promise.all([
        driverService.getAll(),
        vehicleService.getAll()
      ])

      const now = new Date()
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

      // Utiliser un type partiel pour accéder aux propriétés potentielles
      const vehiclesNeedingMaintenance = vehicles.filter(vehicle => {
        const vehicleAny = vehicle as any
        if (!vehicleAny.nextMaintenanceDate) return false
        const maintenanceDate = new Date(vehicleAny.nextMaintenanceDate)
        return maintenanceDate <= nextWeek
      }).length

      const totalMileage = vehicles.reduce((sum, vehicle) => sum + (vehicle.mileage || 0), 0)
      
      // Calculate fleet health score
      const fleetHealth = vehicles.length > 0 
        ? Math.max(0, Math.min(100,
            100 - (vehiclesNeedingMaintenance / vehicles.length) * 30
          ))
        : 100

      setStats({
        totalDrivers: drivers.length,
        totalVehicles: vehicles.length,
        availableVehicles: vehicles.filter(v => v.status === 'AVAILABLE').length,
        activeDrivers: drivers.filter(d => d.status === 'ACTIVE').length,
        vehiclesNeedingMaintenance,
        totalMileage,
        fleetHealth: Math.round(fleetHealth)
      })

      // Get recent items (last 5)
      setRecentDrivers(drivers.slice(0, 5))
      setRecentVehicles(vehicles.slice(0, 5))
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      toastError('Failed to load dashboard data')
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }

  // Fonction utilitaire pour obtenir le type de carburant
  const getFuelType = (vehicle: Vehicle): string => {
    const vehicleAny = vehicle as any
    return vehicleAny.fuelType || 'Petrol'
  }

  // Fonction utilitaire pour obtenir l'efficacité du carburant
  const getFuelEfficiency = (vehicle: Vehicle): number => {
    const vehicleAny = vehicle as any
    return vehicleAny.fuelEfficiency || 8
  }

  const statsCards = [
    {
      title: 'Fleet Size',
      value: stats.totalVehicles,
      icon: Car,
      color: 'bg-gradient-to-br from-red-500 via-orange-500 to-red-600',
      iconColor: 'text-white',
      trend: stats.totalVehicles > 0 ? '+8%' : '0%',
      description: 'Total vehicles',
      metric: 'units',
      action: () => router.push('/vehicles')
    },
    {
      title: 'Active Drivers',
      value: stats.activeDrivers,
      icon: Users,
      color: 'bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500',
      iconColor: 'text-white',
      trend: stats.activeDrivers > 0 ? '+15%' : '0%',
      description: 'On duty',
      metric: 'drivers',
      action: () => router.push('/drivers?status=ACTIVE')
    },
    {
      title: 'Available Now',
      value: stats.availableVehicles,
      icon: CheckCircle,
      color: 'bg-gradient-to-br from-emerald-500 via-green-400 to-emerald-600',
      iconColor: 'text-white',
      trend: stats.availableVehicles > 0 ? '+5%' : '0%',
      description: 'Ready for dispatch',
      metric: 'vehicles',
      action: () => router.push('/vehicles?status=AVAILABLE')
    },
    {
      title: 'Fleet Health',
      value: `${stats.fleetHealth}%`,
      icon: Cpu,
      color: 'bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500',
      iconColor: 'text-white',
      trend: stats.fleetHealth > 80 ? 'Excellent' : stats.fleetHealth > 60 ? 'Good' : 'Needs Attention',
      description: 'Overall condition',
      metric: 'score',
      action: () => router.push('/analytics')
    }
  ]

  const quickActions = [
    {
      title: 'Dispatch Vehicle',
      description: 'Assign trip to driver',
      icon: Route,
      color: 'bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700',
      hoverColor: 'hover:shadow-lg hover:shadow-blue-500/25',
      action: () => router.push('/dispatch')
    },
    {
      title: 'Add Vehicle',
      description: 'Register new fleet vehicle',
      icon: Car,
      color: 'bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600',
      hoverColor: 'hover:shadow-lg hover:shadow-green-500/25',
      action: () => router.push('/vehicles/create')
    },
    {
      title: 'Schedule Maintenance',
      description: 'Plan vehicle service',
      icon: Settings,
      color: 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600',
      hoverColor: 'hover:shadow-lg hover:shadow-amber-500/25',
      action: () => router.push('/maintenance')
    },
    {
      title: 'Fleet Analytics',
      description: 'View performance reports',
      icon: BarChart3,
      color: 'bg-gradient-to-r from-purple-500 via-purple-600 to-pink-600',
      hoverColor: 'hover:shadow-lg hover:shadow-purple-500/25',
      action: () => router.push('/analytics')
    }
  ]

  const maintenanceAlerts = [
    {
      title: 'Maintenance Due',
      count: stats.vehiclesNeedingMaintenance,
      icon: Wrench,
      color: 'from-orange-500 to-amber-500',
      action: () => router.push('/maintenance?status=DUE')
    },
    {
      title: 'Insurance Expiry',
      count: 3,
      icon: Shield,
      color: 'from-red-500 to-pink-500',
      action: () => router.push('/vehicles?filter=insurance')
    },
    {
      title: 'Low Battery',
      count: 2,
      icon: BatteryCharging,
      color: 'from-yellow-500 to-amber-500',
      action: () => router.push('/vehicles?filter=battery')
    }
  ]

  if (!mounted) {
    return null // Évite les problèmes d'hydratation
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="text-center">
          <div className="relative mx-auto w-16 h-16">
            <Car className="w-16 h-16 text-blue-500 animate-pulse" />
            <div className="absolute inset-0 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="mt-4 text-gray-600 animate-pulse">
            Initializing fleet dashboard...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 p-2 animate-fadeIn">
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 p-8 text-white animate-slideInUp">
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-5 animate-pulse-slow">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23ffffff' fill-opacity='0.4' fill-rule='evenodd'/%3E%3C/svg%3E")`
          }}></div>
        </div>
        
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg">
                  <Navigation size={24} />
                </div>
                <h1 className="text-3xl font-bold tracking-tight animate-fadeIn">Fleet Control Center</h1>
              </div>
              <p className="mt-3 text-gray-300 max-w-2xl animate-fadeIn">
                Welcome back, <span className="font-semibold text-white">{user?.firstName}</span>. 
                Real-time monitoring of {stats.totalVehicles} vehicles and {stats.totalDrivers} drivers.
              </p>
              
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <div className="flex items-center bg-white/10 backdrop-blur-sm px-4 py-2.5 rounded-lg border border-white/20 transition-transform hover:scale-105">
                  <Clock size={18} className="mr-2.5 text-blue-300" />
                  <span className="text-sm">{new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'short', 
                    day: 'numeric' 
                  })}</span>
                </div>
                
                <div className="flex items-center bg-white/10 backdrop-blur-sm px-4 py-2.5 rounded-lg border border-white/20 transition-transform hover:scale-105">
                  <MapPin size={18} className="mr-2.5 text-green-300" />
                  <span className="text-sm">{stats.totalVehicles} Vehicles Active</span>
                </div>
                
                <div className="flex items-center bg-white/10 backdrop-blur-sm px-4 py-2.5 rounded-lg border border-white/20 transition-transform hover:scale-105">
                  <Gauge size={18} className="mr-2.5 text-purple-300" />
                  <span className="text-sm">{(stats.totalMileage / 1000).toFixed(0)}K Total KM</span>
                </div>
              </div>
            </div>
            
            <div className="mt-6 md:mt-0">
              <div className="text-right">
                <div className="flex items-center justify-end">
                  <Zap size={20} className="text-yellow-400 mr-2 animate-pulse" />
                  <div className="text-sm text-gray-300">System Status</div>
                </div>
                <div className="text-3xl font-bold mt-1.5 animate-pulse">
                  {stats.fleetHealth}%
                </div>
                <div className="text-sm text-gray-400">Fleet Health Score</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Animated car icon */}
        <div className="absolute right-8 -bottom-4 opacity-20 animate-float">
          <Car size={120} />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => (
          <div 
            key={index}
            className="animate-slideInUp"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="group relative overflow-hidden border border-gray-200/50 bg-white/50 backdrop-blur-sm rounded-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
              {/* Animated background */}
              <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent animate-shimmer"></div>
              
              <Card className="border-none bg-transparent">
                <CardBody className="p-6 relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-4">
                        <div 
                          className={`${stat.color} p-3 rounded-xl shadow-lg transition-transform group-hover:rotate-6 group-hover:scale-110 duration-300`}
                        >
                          <stat.icon size={22} className="text-white" />
                        </div>
                        <div className="text-sm font-medium px-3 py-1 rounded-full bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border border-green-200 animate-pulse">
                          {stat.trend}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {stat.title}
                        </div>
                        <div className="flex items-baseline">
                          <div className="text-3xl font-bold text-gray-900">
                            {stat.value}
                          </div>
                          <div className="ml-2 text-sm text-gray-500">{stat.metric}</div>
                        </div>
                        <div className="text-sm text-gray-600">{stat.description}</div>
                      </div>
                      <div className="transition-transform hover:translate-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-6 group-hover:text-blue-600 transition-colors"
                          onClick={stat.action}
                        >
                          View Details
                          <div className="inline-block ml-2 animate-bounce-horizontal">
                            <Car size={16} />
                          </div>
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>
          </div>
        ))}
      </div>

      {/* Alerts Section */}
      {stats.vehiclesNeedingMaintenance > 0 && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-50/80 to-amber-50/80 border border-orange-200 p-6 backdrop-blur-sm animate-fadeIn">
          {/* Pulse animation */}
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-orange-500/10 to-transparent animate-shimmer"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-3 rounded-xl shadow-lg animate-wiggle">
                  <AlertTriangle size={24} className="text-white" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">Attention Required</h3>
                  <p className="text-gray-600">Immediate actions needed for fleet optimization</p>
                </div>
              </div>
              <div className="transition-transform hover:scale-105">
                <Button
                  variant="outline"
                  className="border-orange-300 text-orange-700 hover:bg-orange-50 bg-white/50 backdrop-blur-sm"
                  onClick={() => router.push('/maintenance')}
                >
                  View All Alerts
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              {maintenanceAlerts.map((alert, index) => (
                <div
                  key={index}
                  className="animate-slideInUp"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div
                    className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-gray-200/50 shadow-sm hover:shadow-md transition-all hover:scale-105 cursor-pointer active:scale-95"
                    onClick={alert.action}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-gray-500">{alert.title}</div>
                        <div className="text-2xl font-bold text-gray-900 mt-1">{alert.count}</div>
                      </div>
                      <div className={`bg-gradient-to-r ${alert.color} p-3 rounded-lg`}>
                        <alert.icon size={20} className="text-white" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn">
        {/* Recent Vehicles */}
        <div className="lg:col-span-2">
          <Card className="border border-gray-200/50 bg-white/50 backdrop-blur-sm overflow-hidden">
            <CardHeader className="border-b border-gray-100 pb-4 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Recent Vehicles</h3>
                  <p className="text-sm text-gray-600 mt-1">Latest additions to the fleet</p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="transition-transform hover:rotate-180 duration-500">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={loadDashboardData}
                      disabled={isRefreshing}
                      className="rounded-full"
                    >
                      <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
                    </Button>
                  </div>
                  <div className="transition-transform hover:scale-105">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-gray-300"
                      onClick={() => router.push('/vehicles')}
                    >
                      View All Fleet
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardBody className="p-0">
              <div className="divide-y divide-gray-100/50">
                {recentVehicles.length === 0 ? (
                  <div className="text-center py-12 animate-fadeIn">
                    <Car size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500">No vehicles in fleet</p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => router.push('/vehicles/create')}
                    >
                      Add First Vehicle
                    </Button>
                  </div>
                ) : (
                  recentVehicles.map((vehicle, index) => (
                    <div
                      key={vehicle.id}
                      className="animate-slideInLeft"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div 
                        className="flex items-center justify-between p-6 hover:bg-white/30 transition-all hover:translate-x-2 cursor-pointer group"
                        onClick={() => router.push(`/vehicles/edit/${vehicle.id}`)}
                      >
                        <div className="flex items-center flex-1">
                          <div className="relative">
                            <div 
                              className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center transition-transform group-hover:rotate-6"
                            >
                              <Car size={24} className="text-gray-700" />
                            </div>
                            <div className="absolute -top-1 -right-1">
                              <StatusBadge 
                                type="vehicle" 
                                status={vehicle.status}
                                size="sm"
                              />
                            </div>
                          </div>
                          <div className="ml-4 flex-1">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                  {vehicle.registrationNumber}
                                </div>
                                <div className="text-sm text-gray-600 mt-1">
                                  {vehicle.brand} {vehicle.model} • {vehicle.year}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-medium text-gray-900">
                                  {(vehicle.mileage || 0).toLocaleString()} km
                                </div>
                                <div className="text-sm text-gray-500">Mileage</div>
                              </div>
                            </div>
                            <div className="flex items-center mt-3 space-x-4">
                              <div className="flex items-center text-sm text-gray-500">
                                <Fuel size={14} className="mr-1" />
                                {getFuelType(vehicle)}
                              </div>
                              <div className="flex items-center text-sm text-gray-500">
                                <Gauge size={14} className="mr-1" />
                                {getFuelEfficiency(vehicle)} km/L
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-8">
          {/* Quick Actions */}
          <Card className="border border-gray-200/50 bg-white/50 backdrop-blur-sm overflow-hidden">
            <CardHeader>
              <h3 className="text-xl font-bold text-gray-900">Quick Actions</h3>
              <p className="text-sm text-gray-600 mt-1">Frequent fleet operations</p>
            </CardHeader>
            <CardBody>
              <div className="space-y-3">
                {quickActions.map((action, index) => (
                  <div
                    key={index}
                    className="animate-slideInRight"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <button
                      onClick={action.action}
                      className={`w-full flex items-center p-4 rounded-xl transition-all duration-300 ${action.color} ${action.hoverColor} shadow-md hover:scale-102 hover:shadow-lg active:scale-95`}
                    >
                      <div className="bg-white/20 p-2 rounded-lg transition-transform hover:rotate-360 duration-500">
                        <action.icon size={20} className="text-white" />
                      </div>
                      <div className="text-left ml-4">
                        <div className="font-semibold text-white">{action.title}</div>
                        <div className="text-sm text-white/90">{action.description}</div>
                      </div>
                      <div className="ml-auto animate-bounce-horizontal opacity-0 group-hover:opacity-100">
                        <Sparkles size={16} className="text-white" />
                      </div>
                    </button>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* Recent Drivers */}
          <Card className="border border-gray-200/50 bg-white/50 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Active Drivers</h3>
                  <p className="text-sm text-gray-600 mt-1">Currently on duty</p>
                </div>
                <div className="transition-transform hover:scale-105">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push('/drivers')}
                  >
                    View All
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                {recentDrivers.length === 0 ? (
                  <div className="text-center py-8 animate-fadeIn">
                    <Users size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500">No active drivers</p>
                  </div>
                ) : (
                  recentDrivers.map((driver, index) => (
                    <div
                      key={driver.id}
                      className="animate-slideInUp"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div 
                        className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-white/50 cursor-pointer transition-all hover:translate-x-2"
                        onClick={() => router.push(`/drivers/edit/${driver.id}`)}
                      >
                        <div className="flex items-center">
                          <div className="relative transition-transform hover:scale-110">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                              {driver.firstName[0]}{driver.lastName[0]}
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-r from-green-500 to-emerald-500 border-2 border-white rounded-full animate-pulse"></div>
                          </div>
                          <div className="ml-4">
                            <div className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
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
                    </div>
                  ))
                )}
              </div>
            </CardBody>
          </Card>

          {/* Fleet Summary */}
          <Card className="border border-gray-200/50 bg-gradient-to-br from-gray-50/80 to-white/80 backdrop-blur-sm overflow-hidden">
            <CardBody className="p-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl mb-4 animate-float">
                  <Car size={28} className="text-white" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900">Fleet Summary</h4>
                <div className="mt-4 space-y-3">
                  {[
                    { label: 'Total Vehicles', value: stats.totalVehicles },
                    { label: 'Available', value: stats.availableVehicles, color: 'text-green-600' },
                    { label: 'In Maintenance', value: stats.vehiclesNeedingMaintenance, color: 'text-orange-600' },
                    { label: 'Total Mileage', value: `${(stats.totalMileage / 1000).toFixed(1)}K km` },
                  ].map((item, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center animate-fadeIn"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <span className="text-gray-600">{item.label}</span>
                      <span className={`font-semibold ${item.color || 'text-gray-900'}`}>
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="transition-transform hover:scale-105 active:scale-95">
                  <Button
                    className="w-full mt-6 bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-900 hover:to-black shadow-lg"
                    onClick={() => router.push('/analytics')}
                  >
                    View Detailed Analytics
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Ajouter ces styles CSS pour les animations */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideInUp {
          from { 
            opacity: 0;
            transform: translateY(20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideInLeft {
          from { 
            opacity: 0;
            transform: translateX(-20px);
          }
          to { 
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes slideInRight {
          from { 
            opacity: 0;
            transform: translateX(20px);
          }
          to { 
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(-5px) translateX(10px); }
        }
        
        @keyframes wiggle {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(10deg); }
          75% { transform: rotate(-10deg); }
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        @keyframes bounce-horizontal {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(5px); }
        }
        
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.8; }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }
        
        .animate-slideInUp {
          animation: slideInUp 0.5s ease-out forwards;
          opacity: 0;
        }
        
        .animate-slideInLeft {
          animation: slideInLeft 0.5s ease-out forwards;
          opacity: 0;
        }
        
        .animate-slideInRight {
          animation: slideInRight 0.5s ease-out forwards;
          opacity: 0;
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .animate-wiggle {
          animation: wiggle 2s ease-in-out infinite;
        }
        
        .animate-shimmer {
          animation: shimmer 3s infinite;
        }
        
        .animate-bounce-horizontal {
          animation: bounce-horizontal 1.5s infinite;
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }
        
        .scale-102 {
          transform: scale(1.02);
        }
        
        .rotate-360 {
          transform: rotate(360deg);
        }
        
        .rotate-6 {
          transform: rotate(6deg);
        }
        
        .rotate-180 {
          transform: rotate(180deg);
        }
        
        .hover\\:rotate-180:hover {
          transform: rotate(180deg);
        }
        
        .hover\\:rotate-360:hover {
          transform: rotate(360deg);
        }
        
        .hover\\:rotate-6:hover {
          transform: rotate(6deg);
        }
      `}</style>
    </div>
  )
}