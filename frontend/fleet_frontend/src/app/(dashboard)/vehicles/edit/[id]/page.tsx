'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Car } from 'lucide-react'
import { toast } from 'react-toastify'
import { vehicleService } from '@/lib/services/vehicleService'
import VehicleForm from '@/components/forms/VehicleForm'

export default function EditVehiclePage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id ? Number(params.id) : null

  const [vehicle, setVehicle] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      loadVehicle()
    } else {
      router.push('/vehicles')
    }
  }, [id, router])

  const loadVehicle = async () => {
    try {
      const data = await vehicleService.getById(id!)
      setVehicle(data)
    } catch (error: any) {
      console.error('Failed to load vehicle:', error)
      toast.error(error.message || 'Failed to load vehicle details')
      router.push('/vehicles')
    } finally {
      setLoading(false)
    }
  }

  const handleSuccess = () => {
    router.push('/vehicles')
    router.refresh()
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!vehicle) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
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
                <h1 className="text-3xl font-bold text-gray-900">
                  {vehicle.brand} {vehicle.model}
                </h1>
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

        {/* Form */}
        <VehicleForm
          isOpen={true}
          onClose={() => router.push('/vehicles')}
          vehicle={vehicle}
          onSuccess={handleSuccess}
        />
      </div>
    </div>
  )
}