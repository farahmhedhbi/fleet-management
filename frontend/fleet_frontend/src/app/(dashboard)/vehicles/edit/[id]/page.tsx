'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Car } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardBody, CardFooter } from '@/components/ui/Card'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { toastError } from '@/components/ui/Toast'
import { vehicleService } from '@/lib/services/vehicleService'
import { Vehicle, VehicleDTO } from '@/types/vehicle'
import VehicleForm from '@/components/forms/VehicleForm'
import { formatDate } from '@/lib/utils/helpers'

export default function EditVehiclePage() {
  const router = useRouter()
  const params = useParams()
  const id = Number(params.id)

  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    if (id) {
      loadVehicle()
    }
  }, [id])

  const loadVehicle = async () => {
    try {
      const data = await vehicleService.getById(id)
      setVehicle(data)
    } catch (error) {
      toastError('Failed to load vehicle details')
      router.push('/vehicles')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (formData: VehicleDTO) => {
    setUpdating(true)
    
    try {
      await vehicleService.update(id, formData)
      router.push('/vehicles')
    } catch (error: any) {
      toastError(error.response?.data?.message || 'Failed to update vehicle')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!vehicle) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Vehicles
          </button>
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <Car size={24} className="text-gray-600" />
            </div>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-3xl font-bold text-gray-900">
                  {vehicle.brand} {vehicle.model}
                </h1>
                <StatusBadge 
                  type="vehicle" 
                  status={vehicle.status}
                  size="md"
                />
              </div>
              <p className="text-gray-600 mt-2">
                Registration: {vehicle.registrationNumber} • Year: {vehicle.year}
              </p>
            </div>
          </div>
        </div>
        <div className="text-sm text-gray-500">
          ID: {vehicle.id}
        </div>
      </div>

      {/* Vehicle Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Vehicle Information</h3>
          </CardHeader>
          <CardBody>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Registration Number</dt>
                <dd className="mt-1 text-sm text-gray-900">{vehicle.registrationNumber}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">VIN</dt>
                <dd className="mt-1 text-sm text-gray-900">{vehicle.vin || 'Not provided'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Fuel Type</dt>
                <dd className="mt-1">
                  {vehicle.fuelType && (
                    <StatusBadge 
                      type="fuel" 
                      status={vehicle.fuelType}
                      size="sm"
                    />
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Transmission</dt>
                <dd className="mt-1 text-sm text-gray-900">{vehicle.transmission || 'Not specified'}</dd>
              </div>
            </dl>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Maintenance</h3>
          </CardHeader>
          <CardBody>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Current Mileage</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {(vehicle.mileage || 0).toLocaleString()} km
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Last Maintenance</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {vehicle.lastMaintenanceDate 
                    ? formatDate(vehicle.lastMaintenanceDate) 
                    : 'Not recorded'
                  }
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Next Maintenance</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {vehicle.nextMaintenanceDate 
                    ? formatDate(vehicle.nextMaintenanceDate) 
                    : 'Not scheduled'
                  }
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Assigned Driver</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {vehicle.driverName || 'No driver assigned'}
                </dd>
              </div>
            </dl>
          </CardBody>
        </Card>
      </div>

      {/* Edit Form */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Edit Vehicle Details</h3>
          <p className="text-sm text-gray-500 mt-1">Update the vehicle information as needed</p>
        </CardHeader>
        <CardBody>
          <VehicleForm
            isOpen={true}
            onClose={() => router.push('/vehicles')}
            vehicle={vehicle}
            onSuccess={() => router.push('/vehicles')}
          />
        </CardBody>
        <CardFooter>
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Created: {formatDate(vehicle.createdAt)}
              {vehicle.updatedAt !== vehicle.createdAt && (
                <span className="ml-4">
                  Last updated: {formatDate(vehicle.updatedAt)}
                </span>
              )}
            </div>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => router.push('/vehicles')}
                disabled={updating}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form="vehicle-form"
                loading={updating}
              >
                Update Vehicle
              </Button>
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}