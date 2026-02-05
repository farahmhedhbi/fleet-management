'use client'

import React, { useState, useEffect, FormEvent } from 'react'
import { useForm } from 'react-hook-form'
import { DriverDTO, DriverStatus } from '@/types/driver'
import { Modal, ModalFooter } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { driverService } from '@/lib/services/driverService'
import { toastSuccess, toastError } from '@/components/ui/Toast'

interface DriverFormProps {
  isOpen: boolean
  onClose: () => void
  driver?: DriverDTO | null
  onSuccess: () => void
}

export const DriverForm: React.FC<DriverFormProps> = ({
  isOpen,
  onClose,
  driver,
  onSuccess
}) => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<DriverDTO>()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (driver) {
      reset({
        firstName: driver.firstName,
        lastName: driver.lastName,
        email: driver.email,
        phone: driver.phone || '',
        licenseNumber: driver.licenseNumber,
        licenseExpiry: driver.licenseExpiry || '',
        ecoScore: driver.ecoScore || 0,
        status: driver.status || 'ACTIVE'
      })
    } else {
      reset({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        licenseNumber: '',
        licenseExpiry: '',
        ecoScore: 0,
        status: 'ACTIVE'
      })
    }
  }, [driver, reset])

  const onSubmit = async (data: DriverDTO) => {
    setLoading(true)
    try {
      if (driver?.id) {
        await driverService.update(driver.id, data)
        toastSuccess('Driver updated successfully')
      } else {
        await driverService.create(data)
        toastSuccess('Driver created successfully')
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
      title={driver ? 'Edit Driver' : 'Add New Driver'}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name *
              </label>
              <input
                type="text"
                {...register('firstName', { required: 'First name is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="John"
              />
              {errors.firstName && (
                <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name *
              </label>
              <input
                type="text"
                {...register('lastName', { required: 'Last name is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Doe"
              />
              {errors.lastName && (
                <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              {...register('email', { 
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address'
                }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="john.doe@example.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              {...register('phone')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="+1 (555) 123-4567"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              License Number *
            </label>
            <input
              type="text"
              {...register('licenseNumber', { required: 'License number is required' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="DL123456789"
            />
            {errors.licenseNumber && (
              <p className="mt-1 text-sm text-red-600">{errors.licenseNumber.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                License Expiry
              </label>
              <input
                type="date"
                {...register('licenseExpiry')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Eco Score
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                {...register('ecoScore')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status *
            </label>
            <select
              {...register('status', { required: 'Status is required' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="ON_LEAVE">On Leave</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
            {errors.status && (
              <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
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
            {driver ? 'Update' : 'Create'} Driver
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}
export default DriverForm