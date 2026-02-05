'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, User } from 'lucide-react'
import { toast } from 'react-toastify'
import { driverService } from '@/lib/services/driverService'
import { Driver, DriverDTO } from '@/types/driver'

export default function EditDriverPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id ? Number(params.id) : null

  const [driver, setDriver] = useState<Driver | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [formData, setFormData] = useState<DriverDTO>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    licenseNumber: '',
    licenseExpiry: '',
    ecoScore: 0.0,
    status: 'ACTIVE',
  })

  useEffect(() => {
    if (id) {
      loadDriver()
    } else {
      router.push('/drivers')
    }
  }, [id, router])

  const loadDriver = async () => {
    try {
      const data = await driverService.getById(id!)
      setDriver(data)
      
      // Initialiser les données du formulaire
      setFormData({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone || '',
        licenseNumber: data.licenseNumber,
        licenseExpiry: data.licenseExpiry || '',
        ecoScore: data.ecoScore || 0.0,
        status: data.status || 'ACTIVE',
      })
    } catch (error: any) {
      console.error('Failed to load driver:', error)
      toast.error(error.message || 'Failed to load driver details')
      router.push('/drivers')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    
    setFormData(prev => ({
      ...prev,
      [name]: name === 'ecoScore' ? parseFloat(value) || 0.0 : value
    }))
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!id) return
    
    setUpdating(true)

    try {
      // Validation basique
      if (!formData.firstName || !formData.lastName || !formData.email || !formData.licenseNumber) {
        toast.error('Please fill in all required fields')
        return
      }

      // Préparer les données pour l'envoi
      const submissionData: DriverDTO = {
        ...formData,
        ecoScore: formData.ecoScore || 0.0,
        status: formData.status || 'ACTIVE'
      }

      console.log('Updating driver with data:', submissionData)

      await driverService.update(id, submissionData)
      toast.success('Driver updated successfully!')
      
      router.push('/drivers')
      router.refresh()
    } catch (error: any) {
      console.error('Error updating driver:', error)
      
      // Afficher des messages d'erreur plus précis
      if (error.status === 400) {
        if (error.data?.message?.includes('Email')) {
          toast.error('Email already exists or is invalid')
        } else if (error.data?.message?.includes('License')) {
          toast.error('License number already exists')
        } else {
          toast.error(error.data?.message || 'Invalid data. Please check your inputs.')
        }
      } else {
        toast.error(error.message || 'Failed to update driver')
      }
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!driver) {
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
        <div className="bg-white rounded-xl shadow p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  License Number *
                </label>
                <input
                  type="text"
                  name="licenseNumber"
                  value={formData.licenseNumber}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  License Expiry
                </label>
                <input
                  type="datetime-local"
                  name="licenseExpiry"
                  value={formData.licenseExpiry ? formData.licenseExpiry.substring(0, 16) : ''}
                  onChange={handleDateChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Eco Score
                </label>
                <input
                  type="number"
                  name="ecoScore"
                  value={formData.ecoScore}
                  onChange={handleChange}
                  step="0.1"
                  min="0"
                  max="100"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="ON_LEAVE">On Leave</option>
                  <option value="SUSPENDED">Suspended</option>
                </select>
              </div>
            </div>

            <div className="flex gap-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                disabled={updating}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updating}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updating ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Updating...
                  </span>
                ) : (
                  'Update Driver'
                )}
              </button>
            </div>
          </form>

          {/* Footer avec informations */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-sm text-gray-500">
            <div>
              Created: {new Date(driver.createdAt).toLocaleDateString()} at{' '}
              {new Date(driver.createdAt).toLocaleTimeString()}
            </div>
            {driver.updatedAt !== driver.createdAt && (
              <div className="mt-2">
                Last updated: {new Date(driver.updatedAt).toLocaleDateString()} at{' '}
                {new Date(driver.updatedAt).toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}