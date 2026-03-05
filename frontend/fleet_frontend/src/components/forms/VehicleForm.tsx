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

  // --- UI helpers (design only) ---
  const baseInput =
    'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition ' +
    'placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 disabled:bg-slate-50'
  const baseSelect = baseInput
  const labelCls = 'block text-sm font-semibold text-slate-700 mb-1.5'
  const helpErr =
    'mt-1.5 inline-flex items-center rounded-lg bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700'
  const card =
    'rounded-2xl border border-slate-200 bg-white/80 shadow-sm backdrop-blur'
  const cardHeader = 'flex items-start justify-between gap-3 px-5 pt-5'
  const cardBody = 'px-5 pb-5 pt-4'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* overlay */}
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* modal */}
      <div className="relative w-full max-w-4xl overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white to-slate-50 shadow-2xl">
        {/* top bar / header */}
        <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur">
          <div className="flex items-start justify-between gap-4 px-6 py-5">
            <div>
              <h2 className="text-xl md:text-2xl font-extrabold tracking-tight text-slate-900">
                {vehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Fill in the details below. Fields marked with <span className="font-semibold">*</span> are required.
              </p>
            </div>

            <button
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-700 active:scale-[0.98]"
              aria-label="Close"
              type="button"
            >
              ✕
            </button>
          </div>
        </div>

        {/* body scroll */}
        <div className="max-h-[75vh] overflow-y-auto px-6 py-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* SECTION 1 */}
            <section className={card}>
              <div className={cardHeader}>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Basic Information</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    Identification and key vehicle details.
                  </p>
                </div>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                  Required fields
                </span>
              </div>

              <div className={cardBody}>
                <div className="space-y-4">
                  {/* Registration Number */}
                  <div>
                    <label className={labelCls}>Registration Number *</label>
                    <input
                      type="text"
                      {...register('registrationNumber', {
                        required: 'Registration number is required',
                        pattern: {
                          value: /^[A-Z0-9-]+$/,
                          message: 'Invalid registration number format'
                        }
                      })}
                      className={baseInput}
                      placeholder="ABC-123"
                    />
                    {errors.registrationNumber && (
                      <p className={helpErr}>{errors.registrationNumber.message as any}</p>
                    )}
                  </div>

                  {/* Brand, Model, Year */}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div>
                      <label className={labelCls}>Brand *</label>
                      <input
                        type="text"
                        {...register('brand', { required: 'Brand is required' })}
                        className={baseInput}
                        placeholder="Toyota"
                      />
                      {errors.brand && <p className={helpErr}>{errors.brand.message as any}</p>}
                    </div>

                    <div>
                      <label className={labelCls}>Model *</label>
                      <input
                        type="text"
                        {...register('model', { required: 'Model is required' })}
                        className={baseInput}
                        placeholder="Camry"
                      />
                      {errors.model && <p className={helpErr}>{errors.model.message as any}</p>}
                    </div>

                    <div>
                      <label className={labelCls}>Year *</label>
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
                        className={baseInput}
                        placeholder="2023"
                      />
                      {errors.year && <p className={helpErr}>{errors.year.message as any}</p>}
                    </div>
                  </div>

                  {/* Color and VIN */}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className={labelCls}>Color</label>
                      <input
                        type="text"
                        {...register('color')}
                        className={baseInput}
                        placeholder="Red"
                      />
                      <p className="mt-1 text-xs text-slate-500">Optional — helps filtering and quick recognition.</p>
                    </div>

                    <div>
                      <label className={labelCls}>VIN (Vehicle Identification Number)</label>
                      <input
                        type="text"
                        {...register('vin', {
                          pattern: {
                            value: /^[A-HJ-NPR-Z0-9]{17}$/,
                            message: 'VIN must be 17 characters (A-Z, 0-9)'
                          }
                        })}
                        className={baseInput}
                        placeholder="1HGBH41JXMN109186"
                      />
                      {errors.vin && <p className={helpErr}>{errors.vin.message as any}</p>}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 2 */}
            <section className={card}>
              <div className={cardHeader}>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Technical Details</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    Fuel, transmission, usage status and mileage.
                  </p>
                </div>
              </div>

              <div className={cardBody}>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className={labelCls}>Fuel Type</label>
                    <select {...register('fuelType')} className={baseSelect}>
                      <option value="GASOLINE">Gasoline</option>
                      <option value="DIESEL">Diesel</option>
                      <option value="ELECTRIC">Electric</option>
                      <option value="HYBRID">Hybrid</option>
                      <option value="LPG">LPG</option>
                    </select>
                  </div>

                  <div>
                    <label className={labelCls}>Transmission</label>
                    <select {...register('transmission')} className={baseSelect}>
                      <option value="MANUAL">Manual</option>
                      <option value="AUTOMATIC">Automatic</option>
                      <option value="SEMI_AUTOMATIC">Semi-Automatic</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className={labelCls}>Status *</label>
                    <select
                      {...register('status', { required: 'Status is required' })}
                      className={baseSelect}
                    >
                      <option value="AVAILABLE">Available</option>
                      <option value="IN_USE">In Use</option>
                      <option value="UNDER_MAINTENANCE">Under Maintenance</option>
                      <option value="OUT_OF_SERVICE">Out of Service</option>
                      <option value="RESERVED">Reserved</option>
                    </select>
                    {errors.status && <p className={helpErr}>{errors.status.message as any}</p>}
                  </div>

                  <div>
                    <label className={labelCls}>Mileage (km)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      {...register('mileage', {
                        valueAsNumber: true,
                        min: { value: 0, message: 'Mileage cannot be negative' }
                      })}
                      className={baseInput}
                      placeholder="0"
                    />
                    {errors.mileage && <p className={helpErr}>{errors.mileage.message as any}</p>}
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 3 */}
            <section className={card}>
              <div className={cardHeader}>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Maintenance</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    Keep your maintenance schedule up to date.
                  </p>
                </div>
              </div>

              <div className={cardBody}>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className={labelCls}>Last Maintenance Date</label>
                    <input
                      type="date"
                      {...register('lastMaintenanceDate' as any)}
                      className={baseInput}
                    />
                  </div>

                  <div>
                    <label className={labelCls}>Next Maintenance Date</label>
                    <input
                      type="date"
                      {...register('nextMaintenanceDate' as any)}
                      className={baseInput}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* ACTIONS */}
            <div className="sticky bottom-0 -mx-6 mt-2 border-t border-slate-200 bg-white/80 px-6 py-4 backdrop-blur">
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-xs text-slate-500">
                  {loadingDrivers ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
                      Loading drivers…
                    </span>
                  ) : (
                    <span>
                      {drivers.length} driver(s) loaded
                    </span>
                  )}
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-[0.98] disabled:opacity-50"
                    disabled={loading}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-white" />
                        {vehicle ? 'Updating…' : 'Creating…'}
                      </span>
                    ) : (
                      <>{vehicle ? 'Update Vehicle' : 'Create Vehicle'}</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default VehicleForm