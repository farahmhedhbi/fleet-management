'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, User, Mail, Phone, Car, Calendar, Star, Shield, Sparkles, TrendingUp, Zap, Settings, Edit, Eye, Activity, Award, Navigation, CheckCircle, AlertCircle, Clock, Users, BatteryCharging, CarFront } from 'lucide-react'
import { toast } from 'react-toastify'
import { driverService } from '@/lib/services/driverService'
import { Driver, DriverDTO } from '@/types/driver'

export default function EditDriverPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id ? Number(params.id) : null
  const containerRef = useRef<HTMLDivElement>(null)

  const [driver, setDriver] = useState<Driver | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [efficiency, setEfficiency] = useState(0)
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

  // Effet de particules claires
  useEffect(() => {
    if (!containerRef.current || loading) return

    const particles: HTMLDivElement[] = []
    const container = containerRef.current

    for (let i = 0; i < 12; i++) {
      const particle = document.createElement('div')
      const size = Math.random() * 3 + 1
      const colors = ['#60a5fa', '#38bdf8', '#a78bfa', '#34d399']
      const color = colors[Math.floor(Math.random() * colors.length)]
      
      particle.className = 'particle absolute rounded-full'
      particle.style.cssText = `
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        opacity: ${Math.random() * 0.1 + 0.05};
        top: ${Math.random() * 100}%;
        left: ${Math.random() * 100}%;
        animation: float-particle ${Math.random() * 20 + 15}s linear infinite;
        animation-delay: ${Math.random() * 3}s;
        filter: blur(0.5px);
      `
      
      container.appendChild(particle)
      particles.push(particle)
    }

    return () => {
      particles.forEach(p => p.remove())
    }
  }, [loading])

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

      // Calculer l'efficacité
      let baseScore = 50
      if (data.status === 'ACTIVE') baseScore = Math.floor(Math.random() * 30) + 70
      if (data.status === 'INACTIVE') baseScore = Math.floor(Math.random() * 40) + 30
      if (data.status === 'SUSPENDED') baseScore = Math.floor(Math.random() * 30)
      
      if (data.ecoScore && data.ecoScore > 80) baseScore += 20
      else if (data.ecoScore && data.ecoScore > 60) baseScore += 10
      
      setEfficiency(Math.max(30, Math.min(100, baseScore)))
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!id) return
    
    setUpdating(true)

    try {
      if (!formData.firstName || !formData.lastName || !formData.email || !formData.licenseNumber) {
        toast.error('Please fill in all required fields')
        return
      }

      const submissionData: DriverDTO = {
        ...formData,
        ecoScore: formData.ecoScore || 0.0,
        status: formData.status || 'ACTIVE'
      }

      await driverService.update(id, submissionData)
      toast.success('Driver updated successfully!')
      
      router.push('/drivers')
    } catch (error: any) {
      console.error('Error updating driver:', error)
      
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

  const getPerformanceColor = (efficiency: number) => {
    if (efficiency >= 80) return 'from-emerald-400 to-emerald-500'
    if (efficiency >= 60) return 'from-amber-400 to-amber-500'
    return 'from-rose-400 to-rose-500'
  }

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'ACTIVE': return 'bg-emerald-100 text-emerald-800 border-emerald-200'
      case 'INACTIVE': return 'bg-amber-100 text-amber-800 border-amber-200'
      case 'ON_LEAVE': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'SUSPENDED': return 'bg-rose-100 text-rose-800 border-rose-200'
      default: return 'bg-slate-100 text-slate-800 border-slate-200'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full blur-xl opacity-30 animate-pulse"></div>
            <div className="relative h-20 w-20 rounded-full border-4 border-white bg-gradient-to-r from-blue-400 to-cyan-400 p-0.5 shadow-xl">
              <div className="h-full w-full rounded-full bg-white flex items-center justify-center">
                <User className="h-8 w-8 text-blue-500 animate-bounce" />
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="h-2 w-48 bg-blue-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-400 to-cyan-400 animate-shimmer"></div>
            </div>
            <p className="text-blue-600 font-medium">Chargement des informations du conducteur...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!driver) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 text-slate-800" ref={containerRef}>
      {/* Floating Action Buttons */}
      <div className="fixed top-6 right-6 z-50 flex gap-3">
        <button className="bg-white p-3 rounded-xl shadow-lg border border-slate-200 hover:shadow-xl hover:-translate-y-0.5 transition-all">
          <Settings className="h-5 w-5 text-slate-600" />
        </button>
      </div>

      {/* Header avec effets spéciaux */}
      <div className="relative pt-16 pb-8 overflow-hidden">
        {/* Effets de fond */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-100/20 via-transparent to-cyan-100/20"></div>
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-blue-200/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-cyan-200/10 rounded-full blur-3xl"></div>
        
        <div className="container mx-auto px-6 relative z-10">
          {/* Bouton retour */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-600 hover:text-blue-600 mb-8 group transition-all duration-300"
          >
            <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Retour aux conducteurs</span>
          </button>

          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-8 mb-8">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-xl blur-md opacity-50"></div>
                  <div className="relative w-20 h-20 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-2xl font-bold text-white shadow-xl">
                    <User className="h-10 w-10" />
                  </div>
                </div>
                
                <div>
                  <h1 className="text-4xl lg:text-5xl font-bold mb-2 leading-tight">
                    <span className="bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 bg-clip-text text-transparent animate-gradient-text">
                      Modifier le conducteur
                    </span>
                  </h1>
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl text-slate-700 font-semibold">
                      {driver.firstName} {driver.lastName}
                    </h2>
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold ${getStatusColor(driver.status)} border`}>
                      {driver.status === 'ACTIVE' ? <CheckCircle className="h-3 w-3" /> :
                       driver.status === 'INACTIVE' ? <Clock className="h-3 w-3" /> :
                       driver.status === 'ON_LEAVE' ? <Clock className="h-3 w-3" /> :
                       <AlertCircle className="h-3 w-3" />}
                      {driver.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Shield className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">ID Conducteur</p>
                      <p className="text-slate-800 font-medium">#{driver.id}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 rounded-lg">
                      <CarFront className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Permis</p>
                      <p className="text-slate-800 font-medium">{driver.licenseNumber || 'N/A'}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 rounded-lg">
                      <Star className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Eco Score</p>
                      <p className="text-slate-800 font-medium">{driver.ecoScore || '0.0'}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Calendar className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Date de création</p>
                      <p className="text-slate-800 font-medium">
                        {new Date(driver.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance Bar */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-lg mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-1">Performance du conducteur</h3>
                    <p className="text-sm text-slate-600">Basée sur le statut et l'eco score</p>
                  </div>
                  <div className="text-2xl font-bold" style={{
                    color: efficiency >= 80 ? '#10b981' :
                           efficiency >= 60 ? '#f59e0b' : '#ef4444'
                  }}>
                    {efficiency}%
                  </div>
                </div>
                <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full bg-gradient-to-r ${getPerformanceColor(efficiency)} rounded-full transition-all duration-1000`}
                    style={{ width: `${efficiency}%` }}
                  ></div>
                </div>
                <div className="flex justify-between mt-2 text-sm text-slate-500">
                  <span>Faible</span>
                  <span>Excellent</span>
                </div>
              </div>
            </div>
            
            <div className="lg:w-80">
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border border-blue-200 p-6 shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-slate-800">Conseils d'édition</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <span className="text-sm text-slate-600">Vérifiez toutes les informations avant sauvegarde</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <span className="text-sm text-slate-600">Mettez à jour le numéro de permis si nécessaire</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <span className="text-sm text-slate-600">Assurez-vous que le statut correspond à la réalité</span>
                  </li>
                </ul>
              </div>
              
              <div className="mt-4 bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl border border-emerald-200 p-6 shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-gradient-to-r from-emerald-500 to-green-500 rounded-lg">
                    <Activity className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-slate-800">Statistiques rapides</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Depuis</span>
                    <span className="text-sm font-medium text-slate-800">
                      {new Date(driver.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Dernière mise à jour</span>
                    <span className="text-sm font-medium text-slate-800">
                      {driver.updatedAt ? new Date(driver.updatedAt).toLocaleDateString() : 'Jamais'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Expiration permis</span>
                    <span className="text-sm font-medium text-slate-800">
                      {driver.licenseExpiry ? new Date(driver.licenseExpiry).toLocaleDateString() : 'Non défini'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form Container */}
      <div className="container mx-auto px-6 pb-16">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
          {/* Form Header */}
          <div className="px-8 py-6 bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg">
                <Edit className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">Formulaire de modification</h2>
                <p className="text-slate-600">Modifiez les informations du conducteur ci-dessous</p>
              </div>
            </div>
          </div>
          
          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            {/* Personal Information */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800">Informations personnelles</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    Prénom <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all placeholder-slate-500 hover:border-slate-400"
                    required
                    placeholder="Entrez le prénom"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    Nom <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all placeholder-slate-500 hover:border-slate-400"
                    required
                    placeholder="Entrez le nom"
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <Mail className="h-5 w-5 text-emerald-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800">Informations de contact</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    Adresse email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all placeholder-slate-500 hover:border-slate-400"
                      required
                      placeholder="conducteur@example.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    Numéro de téléphone
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all placeholder-slate-500 hover:border-slate-400"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Driver Details */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Car className="h-5 w-5 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800">Détails du conducteur</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    Numéro de permis <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Shield className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                      type="text"
                      name="licenseNumber"
                      value={formData.licenseNumber}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all placeholder-slate-500 hover:border-slate-400"
                      required
                      placeholder="DL123456789"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    Date d'expiration du permis
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                      type="datetime-local"
                      name="licenseExpiry"
                      value={formData.licenseExpiry ? formData.licenseExpiry.substring(0, 16) : ''}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    Score écologique
                  </label>
                  <div className="relative">
                    <Star className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                      type="number"
                      name="ecoScore"
                      value={formData.ecoScore}
                      onChange={handleChange}
                      step="0.1"
                      min="0"
                      max="100"
                      className="w-full pl-12 pr-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                      placeholder="0.0"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    Statut
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all appearance-none hover:border-slate-400"
                  >
                    <option value="ACTIVE" className="text-emerald-600">🟢 Actif</option>
                    <option value="INACTIVE" className="text-amber-600">🟡 Inactif</option>
                    <option value="ON_LEAVE" className="text-blue-600">🔵 En congé</option>
                    <option value="SUSPENDED" className="text-rose-600">🔴 Suspendu</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="pt-8 border-t border-slate-200">
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  type="button"
                  onClick={() => router.push('/drivers')}
                  className="px-8 py-4 bg-white border-2 border-slate-300 text-slate-700 font-semibold rounded-xl hover:border-slate-400 hover:bg-slate-50 transition-all duration-300"
                  disabled={updating}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="flex-1 px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-cyan-600 hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  {updating ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Mise à jour en cours...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center group-hover:scale-105 transition-transform">
                      Mettre à jour le conducteur
                    </span>
                  )}
                </button>
              </div>
            </div>
          </form>

          {/* Form Footer */}
          <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-200">
            <div className="flex items-center justify-between text-sm text-slate-500">
              <div className="flex items-center gap-4">
                <span>ID: {driver.id}</span>
                <span className="h-1 w-1 bg-slate-300 rounded-full"></span>
                <span>Créé le: {new Date(driver.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="text-right">
                <span className="text-blue-600 font-medium">Les champs marqués d'un * sont obligatoires</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Styles d'animation */}
      <style jsx global>{`
        @keyframes gradient-text {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        @keyframes float-particle {
          0% { transform: translateY(0) rotate(0deg); opacity: 0.1; }
          25% { transform: translateY(-40px) rotate(90deg); opacity: 0.3; }
          50% { transform: translateY(-20px) rotate(180deg); opacity: 0.2; }
          75% { transform: translateY(-40px) rotate(270deg); opacity: 0.3; }
          100% { transform: translateY(0) rotate(360deg); opacity: 0.1; }
        }

        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }

        .animate-gradient-text {
          background-size: 200% 100%;
          animation: gradient-text 3s ease infinite;
        }

        .animate-shimmer {
          background: linear-gradient(90deg, #60a5fa 25%, #38bdf8 50%, #60a5fa 75%);
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
        }

        .animate-bounce {
          animation: bounce 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}