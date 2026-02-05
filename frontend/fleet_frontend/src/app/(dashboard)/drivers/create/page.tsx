'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardBody, CardFooter } from '@/components/ui/Card'
import { toastSuccess, toastError } from '@/components/ui/Toast'
import { driverService } from '@/lib/services/driverService'
import { DriverDTO } from '@/types/driver'
import DriverForm from '@/components/forms/DriverForm'

export default function CreateDriverPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (formData: DriverDTO) => {
    setLoading(true)
    
    try {
      await driverService.create(formData)
      toastSuccess('Driver created successfully')
      router.push('/drivers')
    } catch (error: any) {
      toastError(error.response?.data?.message || 'Failed to create driver')
    } finally {
      setLoading(false)
    }
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
          <h1 className="text-3xl font-bold text-gray-900">Add New Driver</h1>
          <p className="text-gray-600 mt-2">Fill in the details to add a new driver to your fleet</p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardBody>
          <DriverForm
            isOpen={true}
            onClose={() => router.push('/drivers')}
            driver={null}
            onSuccess={() => router.push('/drivers')}
          />
        </CardBody>
        <CardFooter>
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => router.push('/drivers')}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="driver-form"
              loading={loading}
            >
              Create Driver
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}