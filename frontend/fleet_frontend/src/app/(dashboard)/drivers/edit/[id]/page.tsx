'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, User } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardBody, CardFooter } from '@/components/ui/Card'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { toastError } from '@/components/ui/Toast'
import { driverService } from '@/lib/services/driverService'
import { Driver, DriverDTO } from '@/types/driver'
import DriverForm from '@/components/forms/DriverForm'

export default function EditDriverPage() {
  const router = useRouter()
  const params = useParams()
  const id = Number(params.id)

  const [driver, setDriver] = useState<Driver | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    if (id) {
      loadDriver()
    }
  }, [id])

  const loadDriver = async () => {
    try {
      const data = await driverService.getById(id)
      setDriver(data)
    } catch (error) {
      toastError('Failed to load driver details')
      router.push('/drivers')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (formData: DriverDTO) => {
    setUpdating(true)
    
    try {
      await driverService.update(id, formData)
      router.push('/drivers')
    } catch (error: any) {
      toastError(error.response?.data?.message || 'Failed to update driver')
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

  if (!driver) {
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
            Back to Drivers
          </button>
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <User size={24} className="text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Edit Driver: {driver.firstName} {driver.lastName}
              </h1>
              <p className="text-gray-600 mt-2">Update driver information and status</p>
            </div>
          </div>
        </div>
        <div className="text-sm text-gray-500">
          ID: {driver.id}
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardBody>
          <DriverForm
            isOpen={true}
            onClose={() => router.push('/drivers')}
            driver={driver}
            onSuccess={() => router.push('/drivers')}
          />
        </CardBody>
        <CardFooter>
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Created: {new Date(driver.createdAt).toLocaleDateString()}
              {driver.updatedAt !== driver.createdAt && (
                <span className="ml-4">
                  Last updated: {new Date(driver.updatedAt).toLocaleDateString()}
                </span>
              )}
            </div>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => router.push('/drivers')}
                disabled={updating}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form="driver-form"
                loading={updating}
              >
                Update Driver
              </Button>
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}