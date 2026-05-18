"use client";

import Link from "next/link";
import type { ReactNode, RefObject } from "react";
import type { Vehicle } from "@/types/vehicle";
import {
  Plus,
  Car,
  Edit,
  Trash2,
  Fuel,
  Calendar,
  Gauge,
  Search,
  ChevronRight,
  Wrench,
  CheckCircle,
  AlertCircle,
  Clock,
  MoreVertical,
  TrendingUp,
  Shield,
  Eye,
  X,
  BarChart3,
  Battery,
  BatteryCharging,
  Navigation,
  FileText,
} from "lucide-react";

interface VehiclesViewProps {
  vehicles: Vehicle[];
  filteredVehicles: Vehicle[];
  loading: boolean;
  error: string;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  activeFilter: string;
  setActiveFilter: (value: string) => void;
  showDeleteModal: number | null;
  setShowDeleteModal: (value: number | null) => void;
  selectedVehicle: Vehicle | null;
  setSelectedVehicle: (vehicle: Vehicle | null) => void;
  viewMode: "grid" | "table";
  setViewMode: (value: "grid" | "table") => void;
  containerRef: RefObject<HTMLDivElement>;

  onDelete: (id: number) => void;
  onExportPDF: () => void;
  onRefresh: () => void;
  onEdit: (id: number) => void;
  onCreate: () => void;
  onAnalytics: () => void;
  getVehicleEfficiency: (vehicle: Vehicle) => number;
  getEfficiencyColor: (efficiency: number) => string;
  getStatusColor: (status: string) => string;
}

export default function VehiclesView({
  vehicles,
  filteredVehicles,
  loading,
  error,
  searchQuery,
  setSearchQuery,
  activeFilter,
  setActiveFilter,
  showDeleteModal,
  setShowDeleteModal,
  selectedVehicle,
  setSelectedVehicle,
  viewMode,
  setViewMode,
  containerRef,
  onDelete,
  onExportPDF,
  onEdit,
  onCreate,
  onAnalytics,
  getVehicleEfficiency,
  getEfficiencyColor,
  getStatusColor,
}: VehiclesViewProps) {
  const getFuelIcon = (fuelType?: string | null) => {
    if (!fuelType) return <Fuel className="h-4 w-4 text-slate-400" />;

    switch (fuelType.toLowerCase()) {
      case "diesel":
        return <Fuel className="h-4 w-4 text-gray-600" />;
      case "electric":
        return <BatteryCharging className="h-4 w-4 text-emerald-600" />;
      case "gasoline":
      case "petrol":
        return <Fuel className="h-4 w-4 text-orange-600" />;
      case "hybrid":
        return <Battery className="h-4 w-4 text-green-600" />;
      default:
        return <Fuel className="h-4 w-4 text-slate-400" />;
    }
  };

  const availableCount = vehicles.filter((v) => v.status === "AVAILABLE").length;
  const maintenanceCount = vehicles.filter((v) => v.status === "UNDER_MAINTENANCE").length;
  const availabilityRate =
    vehicles.length > 0 ? `${Math.round((availableCount / vehicles.length) * 100)}%` : "0%";

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50">
        <div className="text-center">
          <div className="relative mb-6 inline-block">
            <div className="absolute inset-0 animate-pulse rounded-full bg-gradient-to-r from-blue-400 to-cyan-400 opacity-30 blur-xl" />
            <div className="relative h-20 w-20 rounded-full border-4 border-white bg-gradient-to-r from-blue-400 to-cyan-400 p-0.5 shadow-xl">
              <div className="flex h-full w-full items-center justify-center rounded-full bg-white">
                <Car className="h-8 w-8 animate-bounce text-blue-500" />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="h-2 w-48 overflow-hidden rounded-full bg-blue-100">
              <div className="h-full animate-shimmer bg-gradient-to-r from-blue-400 to-cyan-400" />
            </div>
            <p className="font-medium text-blue-600">Chargement de la flotte...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 text-slate-800"
    >
      <div className="relative overflow-hidden pb-12 pt-16">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-100/30 via-transparent to-cyan-100/30" />
        <div className="absolute right-1/4 top-1/4 h-64 w-64 rounded-full bg-blue-200/20 blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 h-64 w-64 rounded-full bg-cyan-200/20 blur-3xl" />

        <div className="container relative z-10 mx-auto px-6">
          <div className="mb-12 flex flex-col justify-between gap-8 lg:flex-row lg:items-center">
            <div className="flex-1">
              <h1 className="mb-4 text-5xl font-bold leading-tight lg:text-6xl">
                <span className="animate-gradient-text bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 bg-clip-text text-transparent">
                  Flotte Véhicules
                </span>
                <br />
                <span className="text-3xl font-normal text-slate-600">Gestion optimisée</span>
              </h1>

              <p className="max-w-2xl text-xl text-slate-600">
                Supervisez et gérez votre parc automobile avec des outils avancés
              </p>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={onExportPDF}
                className="group hidden items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 shadow-sm transition-all hover:border-blue-400 hover:shadow-md lg:flex"
              >
                <FileText className="h-5 w-5 text-slate-600 group-hover:text-blue-500" />
                <span className="font-medium text-slate-700">Exporter PDF</span>
              </button>

              <button onClick={onCreate} className="group relative overflow-hidden">
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 opacity-70 blur-md transition-opacity group-hover:opacity-100" />
                <div className="relative flex items-center gap-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 px-6 py-4 text-lg font-bold text-white shadow-lg transition-all duration-500 group-hover:scale-105 group-hover:shadow-2xl">
                  <Plus className="h-6 w-6" />
                  Nouveau Véhicule
                </div>
              </button>
            </div>
          </div>

          <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={<Car className="h-6 w-6 text-white" />}
              wrapper="from-blue-500 to-cyan-500"
              glow="from-blue-50"
              value={vehicles.length}
              title="Véhicules Totaux"
              subtitle="Votre parc automobile"
            />
            <StatCard
              icon={<CheckCircle className="h-6 w-6 text-white" />}
              wrapper="from-emerald-500 to-green-500"
              glow="from-emerald-50"
              value={availableCount}
              title="Disponibles"
              subtitle="Prêts pour service"
            />
            <StatCard
              icon={<Wrench className="h-6 w-6 text-white" />}
              wrapper="from-amber-500 to-orange-500"
              glow="from-amber-50"
              value={maintenanceCount}
              title="En Maintenance"
              subtitle="En réparation"
            />
            <StatCard
              icon={<TrendingUp className="h-6 w-6 text-white" />}
              wrapper="from-purple-500 to-pink-500"
              glow="from-purple-50"
              value={availabilityRate}
              title="Efficacité"
              subtitle="Taux de disponibilité"
            />
          </div>

          <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
            <div className="flex flex-col items-center justify-between gap-6 lg:flex-row">
              <div className="w-full flex-1">
                <div className="group relative">
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 transition-colors group-hover:text-blue-500" />
                  <input
                    type="text"
                    placeholder="Rechercher un véhicule par marque, modèle, ou immatriculation..."
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 py-4 pl-12 pr-4 placeholder-slate-500 transition-all hover:border-slate-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-400"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 rounded-xl bg-slate-100 p-1">
                  {["all", "AVAILABLE", "IN_USE", "UNDER_MAINTENANCE"].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setActiveFilter(filter)}
                      className={`rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                        activeFilter === filter
                          ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md"
                          : "text-slate-600 hover:bg-white hover:text-slate-900"
                      }`}
                    >
                      {filter === "all" ? "Tous" : filter.replace("_", " ")}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 rounded-xl bg-slate-100 p-1">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`rounded-lg p-2.5 ${
                      viewMode === "grid"
                        ? "bg-white text-blue-500 shadow-sm"
                        : "text-slate-500 hover:bg-white hover:text-slate-900"
                    }`}
                    title="Vue grille"
                  >
                    <div className="grid h-5 w-5 grid-cols-2 gap-0.5">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="rounded-sm bg-current" />
                      ))}
                    </div>
                  </button>

                  <button
                    onClick={() => setViewMode("table")}
                    className={`rounded-lg p-2.5 ${
                      viewMode === "table"
                        ? "bg-white text-blue-500 shadow-sm"
                        : "text-slate-500 hover:bg-white hover:text-slate-900"
                    }`}
                    title="Vue tableau"
                  >
                    <div className="h-5 w-5 space-y-0.5">
                      <div className="h-1 rounded bg-current" />
                      <div className="h-1 rounded bg-current" />
                      <div className="h-1 rounded bg-current" />
                    </div>
                  </button>
                </div>

                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="rounded-xl bg-slate-100 p-3 transition-colors hover:bg-slate-200"
                    title="Effacer la recherche"
                  >
                    <X className="h-5 w-5 text-slate-500" />
                  </button>
                )}
              </div>
            </div>

            <div className="mt-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <p className="text-slate-600">
                {filteredVehicles.length} véhicule{filteredVehicles.length !== 1 ? "s" : ""} trouvé
                {filteredVehicles.length !== 1 ? "s" : ""}
              </p>

              <div className="flex flex-wrap items-center gap-4">
                <Legend color="bg-emerald-500" text="Available" />
                <Legend color="bg-blue-500" text="In Use" />
                <Legend color="bg-amber-500" text="Maintenance" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 pb-16">
        {error && (
          <div className="mb-8">
            <div className="flex items-start gap-4 rounded-2xl border border-rose-200 bg-gradient-to-r from-rose-50 to-rose-100 p-6 shadow-sm">
              <AlertCircle className="h-6 w-6 flex-shrink-0 text-rose-500" />
              <div>
                <h3 className="mb-1 font-semibold text-rose-800">Action impossible</h3>
                <p className="text-rose-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {filteredVehicles.length === 0 ? (
          <EmptyState searchQuery={searchQuery} onCreate={onCreate} />
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredVehicles.map((vehicle) => {
              const efficiency = getVehicleEfficiency(vehicle);

              return (
                <VehicleCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  efficiency={efficiency}
                  getFuelIcon={getFuelIcon}
                  getEfficiencyColor={getEfficiencyColor}
                  getStatusColor={getStatusColor}
                  onEdit={onEdit}
                  setShowDeleteModal={setShowDeleteModal}
                  setSelectedVehicle={setSelectedVehicle}
                />
              );
            })}
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[950px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Véhicule</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Immatriculation</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Année</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Carburant</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Statut</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Efficacité</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Conducteur</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredVehicles.map((vehicle) => {
                    const efficiency = getVehicleEfficiency(vehicle);

                    return (
                      <tr key={vehicle.id} className="transition-colors hover:bg-blue-50/40">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-md">
                              <Car className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">
                                {vehicle.brand} {vehicle.model}
                              </p>
                              <p className="text-sm text-slate-500">
                                {vehicle.mileage ? `${vehicle.mileage.toLocaleString()} km` : "Kilométrage N/A"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getStatusColor(
                              vehicle.status
                            )}`}
                          >
                            {vehicle.registrationNumber}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-sm text-slate-700">{vehicle.year || "N/A"}</td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-sm text-slate-700">
                            <span className="rounded-lg bg-orange-100 p-2">{getFuelIcon(vehicle.fuelType)}</span>
                            {vehicle.fuelType || "N/A"}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold ${getStatusColor(
                              vehicle.status
                            )}`}
                          >
                            {vehicle.status === "AVAILABLE" ? (
                              <CheckCircle className="h-3.5 w-3.5" />
                            ) : vehicle.status === "IN_USE" ? (
                              <Clock className="h-3.5 w-3.5" />
                            ) : (
                              <Wrench className="h-3.5 w-3.5" />
                            )}
                            {vehicle.status.replace("_", " ")}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <div className="w-32">
                            <div className="mb-1 flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-700">{efficiency}%</span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                              <div
                                className={`h-full rounded-full bg-gradient-to-r ${getEfficiencyColor(efficiency)}`}
                                style={{ width: `${efficiency}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-sm text-slate-700">
                          {vehicle.driverName || "Non assigné"}
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => onEdit(vehicle.id)}
                              className="rounded-lg border border-slate-300 bg-white p-2 shadow-sm transition-all hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600"
                              title="Modifier"
                            >
                              <Edit className="h-4 w-4" />
                            </button>

                            <button
                              onClick={() => setShowDeleteModal(vehicle.id)}
                              className="rounded-lg border border-slate-300 bg-white p-2 shadow-sm transition-all hover:border-rose-400 hover:bg-rose-50 hover:text-rose-600"
                              title="Supprimer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>

                            <button
                              onClick={() => setSelectedVehicle(vehicle)}
                              className="rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 p-2 text-white shadow-md transition-all hover:shadow-lg"
                              title="Voir détails"
                            >
                              <Eye className="h-4 w-4" />
                            </button>

                            <Link
                              href={`/vehicles/${vehicle.id}/obd`}
                              className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 transition-all hover:bg-emerald-100"
                              title="Voir OBD"
                            >
                              <Gauge className="h-4 w-4" />
                              OBD
                            </Link>

                            <Link
                              href={`/vehicles/${vehicle.id}/obd/history`}
                              className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white transition-all hover:bg-slate-800"
                              title="Voir historique OBD"
                            >
                              <BarChart3 className="h-4 w-4" />
                              Historique
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selectedVehicle && (
          <VehicleDetailsModal
            vehicle={selectedVehicle}
            getStatusColor={getStatusColor}
            onClose={() => setSelectedVehicle(null)}
            onEdit={onEdit}
          />
        )}

        {showDeleteModal !== null && (
          <DeleteConfirmModal
            onClose={() => setShowDeleteModal(null)}
            onConfirm={() => onDelete(showDeleteModal)}
          />
        )}
      </div>

      <div className="border-t border-slate-200 bg-white py-6">
        <div className="container mx-auto px-6">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
              </div>
              <p className="text-sm text-slate-600">
                Total: {vehicles.length} véhicules • Disponibles: {availableCount}
              </p>
            </div>

            <button
              onClick={onAnalytics}
              className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              Voir les statistiques détaillées
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

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
      `}</style>
    </div>
  );
}

function VehicleCard({
  vehicle,
  efficiency,
  getFuelIcon,
  getEfficiencyColor,
  getStatusColor,
  onEdit,
  setShowDeleteModal,
  setSelectedVehicle,
}: {
  vehicle: Vehicle;
  efficiency: number;
  getFuelIcon: (fuelType?: string | null) => ReactNode;
  getEfficiencyColor: (efficiency: number) => string;
  getStatusColor: (status: string) => string;
  onEdit: (id: number) => void;
  setShowDeleteModal: (value: number | null) => void;
  setSelectedVehicle: (vehicle: Vehicle | null) => void;
}) {
  return (
    <div className="group relative overflow-hidden">
      <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400 opacity-0 blur transition-opacity duration-500 group-hover:opacity-30" />

      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all duration-500 hover:border-blue-300 hover:shadow-2xl">
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-6">
          <div className="mb-6 flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400 opacity-50 blur-md" />
                <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 text-xl font-bold text-white shadow-lg">
                  <Car className="h-8 w-8" />
                </div>

                <div
                  className={`absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white ${
                    vehicle.status === "AVAILABLE"
                      ? "bg-emerald-500"
                      : vehicle.status === "IN_USE"
                      ? "bg-blue-500"
                      : "bg-amber-500"
                  }`}
                >
                  {vehicle.status === "AVAILABLE" ? (
                    <CheckCircle className="h-3 w-3 text-white" />
                  ) : vehicle.status === "IN_USE" ? (
                    <Clock className="h-3 w-3 text-white" />
                  ) : (
                    <Wrench className="h-3 w-3 text-white" />
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-800 transition-colors group-hover:text-blue-600">
                  {vehicle.brand} {vehicle.model}
                </h3>

                <div className="mt-1 flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-bold ${getStatusColor(
                      vehicle.status
                    )}`}
                  >
                    {vehicle.registrationNumber}
                  </span>

                  {vehicle.year && (
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <Calendar className="h-3 w-3" />
                      {vehicle.year}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button className="rounded-lg p-2 transition-colors hover:bg-white/50">
              <MoreVertical className="h-5 w-5 text-slate-500" />
            </button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Efficacité véhicule</span>
              <span
                className="text-sm font-bold"
                style={{
                  color: efficiency >= 80 ? "#10b981" : efficiency >= 60 ? "#f59e0b" : "#ef4444",
                }}
              >
                {efficiency}%
              </span>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-slate-200">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${getEfficiencyColor(
                  efficiency
                )} transition-all duration-1000`}
                style={{ width: `${efficiency}%` }}
              />
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            <InfoLine
              icon={
                <div className="rounded-lg bg-purple-100 p-2">
                  <Gauge className="h-4 w-4 text-purple-600" />
                </div>
              }
              label="Kilométrage"
              value={vehicle.mileage ? `${vehicle.mileage.toLocaleString()} km` : "N/A"}
            />

            <InfoLine
              icon={<div className="rounded-lg bg-orange-100 p-2">{getFuelIcon(vehicle.fuelType)}</div>}
              label="Carburant"
              value={vehicle.fuelType || "N/A"}
            />

            {vehicle.color && (
              <InfoLine
                icon={
                  <div className="rounded-lg bg-pink-100 p-2">
                    <div
                      className="h-4 w-4 rounded-full border"
                      style={{ backgroundColor: vehicle.color.toLowerCase() }}
                    />
                  </div>
                }
                label="Couleur"
                value={vehicle.color}
              />
            )}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
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

          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              onClick={() => onEdit(vehicle.id)}
              className="rounded-lg border border-slate-300 bg-white p-2 shadow-sm transition-all hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600"
              title="Modifier"
            >
              <Edit className="h-4 w-4" />
            </button>

            <button
              onClick={() => setShowDeleteModal(vehicle.id)}
              className="rounded-lg border border-slate-300 bg-white p-2 shadow-sm transition-all hover:border-rose-400 hover:bg-rose-50 hover:text-rose-600"
              title="Supprimer"
            >
              <Trash2 className="h-4 w-4" />
            </button>

            <button
              onClick={() => setSelectedVehicle(vehicle)}
              className="rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 p-2 text-white shadow-md transition-all hover:shadow-lg"
              title="Voir détails"
            >
              <Eye className="h-4 w-4" />
            </button>

            <Link
              href={`/vehicles/${vehicle.id}/obd`}
              className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 transition-all hover:bg-emerald-100 hover:shadow-sm"
              title="Voir OBD"
            >
              <Gauge className="h-4 w-4" />
              <span className="hidden sm:inline">OBD</span>
            </Link>

            <Link
              href={`/vehicles/${vehicle.id}/obd/history`}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm font-medium text-white transition-all hover:bg-slate-800 hover:shadow-sm"
              title="Voir historique OBD"
            >
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Historique OBD</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({
  searchQuery,
  onCreate,
}: {
  searchQuery: string;
  onCreate: () => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center shadow-lg">
      <div className="relative mb-8">
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-100 to-cyan-100 blur-3xl" />
        <div className="relative mx-auto flex h-40 w-40 items-center justify-center rounded-full border border-slate-200 bg-gradient-to-br from-white to-blue-50 shadow-lg">
          <Car className="h-20 w-20 text-slate-400" />
        </div>
      </div>

      <h3 className="mb-3 text-2xl font-bold text-slate-800">
        {searchQuery ? "Aucun résultat trouvé" : "Aucun véhicule"}
      </h3>

      <p className="mx-auto mb-8 max-w-md text-slate-600">
        {searchQuery
          ? "Essayez avec des termes de recherche différents."
          : "Commencez par ajouter votre premier véhicule à la flotte."}
      </p>

      <button
        onClick={onCreate}
        className="group inline-flex items-center gap-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 px-8 py-4 font-bold text-white shadow-lg transition-all duration-500 hover:scale-105 hover:shadow-2xl"
      >
        <Plus className="h-6 w-6" />
        Ajouter un véhicule
        <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
      </button>
    </div>
  );
}

function VehicleDetailsModal({
  vehicle,
  getStatusColor,
  onClose,
  onEdit,
}: {
  vehicle: Vehicle;
  getStatusColor: (status: string) => string;
  onClose: () => void;
  onEdit: (id: number) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="border-b border-slate-200 bg-gradient-to-r from-blue-50 to-cyan-50 p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-800">Détails du véhicule</h3>
            <button onClick={onClose} className="rounded-lg p-2 transition-colors hover:bg-white/50">
              <X className="h-5 w-5 text-slate-500" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <DetailItem label="Marque & Modèle" value={`${vehicle.brand} ${vehicle.model}`} />
            <DetailItem
              label="Kilométrage"
              value={vehicle.mileage ? `${vehicle.mileage.toLocaleString()} km` : "N/A"}
            />
            <DetailItem label="Immatriculation" value={vehicle.registrationNumber} />
            <DetailItem label="Type de carburant" value={vehicle.fuelType || "N/A"} />
            <DetailItem label="Année" value={vehicle.year || "N/A"} />

            <div>
              <label className="text-sm text-slate-500">Statut</label>
              <div className="mt-1">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-bold ${getStatusColor(
                    vehicle.status
                  )}`}
                >
                  {vehicle.status.replace("_", " ")}
                </span>
              </div>
            </div>
          </div>

          {vehicle.driverName && (
            <div className="mt-6 rounded-xl bg-slate-50 p-4">
              <h4 className="mb-2 font-semibold text-slate-700">Conducteur assigné</h4>
              <p className="text-slate-800">{vehicle.driverName}</p>
              {vehicle.driverEmail && <p className="text-sm text-slate-600">{vehicle.driverEmail}</p>}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-200 p-6">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-300 bg-slate-100 px-6 py-3 font-medium text-slate-700 transition-colors hover:bg-slate-200"
          >
            Fermer
          </button>

          <button
            onClick={() => onEdit(vehicle.id)}
            className="rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 px-6 py-3 font-medium text-white transition-all hover:shadow-lg"
          >
            Modifier
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteConfirmModal({
  onClose,
  onConfirm,
}: {
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-xl bg-rose-100 p-3">
            <Trash2 className="h-6 w-6 text-rose-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Supprimer le véhicule</h3>
            <p className="text-sm text-slate-500">Cette action est irréversible.</p>
          </div>
        </div>

        <p className="mb-6 text-slate-700">Voulez-vous vraiment supprimer ce véhicule ?</p>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 font-semibold text-slate-700 hover:bg-slate-50"
          >
            Annuler
          </button>

          <button
            onClick={onConfirm}
            className="rounded-xl bg-rose-600 px-5 py-2.5 font-semibold text-white hover:bg-rose-700"
          >
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  wrapper,
  glow,
  value,
  title,
  subtitle,
}: {
  icon: ReactNode;
  wrapper: string;
  glow: string;
  value: ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl">
      <div
        className={`absolute inset-0 bg-gradient-to-br ${glow} to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100`}
      />
      <div className="relative p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="relative">
            <div className={`absolute inset-0 rounded-xl bg-gradient-to-r ${wrapper} opacity-30 blur`} />
            <div className={`relative rounded-xl bg-gradient-to-r ${wrapper} p-3 shadow-md`}>{icon}</div>
          </div>
          <div className="text-3xl font-bold text-slate-800">{value}</div>
        </div>

        <h3 className="mb-1 font-semibold text-slate-700">{title}</h3>
        <p className="text-sm text-slate-500">{subtitle}</p>
      </div>
    </div>
  );
}

function Legend({ color, text }: { color: string; text: string }) {
  return (
    <span className="flex items-center text-sm text-slate-500">
      <span className={`mr-1.5 inline-block h-2 w-2 rounded-full ${color}`} />
      {text}
    </span>
  );
}

function InfoLine({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      {icon}
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="font-medium text-slate-800">{value}</p>
      </div>
    </div>
  );
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div>
      <label className="text-sm text-slate-500">{label}</label>
      <p className="text-slate-800">{value}</p>
    </div>
  );
}
