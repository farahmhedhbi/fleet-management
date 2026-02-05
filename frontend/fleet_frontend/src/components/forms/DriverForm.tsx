'use client'

import { useState, FormEvent, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-toastify'
import { 
  Save, 
  X, 
  User, 
  Mail, 
  Phone, 
  IdCard, 
  Calendar,
  TrendingUp,
  Shield,
  ArrowLeft
} from 'lucide-react'
import { driverService } from '@/lib/services/driverService'
import { DriverDTO } from '@/types/driver'

interface DriverFormProps {
  driver?: DriverDTO
  isEdit?: boolean
}

export default function DriverForm({ driver, isEdit = false }: DriverFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<DriverDTO>({
    firstName: driver?.firstName || '',
    lastName: driver?.lastName || '',
    email: driver?.email || '',
    phone: driver?.phone || '',
    licenseNumber: driver?.licenseNumber || '',
    licenseExpiry: driver?.licenseExpiry || '',
    ecoScore: driver?.ecoScore || 0.0,
    status: driver?.status || 'ACTIVE',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Validation en temps réel
  useEffect(() => {
    validateForm()
  }, [formData])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Validation du prénom
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required'
    } else if (formData.firstName.length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters'
    }

    // Validation du nom
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required'
    } else if (formData.lastName.length < 2) {
      newErrors.lastName = 'Last name must be at least 2 characters'
    }

    // Validation de l'email
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    // Validation du numéro de permis
    if (!formData.licenseNumber.trim()) {
      newErrors.licenseNumber = 'License number is required'
    } else if (formData.licenseNumber.length < 5) {
      newErrors.licenseNumber = 'License number must be at least 5 characters'
    }

    // Validation du téléphone
    if (formData.phone && !/^[\+]?[0-9\s\-\(\)]+$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number'
    }

    // Validation du score écologique
    if (formData.ecoScore !== undefined) {
      if (formData.ecoScore < 0 || formData.ecoScore > 100) {
        newErrors.ecoScore = 'Eco score must be between 0 and 100'
      }
    }

    // Validation de la date d'expiration
    if (formData.licenseExpiry) {
      const expiryDate = new Date(formData.licenseExpiry)
      const today = new Date()
      if (expiryDate < today) {
        newErrors.licenseExpiry = 'License expiry date cannot be in the past'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0.0 : value
    }))
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    
    setFormData(prev => ({
      ...prev,
      [name]: value ? `${value}T00:00:00` : '' // Format pour le backend
    }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form')
      return
    }

    setLoading(true)

    try {
      // Préparer les données pour l'envoi
      const submissionData: DriverDTO = {
        ...formData,
        ecoScore: formData.ecoScore || 0.0,
        status: formData.status || 'ACTIVE'
      }

      if (isEdit && driver?.id) {
        await driverService.update(driver.id, submissionData)
        toast.success('Driver updated successfully!')
      } else {
        await driverService.create(submissionData)
        toast.success('Driver created successfully!')
      }
      
      router.push('/drivers')
      router.refresh()
    } catch (error: any) {
      console.error('Error saving driver:', error)
      
      // Afficher des messages d'erreur plus précis
      if (error.status === 400) {
        if (error.data?.message?.includes('Email')) {
          toast.error('Email already exists or is invalid')
        } else if (error.data?.message?.includes('License')) {
          toast.error('License number already exists')
        } else {
          toast.error(error.data?.message || 'Invalid data. Please check your inputs.')
        }
      } else if (error.status === 403) {
        toast.error('You do not have permission to perform this action')
      } else if (error.status === 404) {
        toast.error('Resource not found')
      } else if (error.status === 500) {
        toast.error('Server error. Please try again later.')
      } else {
        toast.error(error.message || 'Failed to save driver')
      }
    } finally {
      setLoading(false)
    }
  }

  const formatDateForInput = (dateString?: string): string => {
    if (!dateString) return ''
    return dateString.split('T')[0]
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* En-tête */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={() => router.back()}
              className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft size={20} className="mr-2" />
              Back to Drivers
            </button>
            <h1 className="text-3xl font-bold text-gray-900">
              {isEdit ? 'Edit Driver' : 'Add New Driver'}
            </h1>
            <p className="text-gray-600 mt-2">
              {isEdit ? 'Update driver information and status' : 'Add a new driver to your fleet'}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              isEdit 
                ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' 
                : 'bg-green-100 text-green-800 border border-green-200'
            }`}>
              {isEdit ? 'Editing Mode' : 'Creation Mode'}
            </div>
          </div>
        </div>
      </div>

      {/* Formulaire */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-8">
          <div className="space-y-8">
            {/* Section Informations personnelles */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <User className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Personal Information</h2>
                  <p className="text-gray-600 text-sm">Basic information about the driver</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* First Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
                        errors.firstName ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="John"
                    />
                  </div>
                  {errors.firstName && (
                    <p className="mt-2 text-sm text-red-600">{errors.firstName}</p>
                  )}
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
                        errors.lastName ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Doe"
                    />
                  </div>
                  {errors.lastName && (
                    <p className="mt-2 text-sm text-red-600">{errors.lastName}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Section Contact */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-green-100 rounded-xl">
                  <Mail className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Contact Information</h2>
                  <p className="text-gray-600 text-sm">How to reach the driver</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
                        errors.email ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="john.doe@example.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-2 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
                        errors.phone ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                  {errors.phone && (
                    <p className="mt-2 text-sm text-red-600">{errors.phone}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Section Licence */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-purple-100 rounded-xl">
                  <IdCard className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">License Information</h2>
                  <p className="text-gray-600 text-sm">Driver's license details</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* License Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    License Number *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <IdCard className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="licenseNumber"
                      value={formData.licenseNumber}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
                        errors.licenseNumber ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="DL12345678"
                    />
                  </div>
                  {errors.licenseNumber && (
                    <p className="mt-2 text-sm text-red-600">{errors.licenseNumber}</p>
                  )}
                </div>

                {/* License Expiry */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    License Expiry Date
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calendar className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="date"
                      name="licenseExpiry"
                      value={formatDateForInput(formData.licenseExpiry)}
                      onChange={handleDateChange}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
                        errors.licenseExpiry ? 'border-red-300' : 'border-gray-300'
                      }`}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  {errors.licenseExpiry && (
                    <p className="mt-2 text-sm text-red-600">{errors.licenseExpiry}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Section Performance */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-orange-100 rounded-xl">
                  <TrendingUp className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Performance & Status</h2>
                  <p className="text-gray-600 text-sm">Driver performance metrics</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Eco Score */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Eco Score
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <TrendingUp className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="number"
                      name="ecoScore"
                      value={formData.ecoScore}
                      onChange={handleChange}
                      step="0.1"
                      min="0"
                      max="100"
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
                        errors.ecoScore ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="0-100"
                    />
                  </div>
                  {errors.ecoScore && (
                    <p className="mt-2 text-sm text-red-600">{errors.ecoScore}</p>
                  )}
                  <p className="mt-1 text-sm text-gray-500">Score from 0 (poor) to 100 (excellent)</p>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Shield className="h-5 w-5 text-gray-400" />
                    </div>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition appearance-none"
                    >
                      <option value="ACTIVE" className="bg-green-50 text-green-800">Active</option>
                      <option value="INACTIVE" className="bg-gray-50 text-gray-800">Inactive</option>
                      <option value="ON_LEAVE" className="bg-yellow-50 text-yellow-800">On Leave</option>
                      <option value="SUSPENDED" className="bg-red-50 text-red-800">Suspended</option>
                    </select>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">Current driver status</p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2 font-medium"
                disabled={loading}
              >
                <X size={20} />
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || Object.keys(errors).length > 0}
                className="flex-1 px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none flex items-center justify-center gap-2 font-medium shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    {isEdit ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    {isEdit ? 'Update Driver' : 'Create Driver'}
                  </>
                )}
              </button>
            </div>
            
            {/* Indications de validation */}
            <div className="mt-6 flex items-center gap-3">
              <div className={`h-3 w-3 rounded-full ${
                Object.keys(errors).length === 0 ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <span className="text-sm text-gray-600">
                {Object.keys(errors).length === 0 
                  ? 'All fields are valid' 
                  : `${Object.keys(errors).length} error${Object.keys(errors).length > 1 ? 's' : ''} need to be fixed`}
              </span>
            </div>
          </div>
        </form>
      </div>

      {/* Informations utiles */}
      <div className="mt-8 p-6 bg-blue-50 rounded-2xl border border-blue-200">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-100 rounded-xl">
            <Shield className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Important Information</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Fields marked with * are required</li>
              <li>• License number must be unique for each driver</li>
              <li>• Email address will be used for login credentials</li>
              <li>• Eco score helps track driver performance and fuel efficiency</li>
              <li>• License expiry date is required for compliance tracking</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}