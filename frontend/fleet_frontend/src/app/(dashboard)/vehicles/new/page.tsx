'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import VehicleForm from '@/components/forms/VehicleForm'

export default function CreateVehiclePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleSuccess = () => {
    router.push('/vehicles')
    router.refresh()
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
            <h1 className="text-3xl font-bold text-gray-900">Add New Vehicle</h1>
            <p className="text-gray-600 mt-2">Fill in the details to add a new vehicle to your fleet</p>
          </div>
        </div>

        {/* Form */}
        <VehicleForm
          isOpen={true}
          onClose={() => router.push('/vehicles')}
          vehicle={null}
          onSuccess={handleSuccess}
        />
      </div>
    </div>
  )
}