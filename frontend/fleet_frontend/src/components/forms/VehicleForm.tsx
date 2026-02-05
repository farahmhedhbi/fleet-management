'use client'

import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { VehicleDTO, VehicleStatus, FuelType, TransmissionType } from '@/types/vehicle'
import { Driver } from '@/types/driver'
import { Modal, ModalFooter } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { vehicleService } from '@/lib/services/vehicleService'
import { driverService } from '@/lib/services/driverService'
import { toastSuccess, toastError } from '@/components/ui/Toast'

interface VehicleFormProps {
  isOpen: boolean
  onClose: () => void
  vehicle?: VehicleDTO | null
  onSuccess: () => void
}

export const VehicleForm: React.FC<VehicleFormProps> = ({
  isOpen,
  onClose,
  vehicle,
  onSuccess
}) => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<VehicleDTO>()
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingDrivers, setLoadingDrivers] = useState(false)

  useEffect(() => {
    loadDrivers()
  }, [])

  useEffect(() => {
    if (vehicle) {
      reset({
        registrationNumber: vehicle.registrationNumber,
        brand: vehicle.brand,
        model: vehicle.model,
        year: vehicle.year,
        color: vehicle.color || '',
        vin: vehicle.vin || '',
        fuelType: vehicle.fuelType || 'GASOLINE',
        transmission: vehicle.transmission || 'MANUAL',
        status: vehicle.status || 'AVAILABLE',
        mileage: vehicle.mileage || 0,
        lastMaintenanceDate: vehicle.lastMaintenanceDate || '',
        nextMaintenanceDate: vehicle.nextMaintenanceDate || '',
        driverId: vehicle.driverId
      })
    } else {
      reset({
        registrationNumber: '',
        brand: '',
        model: '',
        year: new Date().getFullYear(),
        color: '',
        vin: '',
        fuelType: 'GASOLINE',
        transmission: 'MANUAL',
        status: 'AVAILABLE',
        mileage: 0,
        lastMaintenanceDate: '',
        nextMaintenanceDate: '',
        driverId: undefined
      })
    }
  }, [vehicle, reset])

  const loadDrivers = async () => {
    setLoadingDrivers(true)
    try {
      const data = await driverService.getAll()
      setDrivers(data)
    } catch (error) {
      toastError('Failed to load drivers')
    } finally {
      setLoadingDrivers(false)
    }
  }

  const onSubmit = async (data: VehicleDTO) => {
    setLoading(true)
    try {
      if (vehicle?.id) {
        await vehicleService.update(vehicle.id, data)
        toastSuccess('Vehicle updated successfully')
      } else {
        await vehicleService.create(data)
        toastSuccess('Vehicle created successfully')
      }
      onSuccess()
      onClose()
    } catch (error: any) {
      toastError(error.response?.data?.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={vehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Registration Number *
            </label>
            <input
              type="text"
              {...register('registrationNumber', { required: 'Registration number is required' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="ABC-123"
            />
            {errors.registrationNumber && (
              <p className="mt-1 text-sm text-red-600">{errors.registrationNumber.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Brand *
              </label>
              <input
                type="text"
                {...register('brand', { required: 'Brand is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Toyota"
              />
              {errors.brand && (
                <p className="mt-1 text-sm text-red-600">{errors.brand.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Model *
              </label>
              <input
                type="text"
                {...register('model', { required: 'Model is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Camry"
              />
              {errors.model && (
                <p className="mt-1 text-sm text-red-600">{errors.model.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Year *
              </label>
              <input
                type="number"
                {...register('year', { 
                  required: 'Year is required',
                  min: { value: 1900, message: 'Year must be after 1900' },
                  max: { value: new Date().getFullYear() + 1, message: 'Year cannot be in the future' }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="2023"
              />
              {errors.year && (
                <p className="mt-1 text-sm text-red-600">{errors.year.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Color
              </label>
              <input
                type="text"
                {...register('color')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Red"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                VIN (Vehicle Identification Number)
              </label>
              <input
                type="text"
                {...register('vin')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="1HGBH41JXMN109186"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fuel Type
              </label>
              <select
                {...register('fuelType')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="GASOLINE">Gasoline</option>
                <option value="DIESEL">Diesel</option>
                <option value="ELECTRIC">Electric</option>
                <option value="HYBRID">Hybrid</option>
                <option value="LPG">LPG</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Transmission
              </label>
              <select
                {...register('transmission')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="MANUAL">Manual</option>
                <option value="AUTOMATIC">Automatic</option>
                <option value="SEMI_AUTOMATIC">Semi-Automatic</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status *
              </label>
              <select
                {...register('status', { required: 'Status is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="AVAILABLE">Available</option>
                <option value="IN_USE">In Use</option>
                <option value="UNDER_MAINTENANCE">Under Maintenance</option>
                <option value="OUT_OF_SERVICE">Out of Service</option>
                <option value="RESERVED">Reserved</option>
              </select>
              {errors.status && (
                <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mileage (km)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                {...register('mileage')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Maintenance Date
              </label>
              <input
                type="date"
                {...register('lastMaintenanceDate')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Next Maintenance Date
              </label>
              <input
                type="date"
                {...register('nextMaintenanceDate')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assign to Driver
            </label>
            <select
              {...register('driverId')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loadingDrivers}
            >
              <option value="">No driver assigned</option>
              {drivers.map((driver) => (
                <option key={driver.id} value={driver.id}>
                  {driver.firstName} {driver.lastName} ({driver.licenseNumber})
                </option>
              ))}
            </select>
            {loadingDrivers && (
              <p className="mt-1 text-sm text-gray-500">Loading drivers...</p>
            )}
          </div>
        </div>

        <ModalFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={loading}
          >
            {vehicle ? 'Update' : 'Create'} Vehicle
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}
export default VehicleForm