'use client'

import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { VehicleDTO } from '@/types/vehicle'
import { Driver } from '@/types/driver'
import { toast } from 'react-toastify'
import { vehicleService } from '@/lib/services/vehicleService'
import { driverService } from '@/lib/services/driverService'

interface VehicleFormProps {
  isOpen: boolean
  onClose: () => void
  vehicle?: VehicleDTO | null
  onSuccess: () => void
}

/**
 * Convertit une valeur d'input date:
 * - "" | undefined | null => null
 * - "YYYY-MM-DD" => "YYYY-MM-DDT00:00:00" (compatible LocalDateTime)
 * - "YYYY-MM-DDTHH:mm:ss" => inchangé
 */
const toLocalDateTimeOrNull = (v: any): string | null => {
  if (v === undefined || v === null) return null
  const s = String(v).trim()
  if (!s) return null

  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return `${s}T00:00:00`
  }
  return s
}

export const VehicleForm: React.FC<VehicleFormProps> = ({
  isOpen,
  onClose,
  vehicle,
  onSuccess
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<VehicleDTO>({
    defaultValues: {
      registrationNumber: '',
      brand: '',
      model: '',
      year: new Date().getFullYear(),
      color: '',
      vin: '',
      fuelType: 'GASOLINE' as any,
      transmission: 'MANUAL' as any,
      status: 'AVAILABLE' as any,
      mileage: 0,
      // ✅ IMPORTANT: pas de "" pour LocalDateTime -> sinon 400
      lastMaintenanceDate: undefined as any,
      nextMaintenanceDate: undefined as any,
      driverId: undefined
    }
  })

  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingDrivers, setLoadingDrivers] = useState(false)

  useEffect(() => {
    loadDrivers()
  }, [])

  useEffect(() => {
    if (vehicle) {
      // Pour afficher dans <input type="date">, on garde "YYYY-MM-DD"
      const formattedVehicle: any = {
        ...vehicle,
        lastMaintenanceDate: vehicle.lastMaintenanceDate
          ? String(vehicle.lastMaintenanceDate).split('T')[0]
          : undefined,
        nextMaintenanceDate: vehicle.nextMaintenanceDate
          ? String(vehicle.nextMaintenanceDate).split('T')[0]
          : undefined
      }
      reset(formattedVehicle)
    } else {
      reset({
        registrationNumber: '',
        brand: '',
        model: '',
        year: new Date().getFullYear(),
        color: '',
        vin: '',
        fuelType: 'GASOLINE' as any,
        transmission: 'MANUAL' as any,
        status: 'AVAILABLE' as any,
        mileage: 0,
        // ✅ IMPORTANT
        lastMaintenanceDate: undefined as any,
        nextMaintenanceDate: undefined as any,
        driverId: undefined
      })
    }
  }, [vehicle, reset])

  const loadDrivers = async () => {
    setLoadingDrivers(true)
    try {
      const data = await driverService.getAll()
      setDrivers(data)
    } catch (error: any) {
      console.error('Failed to load drivers:', error)
      toast.error(error?.response?.data?.message || error.message || 'Failed to load drivers')
    } finally {
      setLoadingDrivers(false)
    }
  }

  const onSubmit = async (data: VehicleDTO) => {
    setLoading(true)
    try {
      // ✅ Payload corrigé pour le backend (LocalDateTime + numbers + nulls)
      const payload: any = {
        ...data,

        // numbers
        year: data.year == null ? null : Number(data.year),
        mileage: data.mileage == null ? 0 : Number(data.mileage),

        // driverId: "" -> null ; string -> number
        driverId: data.driverId == null ? null : Number(data.driverId),

        // LocalDateTime attendu par Spring (pas "" et pas "YYYY-MM-DD")
        lastMaintenanceDate: toLocalDateTimeOrNull((data as any).lastMaintenanceDate),
        nextMaintenanceDate: toLocalDateTimeOrNull((data as any).nextMaintenanceDate),

        // trim strings
        registrationNumber: data.registrationNumber?.trim(),
        brand: data.brand?.trim(),
        model: data.model?.trim(),
        color: data.color?.trim() ? data.color.trim() : null,

        // vin vide => null (évite problèmes unique + validation)
        vin: data.vin?.trim() ? data.vin.trim() : null
      }

      console.log('Payload sent to backend:', payload)

      if (vehicle?.id) {
        await vehicleService.update(vehicle.id, payload)
        toast.success('Vehicle updated successfully')
      } else {
        await vehicleService.create(payload)
        toast.success('Vehicle created successfully')
      }

      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Form submission error:', {
        status: error?.response?.status,
        data: error?.response?.data,
        message: error?.message
      })
      toast.error(error?.response?.data?.message || error.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {vehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              {/* Registration Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Registration Number *
                </label>
                <input
                  type="text"
                  {...register('registrationNumber', {
                    required: 'Registration number is required',
                    pattern: {
                      value: /^[A-Z0-9-]+$/,
                      message: 'Invalid registration number format'
                    }
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  placeholder="ABC-123"
                />
                {errors.registrationNumber && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.registrationNumber.message as any}
                  </p>
                )}
              </div>

              {/* Brand, Model, Year */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Brand *
                  </label>
                  <input
                    type="text"
                    {...register('brand', { required: 'Brand is required' })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    placeholder="Toyota"
                  />
                  {errors.brand && (
                    <p className="mt-1 text-sm text-red-600">{errors.brand.message as any}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Model *
                  </label>
                  <input
                    type="text"
                    {...register('model', { required: 'Model is required' })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    placeholder="Camry"
                  />
                  {errors.model && (
                    <p className="mt-1 text-sm text-red-600">{errors.model.message as any}</p>
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
                      max: {
                        value: new Date().getFullYear() + 1,
                        message: 'Year cannot be more than 1 year in the future'
                      },
                      valueAsNumber: true
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    placeholder="2023"
                  />
                  {errors.year && (
                    <p className="mt-1 text-sm text-red-600">{errors.year.message as any}</p>
                  )}
                </div>
              </div>

              {/* Color and VIN */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Color
                  </label>
                  <input
                    type="text"
                    {...register('color')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    placeholder="Red"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    VIN (Vehicle Identification Number)
                  </label>
                  <input
                    type="text"
                    {...register('vin', {
                      pattern: {
                        value: /^[A-HJ-NPR-Z0-9]{17}$/,
                        message: 'VIN must be 17 characters (A-Z, 0-9)'
                      }
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    placeholder="1HGBH41JXMN109186"
                  />
                  {errors.vin && (
                    <p className="mt-1 text-sm text-red-600">{errors.vin.message as any}</p>
                  )}
                </div>
              </div>

              {/* Fuel Type and Transmission */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fuel Type
                  </label>
                  <select
                    {...register('fuelType')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  >
                    <option value="MANUAL">Manual</option>
                    <option value="AUTOMATIC">Automatic</option>
                    <option value="SEMI_AUTOMATIC">Semi-Automatic</option>
                  </select>
                </div>
              </div>

              {/* Status and Mileage */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status *
                  </label>
                  <select
                    {...register('status', { required: 'Status is required' })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  >
                    <option value="AVAILABLE">Available</option>
                    <option value="IN_USE">In Use</option>
                    <option value="UNDER_MAINTENANCE">Under Maintenance</option>
                    <option value="OUT_OF_SERVICE">Out of Service</option>
                    <option value="RESERVED">Reserved</option>
                  </select>
                  {errors.status && (
                    <p className="mt-1 text-sm text-red-600">{errors.status.message as any}</p>
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
                    {...register('mileage', {
                      valueAsNumber: true,
                      min: { value: 0, message: 'Mileage cannot be negative' }
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    placeholder="0"
                  />
                  {errors.mileage && (
                    <p className="mt-1 text-sm text-red-600">{errors.mileage.message as any}</p>
                  )}
                </div>
              </div>

              {/* Maintenance Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Maintenance Date
                  </label>
                  <input
                    type="date"
                    {...register('lastMaintenanceDate' as any)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Next Maintenance Date
                  </label>
                  <input
                    type="date"
                    {...register('nextMaintenanceDate' as any)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  />
                </div>
              </div>

              {/* Driver Assignment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assign to Driver
                </label>
                <select
                  {...register('driverId', {
                    setValueAs: (value) => (value === '' ? undefined : Number(value))
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
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
                  <p className="mt-2 text-sm text-gray-500">Loading drivers...</p>
                )}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
                disabled={loading}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (vehicle ? 'Updating...' : 'Creating...') : (vehicle ? 'Update Vehicle' : 'Create Vehicle')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default VehicleForm
