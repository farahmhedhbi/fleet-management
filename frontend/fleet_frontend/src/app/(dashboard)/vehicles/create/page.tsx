'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardBody, CardFooter } from '@/components/ui/Card'
import { toastSuccess, toastError } from '@/components/ui/Toast'
import { vehicleService } from '@/lib/services/vehicleService'
import { VehicleDTO } from '@/types/vehicle'
import VehicleForm from '@/components/forms/VehicleForm'

export default function CreateVehiclePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (formData: VehicleDTO) => {
    setLoading(true)
    
    try {
      await vehicleService.create(formData)
      toastSuccess('Vehicle created successfully')
      router.push('/vehicles')
    } catch (error: any) {
      toastError(error.response?.data?.message || 'Failed to create vehicle')
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
            Back to Vehicles
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Add New Vehicle</h1>
          <p className="text-gray-600 mt-2">Fill in the details to add a new vehicle to your fleet</p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardBody>
          <VehicleForm
            isOpen={true}
            onClose={() => router.push('/vehicles')}
            vehicle={null}
            onSuccess={() => router.push('/vehicles')}
          />
        </CardBody>
        <CardFooter>
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => router.push('/vehicles')}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="vehicle-form"
              loading={loading}
            >
              Create Vehicle
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}