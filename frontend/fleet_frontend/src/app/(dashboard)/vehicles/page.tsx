'use client'

import { useState, useEffect, ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Plus, 
  Search,
  Filter,
  Download,
  Car,
  AlertCircle,
  User,
  UserX
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHeadCell, 
  TableCell 
} from '@/components/ui/Table'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Modal } from '@/components/ui/Modal'
import { toastSuccess, toastError } from '@/components/ui/Toast'
import { vehicleService } from '@/lib/services/vehicleService'
import { driverService } from '@/lib/services/driverService'
import { Vehicle, VehicleStatus } from '@/types/vehicle'
import { Driver } from '@/types/driver'
import { formatDate } from '@/lib/utils/helpers'

export default function VehiclesPage() {
  const router = useRouter()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingDrivers, setLoadingDrivers] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<VehicleStatus | 'ALL'>('ALL')
  const [assignModal, setAssignModal] = useState<{ isOpen: boolean; vehicle: Vehicle | null }>({
    isOpen: false,
    vehicle: null
  })
  const [selectedDriverId, setSelectedDriverId] = useState<number>()

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    filterVehicles()
  }, [vehicles, searchTerm, statusFilter])

  const loadData = async () => {
    try {
      const [vehiclesData, driversData] = await Promise.all([
        vehicleService.getAll(),
        driverService.getAll()
      ])
      setVehicles(vehiclesData)
      setDrivers(driversData)
    } catch (error) {
      toastError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const filterVehicles = () => {
    let filtered = vehicles

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(vehicle =>
        vehicle.registrationNumber.toLowerCase().includes(term) ||
        vehicle.brand.toLowerCase().includes(term) ||
        vehicle.model.toLowerCase().includes(term) ||
        vehicle.vin?.toLowerCase().includes(term) ||
        vehicle.driverName?.toLowerCase().includes(term)
      )
    }

    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(vehicle => vehicle.status === statusFilter)
    }

    setFilteredVehicles(filtered)
  }

  const handleDelete = async (id: number, registration: string) => {
    if (!confirm(`Are you sure you want to delete vehicle ${registration}?`)) return

    try {
      await vehicleService.delete(id)
      await loadData()
    } catch (error) {
      toastError('Failed to delete vehicle')
    }
  }

  const handleAssignDriver = async () => {
    if (!assignModal.vehicle || !selectedDriverId) return

    try {
      await vehicleService.assignDriver(assignModal.vehicle.id, selectedDriverId)
      toastSuccess('Driver assigned successfully')
      setAssignModal({ isOpen: false, vehicle: null })
      setSelectedDriverId(undefined)
      await loadData()
    } catch (error) {
      toastError('Failed to assign driver')
    }
  }

  const handleRemoveDriver = async (vehicleId: number) => {
    if (!confirm('Remove driver from this vehicle?')) return

    try {
      await vehicleService.removeDriver(vehicleId)
      toastSuccess('Driver removed successfully')
      await loadData()
    } catch (error) {
      toastError('Failed to remove driver')
    }
  }

  const handleExport = () => {
    // Implement export functionality
    toastError('Export feature coming soon')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Vehicles</h1>
          <p className="text-gray-600 mt-2">Manage your fleet vehicles and assignments</p>
        </div>
        <Button
          onClick={() => router.push('/vehicles/create')}
          icon={Plus}
        >
          Add Vehicle
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search vehicles by registration, brand, model..."
                value={searchTerm}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <Filter size={20} className="text-gray-400 mr-2" />
                <select
                  value={statusFilter}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value as VehicleStatus | 'ALL')}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">All Status</option>
                  <option value="AVAILABLE">Available</option>
                  <option value="IN_USE">In Use</option>
                  <option value="UNDER_MAINTENANCE">Under Maintenance</option>
                  <option value="OUT_OF_SERVICE">Out of Service</option>
                  <option value="RESERVED">Reserved</option>
                </select>
              </div>
              
              <Button
                variant="outline"
                onClick={handleExport}
                icon={Download}
              >
                Export
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Table */}
        <CardBody>
          {filteredVehicles.length === 0 ? (
            <div className="text-center py-12">
              <Car size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No vehicles found</h3>
              <p className="text-gray-500">
                {searchTerm || statusFilter !== 'ALL' 
                  ? 'Try adjusting your search or filter to find what you\'re looking for.'
                  : 'Get started by adding your first vehicle.'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableHeadCell>Vehicle</TableHeadCell>
                <TableHeadCell>Details</TableHeadCell>
                <TableHeadCell>Status</TableHeadCell>
                <TableHeadCell>Driver</TableHeadCell>
                <TableHeadCell align="right">Actions</TableHeadCell>
              </TableHeader>
              <TableBody>
                {filteredVehicles.map((vehicle) => (
                  <TableRow 
                    key={vehicle.id}
                    onClick={() => router.push(`/vehicles/edit/${vehicle.id}`)}
                    className="cursor-pointer hover:bg-gray-50"
                  >
                    <TableCell>
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Car size={20} className="text-gray-600" />
                        </div>
                        <div className="ml-4">
                          <div className="font-medium text-gray-900">
                            {vehicle.registrationNumber}
                          </div>
                          <div className="text-sm text-gray-500">
                            {vehicle.brand} {vehicle.model}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-gray-900">
                          {vehicle.year} • {vehicle.color || 'N/A'}
                        </div>
                        {vehicle.fuelType && (
                          <StatusBadge 
                            type="fuel" 
                            status={vehicle.fuelType}
                            size="sm"
                          />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <StatusBadge 
                          type="vehicle" 
                          status={vehicle.status} 
                        />
                        <div className="text-sm text-gray-500">
                          Mileage: {(vehicle.mileage || 0).toLocaleString()} km
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {vehicle.driverName ? (
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900">
                              {vehicle.driverName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {vehicle.driverEmail}
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRemoveDriver(vehicle.id)
                            }}
                            className="ml-2 text-red-600 hover:text-red-900"
                            title="Remove driver"
                          >
                            <UserX size={16} />
                          </button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          icon={User}
                          onClick={(e) => {
                            e.stopPropagation()
                            setAssignModal({ isOpen: true, vehicle })
                          }}
                        >
                          Assign Driver
                        </Button>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <div className="flex justify-end space-x-2" onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/vehicles/edit/${vehicle.id}`)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(vehicle.id, vehicle.registrationNumber)
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Summary */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div>
                Showing <span className="font-medium">{filteredVehicles.length}</span> of{' '}
                <span className="font-medium">{vehicles.length}</span> vehicles
              </div>
              {filteredVehicles.length < vehicles.length && (
                <div className="flex items-center text-amber-600">
                  <AlertCircle size={16} className="mr-1" />
                  <span>Filtered results</span>
                </div>
              )}
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Assign Driver Modal */}
      <Modal
        isOpen={assignModal.isOpen}
        onClose={() => setAssignModal({ isOpen: false, vehicle: null })}
        title="Assign Driver"
      >
        {assignModal.vehicle && (
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              Select a driver to assign to vehicle: <strong>{assignModal.vehicle.registrationNumber}</strong>
            </div>
            
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {drivers.map((driver) => (
                <div
                  key={driver.id}
                  className={`p-3 border rounded-lg cursor-pointer transition ${
                    selectedDriverId === driver.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedDriverId(driver.id)}
                >
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-sm font-medium text-blue-600">
                        {driver.firstName[0]}{driver.lastName[0]}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {driver.firstName} {driver.lastName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {driver.licenseNumber} • {driver.email}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-gray-200">
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setAssignModal({ isOpen: false, vehicle: null })}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAssignDriver}
                  disabled={!selectedDriverId || loadingDrivers}
                  loading={loadingDrivers}
                >
                  Assign Driver
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}