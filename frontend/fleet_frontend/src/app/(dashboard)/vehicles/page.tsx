'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/authContext'
import { vehicleService } from '@/lib/services/vehicleService'
import { Vehicle } from '@/types/vehicle'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

import {
  Plus,
  Car,
  Edit,
  Trash2,
  Users,
  Fuel,
  Calendar,
  Gauge,
  Settings,
  MapPin,
  Battery,
  Filter,
  Search,
  ChevronRight,
  Wrench,
  CheckCircle,
  AlertCircle,
  Clock,
  MoreVertical,
  Sparkles,
  TrendingUp,
  Zap,
  Shield,
  Eye,
  X,
  Download,
  BarChart3,
  CarFront,
  Navigation,
  Activity,
  Award,
  BatteryCharging,
  Smartphone,
  Bluetooth,
  Target,
  FileText
} from 'lucide-react'

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<string>('all')
  const [showDeleteModal, setShowDeleteModal] = useState<number | null>(null)
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)

  // Effet de particules claires
  useEffect(() => {
    if (!containerRef.current) return

    const particles: HTMLDivElement[] = []
    const container = containerRef.current

    for (let i = 0; i < 15; i++) {
      const particle = document.createElement('div')
      const size = Math.random() * 4 + 2
      const colors = ['#60a5fa', '#38bdf8', '#0ea5e9', '#3b82f6']
      const color = colors[Math.floor(Math.random() * colors.length)]

      particle.className = 'particle absolute rounded-full'
      particle.style.cssText = `
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        opacity: ${Math.random() * 0.15 + 0.05};
        top: ${Math.random() * 100}%;
        left: ${Math.random() * 100}%;
        animation: float-particle ${Math.random() * 20 + 15}s linear infinite;
        animation-delay: ${Math.random() * 3}s;
        filter: blur(1px);
      `

      container.appendChild(particle)
      particles.push(particle)
    }

    return () => {
      particles.forEach(p => p.remove())
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    fetchVehicles()
  }, [isAuthenticated, router])

  useEffect(() => {
    let results = vehicles

    if (searchQuery) {
      results = results.filter(vehicle =>
        vehicle.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vehicle.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vehicle.registrationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vehicle.driverName?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (activeFilter !== 'all') {
      results = results.filter(vehicle => vehicle.status === activeFilter)
    }

    setFilteredVehicles(results)
  }, [vehicles, searchQuery, activeFilter])

  const fetchVehicles = async () => {
    try {
      setLoading(true)
      const data = await vehicleService.getAll()
      setVehicles(data)
      setFilteredVehicles(data)
      setError('')
    } catch (err: any) {
      setError(err.message || 'Failed to fetch vehicles')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await vehicleService.remove(id)
      setShowDeleteModal(null)
      fetchVehicles()
    } catch (err) {
      alert('Failed to delete vehicle')
    }
  }

  const handleAssignDriver = async (vehicleId: number) => {
    const driverId = prompt('Enter driver ID:')
    if (driverId && !isNaN(parseInt(driverId))) {
      try {
        await vehicleService.assignDriver(vehicleId, parseInt(driverId))
        fetchVehicles()
        alert('Driver assigned successfully!')
      } catch (err) {
        alert('Failed to assign driver')
      }
    }
  }

  // ✅ EXPORT PDF (seulement)
  const handleExportPDF = () => {
    const data = filteredVehicles.length ? filteredVehicles : vehicles

    if (!data.length) {
      alert('Aucun véhicule à exporter')
      return
    }

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    })

    doc.setFontSize(16)
    doc.text('Liste des véhicules', 14, 15)

    doc.setFontSize(10)
    doc.text(`Exporté le : ${new Date().toLocaleString()}`, 14, 22)

    const tableHead = [[
      'ID',
      'Marque',
      'Modèle',
      'Immatriculation',
      'Année',
      'Statut',
      'Kilométrage',
      'Carburant',
      'Conducteur'
    ]]

    const tableBody = data.map(v => [
      v.id ?? '',
      v.brand ?? '',
      v.model ?? '',
      v.registrationNumber ?? '',
      v.year ?? '',
      v.status?.replace('_', ' ') ?? '',
      v.mileage ? `${v.mileage} km` : '',
      v.fuelType ?? '',
      v.driverName ?? 'Non assigné'
    ])

    autoTable(doc, {
      head: tableHead,
      body: tableBody,
      startY: 28,
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [37, 99, 235] },
      alternateRowStyles: { fillColor: [245, 248, 255] }
    })

    const fileName = `vehicules_${new Date().toISOString().slice(0, 10)}.pdf`
    doc.save(fileName)
  }

  const getVehicleEfficiency = (vehicle: Vehicle) => {
    const currentYear = new Date().getFullYear()
    const vehicleYear = vehicle.year || currentYear
    const age = currentYear - vehicleYear
    let baseScore = 100 - (age * 5)

    if (vehicle.status === 'UNDER_MAINTENANCE') baseScore -= 30
    if (vehicle.status === 'IN_USE') baseScore -= 10

    return Math.max(30, Math.min(100, baseScore))
  }

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 80) return 'from-emerald-400 to-emerald-500'
    if (efficiency >= 60) return 'from-amber-400 to-amber-500'
    return 'from-rose-400 to-rose-500'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'bg-emerald-100 text-emerald-800 border-emerald-200'
      case 'IN_USE': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'UNDER_MAINTENANCE': return 'bg-amber-100 text-amber-800 border-amber-200'
      default: return 'bg-slate-100 text-slate-800 border-slate-200'
    }
  }

  const getFuelIcon = (fuelType?: string) => {
    if (!fuelType) return <Fuel className="h-4 w-4 text-slate-400" />

    switch (fuelType.toLowerCase()) {
      case 'diesel': return <Fuel className="h-4 w-4 text-gray-600" />
      case 'electric': return <BatteryCharging className="h-4 w-4 text-emerald-600" />
      case 'gasoline': return <Fuel className="h-4 w-4 text-orange-600" />
      case 'petrol': return <Fuel className="h-4 w-4 text-orange-600" />
      case 'hybrid': return <Battery className="h-4 w-4 text-green-600" />
      default: return <Fuel className="h-4 w-4 text-slate-400" />
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
                <Car className="h-8 w-8 text-blue-500 animate-bounce" />
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="h-2 w-48 bg-blue-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-400 to-cyan-400 animate-shimmer"></div>
            </div>
            <p className="text-blue-600 font-medium">Chargement de la flotte...</p>
          </div>
        </div>
      </div>
    )
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
      <div className="relative pt-16 pb-12 overflow-hidden">
        {/* Effets de fond */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-100/30 via-transparent to-cyan-100/30"></div>
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-blue-200/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-cyan-200/20 rounded-full blur-3xl"></div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-12">
            <div className="flex-1">
              <h1 className="text-5xl lg:text-6xl font-bold mb-4 leading-tight">
                <span className="bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 bg-clip-text text-transparent animate-gradient-text">
                  Flotte Véhicules
                </span>
                <br />
                <span className="text-3xl text-slate-600 font-normal">Gestion optimisée</span>
              </h1>

              <p className="text-xl text-slate-600 max-w-2xl">
                Supervisez et gérez votre parc automobile avec des outils avancés
              </p>
            </div>

            <div className="flex items-center gap-4">
              {/* ✅ Export PDF */}
              <button
                onClick={handleExportPDF}
                className="hidden lg:flex items-center gap-2 px-5 py-3 bg-white border border-slate-300 rounded-xl hover:border-blue-400 hover:shadow-md transition-all group shadow-sm"
              >
                <FileText className="h-5 w-5 text-slate-600 group-hover:text-blue-500" />
                <span className="font-medium text-slate-700">Exporter PDF</span>
              </button>

              <Link href="/vehicles/new" className="relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-xl blur-md opacity-70 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative bg-gradient-to-r from-blue-500 to-cyan-500 px-6 py-4 rounded-xl flex items-center gap-3 font-bold text-lg text-white shadow-lg hover:shadow-2xl transition-all duration-500 group-hover:scale-105">
                  <div className="relative">
                    <Plus className="h-6 w-6" />
                    <div className="absolute -inset-1 bg-white/30 rounded-full blur-sm"></div>
                  </div>
                  Nouveau Véhicule
                </div>
              </Link>
            </div>
          </div>

          {/* Stats Cards Lumineuses */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="group relative overflow-hidden bg-white rounded-2xl border border-slate-200 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-xl blur opacity-30"></div>
                    <div className="relative bg-gradient-to-r from-blue-500 to-cyan-500 p-3 rounded-xl shadow-md">
                      <Car className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-slate-800">{vehicles.length}</div>
                </div>
                <h3 className="text-slate-700 font-semibold mb-1">Véhicules Totaux</h3>
                <p className="text-slate-500 text-sm">Votre parc automobile</p>
              </div>
            </div>

            <div className="group relative overflow-hidden bg-white rounded-2xl border border-slate-200 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-green-400 rounded-xl blur opacity-30"></div>
                    <div className="relative bg-gradient-to-r from-emerald-500 to-green-500 p-3 rounded-xl shadow-md">
                      <CheckCircle className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-slate-800">{vehicles.filter(v => v.status === 'AVAILABLE').length}</div>
                </div>
                <h3 className="text-slate-700 font-semibold mb-1">Disponibles</h3>
                <p className="text-slate-500 text-sm">Prêts pour service</p>
              </div>
            </div>

            <div className="group relative overflow-hidden bg-white rounded-2xl border border-slate-200 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-400 rounded-xl blur opacity-30"></div>
                    <div className="relative bg-gradient-to-r from-amber-500 to-orange-500 p-3 rounded-xl shadow-md">
                      <Wrench className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-slate-800">{vehicles.filter(v => v.status === 'UNDER_MAINTENANCE').length}</div>
                </div>
                <h3 className="text-slate-700 font-semibold mb-1">En Maintenance</h3>
                <p className="text-slate-500 text-sm">En réparation</p>
              </div>
            </div>

            <div className="group relative overflow-hidden bg-white rounded-2xl border border-slate-200 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-xl blur opacity-30"></div>
                    <div className="relative bg-gradient-to-r from-purple-500 to-pink-500 p-3 rounded-xl shadow-md">
                      <TrendingUp className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-slate-800">
                    {vehicles.length > 0
                      ? Math.round(vehicles.filter(v => v.status === 'AVAILABLE').length / vehicles.length * 100)
                      : 0}%
                  </div>
                </div>
                <h3 className="text-slate-700 font-semibold mb-1">Efficacité</h3>
                <p className="text-slate-500 text-sm">Taux de disponibilité</p>
              </div>
            </div>
          </div>

          {/* Control Bar Moderne */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-6 mb-8">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
              <div className="flex-1 w-full">
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                  <input
                    type="text"
                    placeholder="Rechercher un véhicule par marque, modèle, ou immatriculation..."
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all placeholder-slate-500 hover:border-slate-400"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-slate-100 rounded-xl p-1">
                  {['all', 'AVAILABLE', 'IN_USE', 'UNDER_MAINTENANCE'].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setActiveFilter(filter)}
                      className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        activeFilter === filter
                          ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                      }`}
                    >
                      {filter === 'all' ? 'Tous' : filter.replace('_', ' ')}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 bg-slate-100 rounded-xl p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2.5 rounded-lg ${
                      viewMode === 'grid'
                        ? 'bg-white text-blue-500 shadow-sm'
                        : 'text-slate-500 hover:text-slate-900 hover:bg-white'
                    }`}
                  >
                    <div className="grid grid-cols-2 gap-0.5 w-5 h-5">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-current rounded-sm"></div>
                      ))}
                    </div>
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`p-2.5 rounded-lg ${
                      viewMode === 'table'
                        ? 'bg-white text-blue-500 shadow-sm'
                        : 'text-slate-500 hover:text-slate-900 hover:bg-white'
                    }`}
                  >
                    <div className="space-y-0.5 w-5 h-5">
                      <div className="h-1 bg-current rounded"></div>
                      <div className="h-1 bg-current rounded"></div>
                      <div className="h-1 bg-current rounded"></div>
                    </div>
                  </button>
                </div>

                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="p-3 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                  >
                    <X className="h-5 w-5 text-slate-500" />
                  </button>
                )}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <p className="text-slate-600">
                {filteredVehicles.length} véhicule{filteredVehicles.length !== 1 ? 's' : ''} trouvé{filteredVehicles.length !== 1 ? 's' : ''}
              </p>

              <div className="flex items-center gap-4">
                <span className="text-sm text-slate-500 flex items-center">
                  <span className="inline-block w-2 h-2 bg-emerald-500 rounded-full mr-1.5"></span>
                  Available
                </span>
                <span className="text-sm text-slate-500 flex items-center">
                  <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-1.5"></span>
                  In Use
                </span>
                <span className="text-sm text-slate-500 flex items-center">
                  <span className="inline-block w-2 h-2 bg-amber-500 rounded-full mr-1.5"></span>
                  Maintenance
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 pb-16">
        {error && (
          <div className="mb-8">
            <div className="bg-gradient-to-r from-rose-50 to-rose-100 border border-rose-200 rounded-2xl p-6 flex items-start gap-4 shadow-sm">
              <AlertCircle className="h-6 w-6 text-rose-500 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-rose-800 mb-1">Erreur de chargement</h3>
                <p className="text-rose-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {filteredVehicles.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-lg">
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-full blur-3xl"></div>
              <div className="relative mx-auto w-40 h-40 bg-gradient-to-br from-white to-blue-50 rounded-full flex items-center justify-center border border-slate-200 shadow-lg">
                <Car className="h-20 w-20 text-slate-400" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-3">
              {searchQuery ? 'Aucun résultat trouvé' : 'Aucun véhicule'}
            </h3>
            <p className="text-slate-600 mb-8 max-w-md mx-auto">
              {searchQuery
                ? 'Essayez avec des termes de recherche différents.'
                : 'Commencez par ajouter votre premier véhicule à la flotte.'}
            </p>
            <Link
              href="/vehicles/new"
              className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-8 py-4 rounded-xl font-bold shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-105 group"
            >
              <Plus className="h-6 w-6" />
              Ajouter un véhicule
              <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredVehicles.map((vehicle) => {
              const efficiency = getVehicleEfficiency(vehicle)

              return (
                <div key={vehicle.id} className="group relative overflow-hidden">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400 rounded-2xl opacity-0 group-hover:opacity-30 blur transition-opacity duration-500"></div>

                  <div className="relative bg-white rounded-2xl border border-slate-200 overflow-hidden hover:border-blue-300 hover:shadow-2xl transition-all duration-500">
                    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-6">
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full blur-md opacity-50"></div>
                            <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-xl font-bold text-white shadow-lg">
                              <Car className="h-8 w-8" />
                            </div>
                            <div
                              className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center ${
                                vehicle.status === 'AVAILABLE'
                                  ? 'bg-emerald-500'
                                  : vehicle.status === 'IN_USE'
                                  ? 'bg-blue-500'
                                  : 'bg-amber-500'
                              }`}
                            >
                              {vehicle.status === 'AVAILABLE' ? (
                                <CheckCircle className="h-3 w-3 text-white" />
                              ) : vehicle.status === 'IN_USE' ? (
                                <Clock className="h-3 w-3 text-white" />
                              ) : (
                                <Wrench className="h-3 w-3 text-white" />
                              )}
                            </div>
                          </div>

                          <div>
                            <h3 className="text-lg font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                              {vehicle.brand} {vehicle.model}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(vehicle.status)} border`}>
                                {vehicle.registrationNumber}
                              </span>
                              {vehicle.year && (
                                <span className="text-xs text-slate-500 flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {vehicle.year}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <button className="p-2 hover:bg-white/50 rounded-lg transition-colors">
                          <MoreVertical className="h-5 w-5 text-slate-500" />
                        </button>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600">Efficacité véhicule</span>
                          <span
                            className="text-sm font-bold"
                            style={{
                              color: efficiency >= 80 ? '#10b981' : efficiency >= 60 ? '#f59e0b' : '#ef4444'
                            }}
                          >
                            {efficiency}%
                          </span>
                        </div>
                        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full bg-gradient-to-r ${getEfficiencyColor(efficiency)} rounded-full transition-all duration-1000`}
                            style={{ width: `${efficiency}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-purple-100 rounded-lg">
                            <Gauge className="h-4 w-4 text-purple-600" />
                          </div>
                          <div>
                            <p className="text-sm text-slate-500">Kilométrage</p>
                            <p className="text-slate-800 font-medium">
                              {vehicle.mileage ? `${vehicle.mileage.toLocaleString()} km` : 'N/A'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-orange-100 rounded-lg">{getFuelIcon(vehicle.fuelType)}</div>
                          <div>
                            <p className="text-sm text-slate-500">Carburant</p>
                            <p className="text-slate-800 font-medium">{vehicle.fuelType || 'N/A'}</p>
                          </div>
                        </div>

                        {vehicle.color && (
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-pink-100 rounded-lg">
                              <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: vehicle.color.toLowerCase() }} />
                            </div>
                            <div>
                              <p className="text-sm text-slate-500">Couleur</p>
                              <p className="text-slate-800 font-medium">{vehicle.color}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-200">
                      {vehicle.driverName ? (
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-slate-900">{vehicle.driverName}</p>
                            {vehicle.driverEmail && <p className="text-xs text-slate-500">{vehicle.driverEmail}</p>}
                          </div>
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Assigné
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-slate-500">Aucun conducteur assigné</p>
                          <button
                            onClick={() => handleAssignDriver(vehicle.id)}
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Assigner
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <Shield className="h-4 w-4 text-emerald-500" />
                          <span className="text-xs text-slate-500">Assuré</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Navigation className="h-4 w-4 text-blue-500" />
                          <span className="text-xs text-slate-500">GPS Actif</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => router.push(`/vehicles/edit/${vehicle.id}`)}
                          className="p-2 bg-white border border-slate-300 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-all group/edit shadow-sm"
                          title="Modifier"
                        >
                          <Edit className="h-4 w-4 group-hover/edit:scale-110 transition-transform" />
                        </button>
                        <button
                          onClick={() => setShowDeleteModal(vehicle.id)}
                          className="p-2 bg-white border border-slate-300 hover:border-rose-400 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-all group/delete shadow-sm"
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4 group-hover/delete:scale-110 transition-transform" />
                        </button>
                        <button
                          onClick={() => setSelectedVehicle(vehicle)}
                          className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:shadow-lg transition-all shadow-md"
                          title="Voir détails"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="py-4 px-6 text-left text-sm font-semibold text-slate-700">Véhicule</th>
                    <th className="py-4 px-6 text-left text-sm font-semibold text-slate-700">Immatriculation</th>
                    <th className="py-4 px-6 text-left text-sm font-semibold text-slate-700">Année</th>
                    <th className="py-4 px-6 text-left text-sm font-semibold text-slate-700">Statut</th>
                    <th className="py-4 px-6 text-left text-sm font-semibold text-slate-700">Efficacité</th>
                    <th className="py-4 px-6 text-left text-sm font-semibold text-slate-700">Conducteur</th>
                    <th className="py-4 px-6 text-left text-sm font-semibold text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVehicles.map((vehicle) => {
                    const efficiency = getVehicleEfficiency(vehicle)

                    return (
                      <tr key={vehicle.id} className="border-b border-slate-100 hover:bg-blue-50/50 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-sm font-bold text-white shadow-sm">
                              <Car className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="font-medium text-slate-800">{vehicle.brand} {vehicle.model}</div>
                              <div className="text-xs text-slate-500">{vehicle.fuelType || 'N/A'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-sm font-medium text-slate-800">{vehicle.registrationNumber}</div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-sm text-slate-800">{vehicle.year || 'N/A'}</div>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${getStatusColor(vehicle.status)} border`}>
                            {vehicle.status === 'AVAILABLE' ? <CheckCircle className="h-3 w-3" /> :
                              vehicle.status === 'IN_USE' ? <Clock className="h-3 w-3" /> :
                                <Wrench className="h-3 w-3" />}
                            {vehicle.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div className={`h-full bg-gradient-to-r ${getEfficiencyColor(efficiency)} rounded-full`} style={{ width: `${efficiency}%` }}></div>
                            </div>
                            <span className="text-sm font-medium">{efficiency}%</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-sm text-slate-800">{vehicle.driverName || 'Non assigné'}</div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => router.push(`/vehicles/edit/${vehicle.id}`)}
                              className="p-2 bg-white border border-slate-300 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors shadow-sm"
                              title="Edit"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => setShowDeleteModal(vehicle.id)}
                              className="p-2 bg-white border border-slate-300 hover:border-rose-400 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors shadow-sm"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                            <button
                              onClick={() => setSelectedVehicle(vehicle)}
                              className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:shadow-lg transition-all shadow-md"
                              title="View"
                            >
                              <Eye size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal de suppression */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-8 shadow-2xl">
              <div className="text-center mb-6">
                <div className="inline-flex p-3 rounded-xl bg-rose-100 mb-4">
                  <AlertCircle className="h-8 w-8 text-rose-500" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Supprimer le véhicule</h3>
                <p className="text-slate-600">
                  Cette action est irréversible. Voulez-vous vraiment supprimer ce véhicule de la flotte ?
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(null)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors border border-slate-300"
                >
                  Annuler
                </button>
                <button
                  onClick={() => handleDelete(showDeleteModal)}
                  className="flex-1 py-3 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white rounded-xl font-medium transition-all shadow-md hover:shadow-lg"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de détails */}
        {selectedVehicle && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl border border-slate-200 max-w-2xl w-full shadow-2xl">
              <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-cyan-50">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-slate-800">Détails du véhicule</h3>
                  <button
                    onClick={() => setSelectedVehicle(null)}
                    className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5 text-slate-500" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-slate-500">Marque & Modèle</label>
                      <p className="text-lg font-medium text-slate-800">{selectedVehicle.brand} {selectedVehicle.model}</p>
                    </div>
                    <div>
                      <label className="text-sm text-slate-500">Immatriculation</label>
                      <p className="text-slate-800">{selectedVehicle.registrationNumber}</p>
                    </div>
                    <div>
                      <label className="text-sm text-slate-500">Année</label>
                      <p className="text-slate-800">{selectedVehicle.year || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-slate-500">Kilométrage</label>
                      <p className="text-slate-800">{selectedVehicle.mileage ? `${selectedVehicle.mileage.toLocaleString()} km` : 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-slate-500">Type de carburant</label>
                      <p className="text-slate-800">{selectedVehicle.fuelType || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-slate-500">Statut</label>
                      <div className="mt-1">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold ${getStatusColor(selectedVehicle.status)} border`}>
                          {selectedVehicle.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedVehicle.driverName && (
                  <div className="mt-6 p-4 bg-slate-50 rounded-xl">
                    <h4 className="font-semibold text-slate-700 mb-2">Conducteur assigné</h4>
                    <p className="text-slate-800">{selectedVehicle.driverName}</p>
                    {selectedVehicle.driverEmail && (
                      <p className="text-sm text-slate-600">{selectedVehicle.driverEmail}</p>
                    )}
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
                <button
                  onClick={() => setSelectedVehicle(null)}
                  className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium border border-slate-300 transition-colors"
                >
                  Fermer
                </button>
                <button
                  onClick={() => router.push(`/vehicles/edit/${selectedVehicle.id}`)}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-medium hover:shadow-lg transition-all"
                >
                  Modifier
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-slate-200 py-6">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BarChart3 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">
                  Total: {vehicles.length} véhicules • Disponibles: {vehicles.filter(v => v.status === 'AVAILABLE').length}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Link
                href="/vehicles/analytics"
                className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
              >
                Voir les statistiques détaillées
                <ChevronRight className="h-4 w-4" />
              </Link>
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

        ::-webkit-scrollbar { width: 10px; height: 10px; }
        ::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 5px; }
        ::-webkit-scrollbar-thumb { background: linear-gradient(to bottom, #60a5fa, #38bdf8); border-radius: 5px; }
        ::-webkit-scrollbar-thumb:hover { background: linear-gradient(to bottom, #3b82f6, #0ea5e9); }
      `}</style>
    </div>
  )
}
