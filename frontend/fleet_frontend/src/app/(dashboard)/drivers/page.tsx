'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/authContext'
import { driverService } from '@/lib/services/driverService'
import { Driver } from '@/types/driver'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Download,
  MoreVertical,
  Phone,
  Mail,
  Car,
  AlertCircle,
  CheckCircle,
  Clock,
  ChevronRight,
  Users,
  X,
  Eye,
  Award,
  Activity,
  Zap,
  ShieldCheck,
  CarFront,
  Navigation,
  BarChart3,
  Settings,
  Bell,
} from 'lucide-react'

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [filteredDrivers, setFilteredDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<string>('all')
  const [showDeleteModal, setShowDeleteModal] = useState<number | null>(null)
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [exporting, setExporting] = useState(false)

  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)

  // ✅ Export PDF (table) - exporte la liste affichée (filteredDrivers)
  const handleExportPDF = async () => {
    try {
      setExporting(true)

      const rows = filteredDrivers.length ? filteredDrivers : drivers
      if (!rows.length) {
        alert('Aucun conducteur à exporter.')
        return
      }

      // import dynamique (évite problèmes SSR / build)
      const jsPDF = (await import('jspdf')).default
      const autoTable = (await import('jspdf-autotable')).default

      const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })

      const now = new Date()
      const dateStr = now.toISOString().slice(0, 10)

      // Header
      doc.setFontSize(18)
      doc.text('Liste des Conducteurs', 40, 50)

      doc.setFontSize(10)
      doc.text(`Exporté le: ${dateStr}`, 40, 70)
      doc.text(`Total: ${rows.length}`, 40, 86)

      // Table data
      const head = [['ID', 'Prénom', 'Nom', 'Email', 'Téléphone', 'Permis', 'Statut']]
      const body = rows.map((d) => [
        String(d.id ?? ''),
        d.firstName ?? '',
        d.lastName ?? '',
        d.email ?? '',
        d.phone ?? '',
        d.licenseNumber ?? '',
        d.status ?? '',
      ])

      autoTable(doc, {
        head,
        body,
        startY: 110,
        styles: {
          fontSize: 9,
          cellPadding: 6,
          overflow: 'linebreak',
        },
        headStyles: {
          // (pas de couleur forcée pour rester simple)
          fontStyle: 'bold',
        },
        columnStyles: {
          0: { cellWidth: 45 },  // ID
          1: { cellWidth: 90 },  // Prénom
          2: { cellWidth: 90 },  // Nom
          3: { cellWidth: 220 }, // Email
          4: { cellWidth: 110 }, // Téléphone
          5: { cellWidth: 110 }, // Permis
          6: { cellWidth: 90 },  // Statut
        },
        didDrawPage: (data) => {
          // Footer page
          const pageCount = doc.getNumberOfPages()
          doc.setFontSize(9)
          doc.text(
            `Page ${data.pageNumber} / ${pageCount}`,
            doc.internal.pageSize.getWidth() - 90,
            doc.internal.pageSize.getHeight() - 20
          )
        },
      })

      doc.save(`drivers_${dateStr}.pdf`)
    } catch (e) {
      console.error(e)
      alert("Erreur lors de l'export PDF.")
    } finally {
      setExporting(false)
    }
  }

  // Effet de particules claires
  useEffect(() => {
    if (!containerRef.current) return

    const particles: HTMLDivElement[] = []
    const container = containerRef.current

    for (let i = 0; i < 20; i++) {
      const particle = document.createElement('div')
      const size = Math.random() * 4 + 2
      const colors = ['#60a5fa', '#a78bfa', '#38bdf8', '#34d399']
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

    return () => particles.forEach((p) => p.remove())
  }, [])

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    fetchDrivers()
  }, [isAuthenticated, router])

  useEffect(() => {
    let results = drivers

    if (searchQuery) {
      results = results.filter(
        (driver) =>
          driver.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          driver.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          driver.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          driver.licenseNumber?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (activeFilter !== 'all') {
      results = results.filter((driver) => driver.status === activeFilter)
    }

    setFilteredDrivers(results)
  }, [drivers, searchQuery, activeFilter])

  const fetchDrivers = async () => {
    try {
      setLoading(true)
      const data = await driverService.getAll()
      setDrivers(data)
      setFilteredDrivers(data)
      setError('')
    } catch (err: any) {
      setError(err.message || 'Failed to fetch drivers')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await driverService.delete(id)
      setShowDeleteModal(null)
      fetchDrivers()
    } catch (err) {
      alert('Failed to delete driver')
    }
  }

  const getDriverEfficiency = (driver: Driver) => {
    switch (driver.status) {
      case 'ACTIVE':
        return Math.floor(Math.random() * 30) + 70
      case 'INACTIVE':
        return Math.floor(Math.random() * 40) + 30
      case 'SUSPENDED':
        return Math.floor(Math.random() * 30)
      default:
        return 50
    }
  }

  const getPerformanceColor = (efficiency: number) => {
    if (efficiency >= 80) return 'from-emerald-400 to-emerald-500'
    if (efficiency >= 60) return 'from-amber-400 to-amber-500'
    return 'from-rose-400 to-rose-500'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200'
      case 'INACTIVE':
        return 'bg-amber-100 text-amber-800 border-amber-200'
      case 'SUSPENDED':
        return 'bg-rose-100 text-rose-800 border-rose-200'
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200'
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
                <CarFront className="h-8 w-8 text-blue-500 animate-bounce" />
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="h-2 w-48 bg-blue-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-400 to-cyan-400 animate-shimmer"></div>
            </div>
            <p className="text-blue-600 font-medium">Chargement des conducteurs...</p>
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
          <Bell className="h-5 w-5 text-blue-500" />
        </button>
        <button className="bg-white p-3 rounded-xl shadow-lg border border-slate-200 hover:shadow-xl hover:-translate-y-0.5 transition-all">
          <Settings className="h-5 w-5 text-slate-600" />
        </button>
      </div>

      {/* Header */}
      <div className="relative pt-16 pb-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-100/30 via-transparent to-cyan-100/30"></div>
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-blue-200/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-cyan-200/20 rounded-full blur-3xl"></div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-12">
            <div className="flex-1">
              <h1 className="text-5xl lg:text-6xl font-bold mb-4 leading-tight">
                <span className="bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 bg-clip-text text-transparent animate-gradient-text">
                  Conducteurs
                </span>
              </h1>

              <p className="text-xl text-slate-600 max-w-2xl">
                Supervisez et optimisez les performances de votre équipe de conducteurs professionnels
              </p>
            </div>

            <div className="flex items-center gap-4">
              {/* ✅ Export PDF */}
              <button
                onClick={handleExportPDF}
                disabled={exporting}
                className={`hidden lg:flex items-center gap-2 px-5 py-3 bg-white border border-slate-300 rounded-xl hover:border-blue-400 hover:shadow-md transition-all group shadow-sm ${
                  exporting ? 'opacity-60 cursor-not-allowed' : ''
                }`}
              >
                <Download className="h-5 w-5 text-slate-600 group-hover:text-blue-500" />
                <span className="font-medium text-slate-700">{exporting ? 'Export...' : 'Exporter PDF'}</span>
              </button>

              <Link href="/drivers/new" className="relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-xl blur-md opacity-70 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative bg-gradient-to-r from-blue-500 to-cyan-500 px-6 py-4 rounded-xl flex items-center gap-3 font-bold text-lg text-white shadow-lg hover:shadow-2xl transition-all duration-500 group-hover:scale-105">
                  <div className="relative">
                    <Plus className="h-6 w-6" />
                    <div className="absolute -inset-1 bg-white/30 rounded-full blur-sm"></div>
                  </div>
                  Nouveau Conducteur
                </div>
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="group relative overflow-hidden bg-white rounded-2xl border border-slate-200 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
              <div className="relative p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="relative bg-gradient-to-r from-blue-500 to-cyan-500 p-3 rounded-xl shadow-md">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-slate-800">{drivers.length}</div>
                </div>
                <h3 className="text-slate-700 font-semibold mb-1">Conducteurs Totaux</h3>
                <p className="text-slate-500 text-sm">Votre équipe complète</p>
              </div>
            </div>

            <div className="group relative overflow-hidden bg-white rounded-2xl border border-slate-200 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
              <div className="relative p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="relative bg-gradient-to-r from-emerald-500 to-green-500 p-3 rounded-xl shadow-md">
                    <Activity className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-slate-800">{drivers.filter((d) => d.status === 'ACTIVE').length}</div>
                </div>
                <h3 className="text-slate-700 font-semibold mb-1">En Service</h3>
                <p className="text-slate-500 text-sm">Disponibles actuellement</p>
              </div>
            </div>

            <div className="group relative overflow-hidden bg-white rounded-2xl border border-slate-200 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
              <div className="relative p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="relative bg-gradient-to-r from-amber-500 to-orange-500 p-3 rounded-xl shadow-md">
                    <Zap className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-slate-800">
                    {drivers.length > 0 ? Math.floor((drivers.filter((d) => d.status === 'ACTIVE').length / drivers.length) * 100) : 0}%
                  </div>
                </div>
                <h3 className="text-slate-700 font-semibold mb-1">Efficacité</h3>
                <p className="text-slate-500 text-sm">Taux d'activité</p>
              </div>
            </div>

            <div className="group relative overflow-hidden bg-white rounded-2xl border border-slate-200 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
              <div className="relative p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="relative bg-gradient-to-r from-purple-500 to-pink-500 p-3 rounded-xl shadow-md">
                    <Award className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-slate-800">
                    {drivers.filter((d) => {
                      const eff = getDriverEfficiency(d)
                      return eff >= 80
                    }).length}
                  </div>
                </div>
                <h3 className="text-slate-700 font-semibold mb-1">Élite</h3>
                <p className="text-slate-500 text-sm">Meilleurs performants</p>
              </div>
            </div>
          </div>

          {/* Control Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-6 mb-8">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
              <div className="flex-1 w-full">
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                  <input
                    type="text"
                    placeholder="Rechercher un conducteur par nom, email, ou permis..."
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all placeholder-slate-500 hover:border-slate-400"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-slate-100 rounded-xl p-1">
                  {['all', 'ACTIVE', 'INACTIVE', 'SUSPENDED'].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setActiveFilter(filter)}
                      className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        activeFilter === filter
                          ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                      }`}
                    >
                      {filter === 'all' ? 'Tous' : filter}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 bg-slate-100 rounded-xl p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2.5 rounded-lg ${viewMode === 'grid' ? 'bg-white text-blue-500 shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-white'}`}
                  >
                    <div className="grid grid-cols-2 gap-0.5 w-5 h-5">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-current rounded-sm"></div>
                      ))}
                    </div>
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`p-2.5 rounded-lg ${viewMode === 'table' ? 'bg-white text-blue-500 shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-white'}`}
                  >
                    <div className="space-y-0.5 w-5 h-5">
                      <div className="h-1 bg-current rounded"></div>
                      <div className="h-1 bg-current rounded"></div>
                      <div className="h-1 bg-current rounded"></div>
                    </div>
                  </button>
                </div>

                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="p-3 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
                    <X className="h-5 w-5 text-slate-500" />
                  </button>
                )}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <p className="text-slate-600">
                {filteredDrivers.length} conducteur{filteredDrivers.length !== 1 ? 's' : ''} trouvé{filteredDrivers.length !== 1 ? 's' : ''}
              </p>

              <div className="flex items-center gap-4">
                <span className="text-sm text-slate-500 flex items-center">
                  <span className="inline-block w-2 h-2 bg-emerald-500 rounded-full mr-1.5"></span>
                  Active
                </span>
                <span className="text-sm text-slate-500 flex items-center">
                  <span className="inline-block w-2 h-2 bg-amber-500 rounded-full mr-1.5"></span>
                  Inactive
                </span>
                <span className="text-sm text-slate-500 flex items-center">
                  <span className="inline-block w-2 h-2 bg-rose-500 rounded-full mr-1.5"></span>
                  Suspended
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

        {filteredDrivers.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-lg">
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-full blur-3xl"></div>
              <div className="relative mx-auto w-40 h-40 bg-gradient-to-br from-white to-blue-50 rounded-full flex items-center justify-center border border-slate-200 shadow-lg">
                <Users className="h-20 w-20 text-slate-400" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-3">{searchQuery ? 'Aucun résultat trouvé' : 'Aucun conducteur'}</h3>
            <p className="text-slate-600 mb-8 max-w-md mx-auto">
              {searchQuery ? 'Essayez avec des termes de recherche différents.' : 'Commencez par ajouter votre premier conducteur à la flotte.'}
            </p>
            <Link
              href="/drivers/new"
              className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-8 py-4 rounded-xl font-bold shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-105 group"
            >
              <Plus className="h-6 w-6" />
              Ajouter un conducteur
              <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredDrivers.map((driver) => {
              const efficiency = getDriverEfficiency(driver)
              return (
                <div key={driver.id} className="group relative overflow-hidden">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400 rounded-2xl opacity-0 group-hover:opacity-30 blur transition-opacity duration-500"></div>

                  <div className="relative bg-white rounded-2xl border border-slate-200 overflow-hidden hover:border-blue-300 hover:shadow-2xl transition-all duration-500">
                    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-6">
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full blur-md opacity-50"></div>
                            <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-xl font-bold text-white shadow-lg">
                              {driver.firstName[0]}
                              {driver.lastName[0]}
                            </div>
                            <div
                              className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center ${
                                driver.status === 'ACTIVE' ? 'bg-emerald-500' : driver.status === 'INACTIVE' ? 'bg-amber-500' : 'bg-rose-500'
                              }`}
                            >
                              {driver.status === 'ACTIVE' ? (
                                <CheckCircle className="h-3 w-3 text-white" />
                              ) : driver.status === 'INACTIVE' ? (
                                <Clock className="h-3 w-3 text-white" />
                              ) : (
                                <AlertCircle className="h-3 w-3 text-white" />
                              )}
                            </div>
                          </div>

                          <div>
                            <h3 className="text-lg font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                              {driver.firstName} {driver.lastName}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(driver.status)} border`}>
                                {driver.status === 'ACTIVE' ? '🚀 ACTIF' : driver.status === 'INACTIVE' ? '⏸️ INACTIF' : '⚠️ SUSPENDU'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <button className="p-2 hover:bg-white/50 rounded-lg transition-colors">
                          <MoreVertical className="h-5 w-5 text-slate-500" />
                        </button>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600">Performance</span>
                          <span
                            className="text-sm font-bold"
                            style={{ color: efficiency >= 80 ? '#10b981' : efficiency >= 60 ? '#f59e0b' : '#ef4444' }}
                          >
                            {efficiency}%
                          </span>
                        </div>
                        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div className={`h-full bg-gradient-to-r ${getPerformanceColor(efficiency)} rounded-full transition-all duration-1000`} style={{ width: `${efficiency}%` }} />
                        </div>
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Mail className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm text-slate-500">Email</p>
                            <p className="text-slate-800 font-medium">{driver.email}</p>
                          </div>
                        </div>

                        {driver.phone && (
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-100 rounded-lg">
                              <Phone className="h-4 w-4 text-emerald-600" />
                            </div>
                            <div>
                              <p className="text-sm text-slate-500">Téléphone</p>
                              <p className="text-slate-800 font-medium">{driver.phone}</p>
                            </div>
                          </div>
                        )}

                        {driver.licenseNumber && (
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                              <Car className="h-4 w-4 text-purple-600" />
                            </div>
                            <div>
                              <p className="text-sm text-slate-500">Permis</p>
                              <p className="text-slate-800 font-medium">{driver.licenseNumber}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <ShieldCheck className="h-4 w-4 text-emerald-500" />
                          <span className="text-xs text-slate-500">Sécurité</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Navigation className="h-4 w-4 text-blue-500" />
                          <span className="text-xs text-slate-500">GPS Actif</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => router.push(`/drivers/edit/${driver.id}`)}
                          className="p-2 bg-white border border-slate-300 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-all group/edit shadow-sm"
                          title="Modifier"
                        >
                          <Edit className="h-4 w-4 group-hover/edit:scale-110 transition-transform" />
                        </button>
                        <button
                          onClick={() => setShowDeleteModal(driver.id)}
                          className="p-2 bg-white border border-slate-300 hover:border-rose-400 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-all group/delete shadow-sm"
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4 group-hover/delete:scale-110 transition-transform" />
                        </button>
                        <button
                          onClick={() => setSelectedDriver(driver)}
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
                    <th className="py-4 px-6 text-left text-sm font-semibold text-slate-700">Conducteur</th>
                    <th className="py-4 px-6 text-left text-sm font-semibold text-slate-700">Contact</th>
                    <th className="py-4 px-6 text-left text-sm font-semibold text-slate-700">Permis</th>
                    <th className="py-4 px-6 text-left text-sm font-semibold text-slate-700">Statut</th>
                    <th className="py-4 px-6 text-left text-sm font-semibold text-slate-700">Performance</th>
                    <th className="py-4 px-6 text-left text-sm font-semibold text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDrivers.map((driver) => {
                    const efficiency = getDriverEfficiency(driver)
                    return (
                      <tr key={driver.id} className="border-b border-slate-100 hover:bg-blue-50/50 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-sm font-bold text-white shadow-sm">
                              {driver.firstName[0]}
                              {driver.lastName[0]}
                            </div>
                            <div>
                              <div className="font-medium text-slate-800">
                                {driver.firstName} {driver.lastName}
                              </div>
                              <div className="text-xs text-slate-500">ID: {driver.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="space-y-1">
                            <div className="text-sm text-slate-800">{driver.email}</div>
                            {driver.phone && <div className="text-sm text-slate-600">{driver.phone}</div>}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-sm font-medium text-slate-800">{driver.licenseNumber || 'N/A'}</div>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${getStatusColor(driver.status)} border`}>
                            {driver.status === 'ACTIVE' ? <CheckCircle className="h-3 w-3" /> : driver.status === 'INACTIVE' ? <Clock className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                            {driver.status}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div className={`h-full bg-gradient-to-r ${getPerformanceColor(efficiency)} rounded-full`} style={{ width: `${efficiency}%` }} />
                            </div>
                            <span className="text-sm font-medium">{efficiency}%</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => router.push(`/drivers/edit/${driver.id}`)}
                              className="p-2 bg-white border border-slate-300 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors shadow-sm"
                              title="Edit"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => setShowDeleteModal(driver.id)}
                              className="p-2 bg-white border border-slate-300 hover:border-rose-400 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors shadow-sm"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                            <button
                              onClick={() => setSelectedDriver(driver)}
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
                <h3 className="text-xl font-bold text-slate-800 mb-2">Supprimer le conducteur</h3>
                <p className="text-slate-600">Cette action est irréversible. Voulez-vous vraiment supprimer ce conducteur ?</p>
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
        {selectedDriver && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl border border-slate-200 max-w-2xl w-full shadow-2xl">
              <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-cyan-50">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-slate-800">Détails du conducteur</h3>
                  <button onClick={() => setSelectedDriver(null)} className="p-2 hover:bg-white/50 rounded-lg transition-colors">
                    <X className="h-5 w-5 text-slate-500" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-slate-500">Nom complet</label>
                      <p className="text-lg font-medium text-slate-800">
                        {selectedDriver.firstName} {selectedDriver.lastName}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-slate-500">Email</label>
                      <p className="text-slate-800">{selectedDriver.email}</p>
                    </div>
                    {selectedDriver.phone && (
                      <div>
                        <label className="text-sm text-slate-500">Téléphone</label>
                        <p className="text-slate-800">{selectedDriver.phone}</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-slate-500">Numéro de permis</label>
                      <p className="text-slate-800">{selectedDriver.licenseNumber || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-slate-500">Statut</label>
                      <div className="mt-1">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold ${getStatusColor(selectedDriver.status)} border`}>
                          {selectedDriver.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
                <button
                  onClick={() => setSelectedDriver(null)}
                  className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium border border-slate-300 transition-colors"
                >
                  Fermer
                </button>
                <button
                  onClick={() => router.push(`/drivers/edit/${selectedDriver.id}`)}
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
                  Total: {drivers.length} conducteurs • Actifs: {drivers.filter((d) => d.status === 'ACTIVE').length}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Link href="/drivers/analytics" className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
                Voir les statistiques détaillées
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Styles d'animation */}
      <style jsx global>{`
        @keyframes gradient {
          0%,
          100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

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

        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }

        @keyframes bounce {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-5px);
          }
        }

        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
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

        ::-webkit-scrollbar {
          width: 10px;
          height: 10px;
        }

        ::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 5px;
        }

        ::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #60a5fa, #38bdf8);
          border-radius: 5px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #3b82f6, #0ea5e9);
        }

        * {
          transition: background-color 0.3s ease, border-color 0.3s ease, transform 0.3s ease, opacity 0.3s ease,
            box-shadow 0.3s ease;
        }
      `}</style>
    </div>
  )
}
