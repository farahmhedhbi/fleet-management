'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/authContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'react-toastify'
import { driverService } from '@/lib/services/driverService'
import { DriverDTO } from '@/types/driver'
import {
  ArrowLeft,
  UserPlus,
  Sparkles,
  Zap,
  Shield,
  Car,
  Mail,
  Phone,
  Calendar,
  Star,
  Users,
  Activity,
  Award,
  User,
  FileText,
  Navigation,
} from 'lucide-react'

export default function CreateDriverPage() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)

  const [loading, setLoading] = useState(false)
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

  const isAdmin = user?.role === 'ROLE_ADMIN'

  // Effet de particules claires
  useEffect(() => {
    if (!containerRef.current) return

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
      particles.forEach((p) => p.remove())
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    // ✅ ADMIN ONLY (front)
    if (user?.role !== 'ROLE_ADMIN') {
      router.push('/drivers')
      return
    }
  }, [isAuthenticated, user, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target

    setFormData((prev) => ({
      ...prev,
      [name]: name === 'ecoScore' ? parseFloat(value) || 0.0 : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // ✅ sécurité front supplémentaire
    if (!isAdmin) {
      toast.error("Accès refusé : seul l'admin peut créer un conducteur.")
      return
    }

    setLoading(true)

    try {
      if (!formData.firstName || !formData.lastName || !formData.email || !formData.licenseNumber) {
        toast.error('Veuillez remplir tous les champs obligatoires')
        setLoading(false)
        return
      }

      await driverService.create(formData)
      toast.success('Conducteur créé avec succès !')

      router.push('/drivers')
      router.refresh()
    } catch (error: any) {
      console.error('Error creating driver:', error)

      if (error.status === 400) {
        if (error.data?.message?.includes('Email')) {
          toast.error('Cet email existe déjà ou est invalide')
        } else if (error.data?.message?.includes('License')) {
          toast.error('Ce numéro de permis existe déjà')
        } else {
          toast.error(error.data?.message || 'Données invalides. Veuillez vérifier vos informations.')
        }
      } else if (error.status === 403) {
        toast.error("Accès refusé : vous n'avez pas la permission.")
      } else {
        toast.error(error.message || 'Échec de la création du conducteur')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 text-slate-800" ref={containerRef}>
      {/* Floating Action Buttons */}
      <div className="fixed top-6 right-6 z-50 flex gap-3">
        <button className="bg-white p-3 rounded-xl shadow-lg border border-slate-200 hover:shadow-xl hover:-translate-y-0.5 transition-all">
          <Activity className="h-5 w-5 text-blue-500" />
        </button>
      </div>

      {/* Header */}
      <div className="relative pt-16 pb-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-100/20 via-transparent to-cyan-100/20"></div>
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-blue-200/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-cyan-200/10 rounded-full blur-3xl"></div>

        <div className="container mx-auto px-6 relative z-10">
          <Link href="/drivers" className="flex items-center gap-2 text-slate-600 hover:text-blue-600 mb-8 group transition-all duration-300">
            <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Retour aux conducteurs</span>
          </Link>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-12">
            <div className="flex-1">
              <h1 className="text-5xl lg:text-6xl font-bold mb-4 leading-tight">
                <span className="bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 bg-clip-text text-transparent animate-gradient-text">
                  Nouveau Conducteur
                </span>
                <br />
                <span className="text-3xl text-slate-600 font-normal">Ajoutez un membre à votre équipe</span>
              </h1>

              <p className="text-xl text-slate-600 max-w-2xl">
                Complétez le formulaire ci-dessous pour intégrer un nouveau conducteur dans votre flotte
              </p>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-2xl blur-xl opacity-30"></div>
              <div className="relative w-32 h-32 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-2xl">
                <UserPlus className="h-16 w-16 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="container mx-auto px-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="group bg-white rounded-2xl border border-slate-200 p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-xl blur opacity-30 group-hover:opacity-50 transition-opacity"></div>
                <div className="relative p-3 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-xl">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">Équipe complète</h3>
                <p className="text-sm text-slate-600">Vos conducteurs</p>
              </div>
            </div>
          </div>

          <div className="group bg-white rounded-2xl border border-slate-200 p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-green-400 rounded-xl blur opacity-30 group-hover:opacity-50 transition-opacity"></div>
                <div className="relative p-3 bg-gradient-to-br from-emerald-100 to-green-100 rounded-xl">
                  <Activity className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">Performance</h3>
                <p className="text-sm text-slate-600">Suivi en temps réel</p>
              </div>
            </div>
          </div>

          <div className="group bg-white rounded-2xl border border-slate-200 p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-400 rounded-xl blur opacity-30 group-hover:opacity-50 transition-opacity"></div>
                <div className="relative p-3 bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl">
                  <Award className="h-6 w-6 text-amber-600" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">Qualification</h3>
                <p className="text-sm text-slate-600">Permis vérifié</p>
              </div>
            </div>
          </div>

          <div className="group bg-white rounded-2xl border border-slate-200 p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-xl blur opacity-30 group-hover:opacity-50 transition-opacity"></div>
                <div className="relative p-3 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl">
                  <Shield className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">Sécurité</h3>
                <p className="text-sm text-slate-600">Données protégées</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 pb-16">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden">
            <div className="px-8 py-6 bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg">
                  <UserPlus className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Formulaire de création</h2>
                  <p className="text-slate-600">Remplissez les informations nécessaires pour ajouter un conducteur</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-8">
              {/* Personal Information */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-blue-100 to-blue-200 rounded-lg">
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
                  <div className="p-2 bg-gradient-to-r from-emerald-100 to-emerald-200 rounded-lg">
                    <Mail className="h-5 w-5 text-emerald-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800">Informations de contact</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">
                      Adresse email <span className="text-red-500">*</span>
                    </label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full pl-12 pr-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all placeholder-slate-500 hover:border-slate-400"
                        required
                        placeholder="conducteur@example.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">Numéro de téléphone</label>
                    <div className="relative group">
                      <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full pl-12 pr-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all placeholder-slate-500 hover:border-slate-400"
                        placeholder="+216 ..."
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Driver Details */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-purple-100 to-pink-200 rounded-lg">
                    <Car className="h-5 w-5 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800">Détails du conducteur</h3>
                  <span className="ml-auto text-xs font-bold bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full">
                    IMPORTANT
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 px-3 py-1 rounded-lg text-xs font-bold border border-purple-200">
                        <Shield className="h-3 w-3" />
                        OBLIGATOIRE
                      </span>
                      Numéro de permis <span className="text-red-500">*</span>
                    </label>
                    <div className="relative group">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-400 to-pink-400 rounded-xl opacity-0 group-hover:opacity-20 blur transition-opacity duration-300"></div>
                      <div className="relative">
                        <FileText className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400 group-hover:text-purple-500 transition-colors" />
                        <input
                          type="text"
                          name="licenseNumber"
                          value={formData.licenseNumber}
                          onChange={handleChange}
                          className="w-full pl-12 pr-4 py-3 bg-white border-2 border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all placeholder-slate-500 hover:border-purple-300"
                          required
                          placeholder="Ex: DL123456789"
                        />
                        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-xs text-purple-600 font-medium">
                          PERMIS
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      Format standard: Lettres + Chiffres
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">Date d'expiration du permis</label>
                    <div className="relative group">
                      <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                      <input
                        type="datetime-local"
                        name="licenseExpiry"
                        value={formData.licenseExpiry}
                        onChange={handleChange}
                        className="w-full pl-12 pr-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">Score écologique</label>
                    <div className="relative group">
                      <Star className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400 group-hover:text-amber-500 transition-colors" />
                      <input
                        type="number"
                        name="ecoScore"
                        value={formData.ecoScore}
                        onChange={handleChange}
                        step="0.1"
                        min="0"
                        max="100"
                        className="w-full pl-12 pr-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all"
                        placeholder="0.0"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">Statut du conducteur</label>
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/5 to-blue-400/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        className="relative w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all appearance-none hover:border-slate-400"
                      >
                        <option value="ACTIVE" className="text-emerald-600 font-medium">
                          🟢 Actif - En service
                        </option>
                        <option value="INACTIVE" className="text-amber-600 font-medium">
                          🟡 Inactif - En attente
                        </option>
                        <option value="ON_LEAVE" className="text-blue-600 font-medium">
                          🔵 En congé - Absent
                        </option>
                        <option value="SUSPENDED" className="text-rose-600 font-medium">
                          🔴 Suspendu - Non autorisé
                        </option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-lg">
                      <Navigation className="h-4 w-4 text-blue-600" />
                    </div>
                    <h4 className="text-sm font-semibold text-slate-700">Informations complémentaires</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-xs text-slate-600">Conducteur assigné automatiquement</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                      <span className="text-xs text-slate-600">GPS activé par défaut</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span className="text-xs text-slate-600">Notifications activées</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-8 border-t border-slate-200">
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    type="button"
                    onClick={() => router.push('/drivers')}
                    className="px-8 py-4 bg-white border-2 border-slate-300 text-slate-700 font-semibold rounded-xl hover:border-slate-400 hover:bg-slate-50 transition-all duration-300 group"
                    disabled={loading}
                  >
                    <span className="flex items-center justify-center gap-2 group-hover:gap-3 transition-all">
                      <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
                      Annuler
                    </span>
                  </button>

                  <button
                    type="submit"
                    disabled={loading || !isAdmin}
                    className="flex-1 px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-cyan-600 hover:shadow-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Création en cours...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2 group-hover:gap-3 group-hover:scale-105 transition-all">
                        <UserPlus className="h-5 w-5" />
                        Créer le conducteur
                        <Sparkles className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </form>

            <div className="px-8 py-6 bg-gradient-to-r from-slate-50 to-blue-50/50 border-t border-slate-200">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-slate-600">Validation en temps réel</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-slate-600">Intégration instantanée</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-sm text-slate-600">
                    <span className="font-semibold text-blue-600">Important : </span>
                    Les champs marqués d&apos;un <span className="text-red-500 font-bold">*</span> sont obligatoires
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Tips */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border border-blue-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-semibold text-slate-800">Conseils rapides</h3>
              </div>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <span className="text-sm text-slate-600">Vérifiez l'exactitude du numéro de permis</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <span className="text-sm text-slate-600">L'email doit être unique et valide</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <span className="text-sm text-slate-600">Choisissez un statut approprié au conducteur</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl border border-emerald-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-r from-emerald-500 to-green-500 rounded-lg">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-semibold text-slate-800">Sécurité des données</h3>
              </div>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2"></div>
                  <span className="text-sm text-slate-600">Cryptage AES-256 des données sensibles</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2"></div>
                  <span className="text-sm text-slate-600">Conformité RGPD garantie</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2"></div>
                  <span className="text-sm text-slate-600">Accès sécurisé par authentification 2FA</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Styles */}
      <style jsx global>{`
        @keyframes gradient-text {
          0%,
          100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        @keyframes float-particle {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 0.1;
          }
          25% {
            transform: translateY(-40px) rotate(90deg);
            opacity: 0.3;
          }
          50% {
            transform: translateY(-20px) rotate(180deg);
            opacity: 0.2;
          }
          75% {
            transform: translateY(-40px) rotate(270deg);
            opacity: 0.3;
          }
          100% {
            transform: translateY(0) rotate(360deg);
            opacity: 0.1;
          }
        }

        .animate-gradient-text {
          background-size: 200% 100%;
          animation: gradient-text 3s ease infinite;
        }
      `}</style>
    </div>
  )
}
