"use client";

import Link from "next/link";
import { RefObject } from "react";
import { Vehicle } from "@/types/vehicle";
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

  // ✅ correction ici
  containerRef: RefObject<HTMLDivElement>;

  onDelete: (id: number) => void;
  onAssignDriver: (vehicleId: number) => void;
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
  onAssignDriver,
  onExportPDF,
  onEdit,
  onCreate,
  onAnalytics,
  getVehicleEfficiency,
  getEfficiencyColor,
  getStatusColor,
}: VehiclesViewProps) {
  const getFuelIcon = (fuelType?: string) => {
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
    );
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 text-slate-800"
      ref={containerRef}
    >
      <div className="relative pt-16 pb-12 overflow-hidden">
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
                <span className="text-3xl text-slate-600 font-normal">
                  Gestion optimisée
                </span>
              </h1>

              <p className="text-xl text-slate-600 max-w-2xl">
                Supervisez et gérez votre parc automobile avec des outils avancés
              </p>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={onExportPDF}
                className="hidden lg:flex items-center gap-2 px-5 py-3 bg-white border border-slate-300 rounded-xl hover:border-blue-400 hover:shadow-md transition-all group shadow-sm"
              >
                <FileText className="h-5 w-5 text-slate-600 group-hover:text-blue-500" />
                <span className="font-medium text-slate-700">Exporter PDF</span>
              </button>

              <button
                onClick={onCreate}
                className="relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-xl blur-md opacity-70 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative bg-gradient-to-r from-blue-500 to-cyan-500 px-6 py-4 rounded-xl flex items-center gap-3 font-bold text-lg text-white shadow-lg hover:shadow-2xl transition-all duration-500 group-hover:scale-105">
                  <div className="relative">
                    <Plus className="h-6 w-6" />
                    <div className="absolute -inset-1 bg-white/30 rounded-full blur-sm"></div>
                  </div>
                  Nouveau Véhicule
                </div>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
              value={vehicles.filter((v) => v.status === "AVAILABLE").length}
              title="Disponibles"
              subtitle="Prêts pour service"
            />
            <StatCard
              icon={<Wrench className="h-6 w-6 text-white" />}
              wrapper="from-amber-500 to-orange-500"
              glow="from-amber-50"
              value={vehicles.filter((v) => v.status === "UNDER_MAINTENANCE").length}
              title="En Maintenance"
              subtitle="En réparation"
            />
            <StatCard
              icon={<TrendingUp className="h-6 w-6 text-white" />}
              wrapper="from-purple-500 to-pink-500"
              glow="from-purple-50"
              value={
                vehicles.length > 0
                  ? `${Math.round(
                      (vehicles.filter((v) => v.status === "AVAILABLE").length /
                        vehicles.length) *
                        100
                    )}%`
                  : "0%"
              }
              title="Efficacité"
              subtitle="Taux de disponibilité"
            />
          </div>

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
                  {["all", "AVAILABLE", "IN_USE", "UNDER_MAINTENANCE"].map(
                    (filter) => (
                      <button
                        key={filter}
                        onClick={() => setActiveFilter(filter)}
                        className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                          activeFilter === filter
                            ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md"
                            : "text-slate-600 hover:text-slate-900 hover:bg-white"
                        }`}
                      >
                        {filter === "all" ? "Tous" : filter.replace("_", " ")}
                      </button>
                    )
                  )}
                </div>

                <div className="flex items-center gap-2 bg-slate-100 rounded-xl p-1">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2.5 rounded-lg ${
                      viewMode === "grid"
                        ? "bg-white text-blue-500 shadow-sm"
                        : "text-slate-500 hover:text-slate-900 hover:bg-white"
                    }`}
                  >
                    <div className="grid grid-cols-2 gap-0.5 w-5 h-5">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-current rounded-sm"></div>
                      ))}
                    </div>
                  </button>
                  <button
                    onClick={() => setViewMode("table")}
                    className={`p-2.5 rounded-lg ${
                      viewMode === "table"
                        ? "bg-white text-blue-500 shadow-sm"
                        : "text-slate-500 hover:text-slate-900 hover:bg-white"
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
                    onClick={() => setSearchQuery("")}
                    className="p-3 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                  >
                    <X className="h-5 w-5 text-slate-500" />
                  </button>
                )}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <p className="text-slate-600">
                {filteredVehicles.length} véhicule
                {filteredVehicles.length !== 1 ? "s" : ""} trouvé
                {filteredVehicles.length !== 1 ? "s" : ""}
              </p>

              <div className="flex items-center gap-4">
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
            <div className="bg-gradient-to-r from-rose-50 to-rose-100 border border-rose-200 rounded-2xl p-6 flex items-start gap-4 shadow-sm">
              <AlertCircle className="h-6 w-6 text-rose-500 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-rose-800 mb-1">
                  Erreur de chargement
                </h3>
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
              {searchQuery ? "Aucun résultat trouvé" : "Aucun véhicule"}
            </h3>
            <p className="text-slate-600 mb-8 max-w-md mx-auto">
              {searchQuery
                ? "Essayez avec des termes de recherche différents."
                : "Commencez par ajouter votre premier véhicule à la flotte."}
            </p>
            <button
              onClick={onCreate}
              className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-8 py-4 rounded-xl font-bold shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-105 group"
            >
              <Plus className="h-6 w-6" />
              Ajouter un véhicule
              <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredVehicles.map((vehicle) => {
              const efficiency = getVehicleEfficiency(vehicle);

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
                            <h3 className="text-lg font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                              {vehicle.brand} {vehicle.model}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span
                                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(
                                  vehicle.status
                                )} border`}
                              >
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
                          <span className="text-sm text-slate-600">
                            Efficacité véhicule
                          </span>
                          <span
                            className="text-sm font-bold"
                            style={{
                              color:
                                efficiency >= 80
                                  ? "#10b981"
                                  : efficiency >= 60
                                  ? "#f59e0b"
                                  : "#ef4444",
                            }}
                          >
                            {efficiency}%
                          </span>
                        </div>
                        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full bg-gradient-to-r ${getEfficiencyColor(
                              efficiency
                            )} rounded-full transition-all duration-1000`}
                            style={{ width: `${efficiency}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="space-y-4">
                        <InfoLine
                          icon={
                            <div className="p-2 bg-purple-100 rounded-lg">
                              <Gauge className="h-4 w-4 text-purple-600" />
                            </div>
                          }
                          label="Kilométrage"
                          value={
                            vehicle.mileage
                              ? `${vehicle.mileage.toLocaleString()} km`
                              : "N/A"
                          }
                        />

                        <InfoLine
                          icon={
                            <div className="p-2 bg-orange-100 rounded-lg">
                              {getFuelIcon(vehicle.fuelType)}
                            </div>
                          }
                          label="Carburant"
                          value={vehicle.fuelType || "N/A"}
                        />

                        {vehicle.color && (
                          <InfoLine
                            icon={
                              <div className="p-2 bg-pink-100 rounded-lg">
                                <div
                                  className="w-4 h-4 rounded-full border"
                                  style={{
                                    backgroundColor: vehicle.color.toLowerCase(),
                                  }}
                                />
                              </div>
                            }
                            label="Couleur"
                            value={vehicle.color}
                          />
                        )}
                      </div>
                    </div>

                    <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-200">
                      {vehicle.driverName ? (
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-slate-900">
                              {vehicle.driverName}
                            </p>
                            {vehicle.driverEmail && (
                              <p className="text-xs text-slate-500">
                                {vehicle.driverEmail}
                              </p>
                            )}
                          </div>
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Assigné
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-slate-500">
                            Aucun conducteur assigné
                          </p>
                          <button
                            onClick={() => onAssignDriver(vehicle.id)}
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
                          onClick={() => onEdit(vehicle.id)}
                          className="p-2 bg-white border border-slate-300 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-all shadow-sm"
                          title="Modifier"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setShowDeleteModal(vehicle.id)}
                          className="p-2 bg-white border border-slate-300 hover:border-rose-400 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-all shadow-sm"
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
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
              );
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
                    const efficiency = getVehicleEfficiency(vehicle);

                    return (
                      <tr
                        key={vehicle.id}
                        className="border-b border-slate-100 hover:bg-blue-50/50 transition-colors"
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-sm font-bold text-white shadow-sm">
                              <Car className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="font-medium text-slate-800">
                                {vehicle.brand} {vehicle.model}
                              </div>
                              <div className="text-xs text-slate-500">
                                {vehicle.fuelType || "N/A"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-sm font-medium text-slate-800">
                            {vehicle.registrationNumber}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-sm text-slate-800">
                            {vehicle.year || "N/A"}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${getStatusColor(
                              vehicle.status
                            )} border`}
                          >
                            {vehicle.status === "AVAILABLE" ? (
                              <CheckCircle className="h-3 w-3" />
                            ) : vehicle.status === "IN_USE" ? (
                              <Clock className="h-3 w-3" />
                            ) : (
                              <Wrench className="h-3 w-3" />
                            )}
                            {vehicle.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full bg-gradient-to-r ${getEfficiencyColor(
                                  efficiency
                                )} rounded-full`}
                                style={{ width: `${efficiency}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium">{efficiency}%</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-sm text-slate-800">
                            {vehicle.driverName || "Non assigné"}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => onEdit(vehicle.id)}
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
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-8 shadow-2xl">
              <div className="text-center mb-6">
                <div className="inline-flex p-3 rounded-xl bg-rose-100 mb-4">
                  <AlertCircle className="h-8 w-8 text-rose-500" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">
                  Supprimer le véhicule
                </h3>
                <p className="text-slate-600">
                  Cette action est irréversible. Voulez-vous vraiment supprimer ce
                  véhicule de la flotte ?
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
                  onClick={() => onDelete(showDeleteModal)}
                  className="flex-1 py-3 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white rounded-xl font-medium transition-all shadow-md hover:shadow-lg"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        )}

        {selectedVehicle && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl border border-slate-200 max-w-2xl w-full shadow-2xl">
              <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-cyan-50">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-slate-800">
                    Détails du véhicule
                  </h3>
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
                  <DetailItem
                    label="Marque & Modèle"
                    value={`${selectedVehicle.brand} ${selectedVehicle.model}`}
                  />
                  <DetailItem
                    label="Kilométrage"
                    value={
                      selectedVehicle.mileage
                        ? `${selectedVehicle.mileage.toLocaleString()} km`
                        : "N/A"
                    }
                  />
                  <DetailItem
                    label="Immatriculation"
                    value={selectedVehicle.registrationNumber}
                  />
                  <DetailItem
                    label="Type de carburant"
                    value={selectedVehicle.fuelType || "N/A"}
                  />
                  <DetailItem
                    label="Année"
                    value={selectedVehicle.year || "N/A"}
                  />
                  <div>
                    <label className="text-sm text-slate-500">Statut</label>
                    <div className="mt-1">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold ${getStatusColor(
                          selectedVehicle.status
                        )} border`}
                      >
                        {selectedVehicle.status.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedVehicle.driverName && (
                  <div className="mt-6 p-4 bg-slate-50 rounded-xl">
                    <h4 className="font-semibold text-slate-700 mb-2">
                      Conducteur assigné
                    </h4>
                    <p className="text-slate-800">{selectedVehicle.driverName}</p>
                    {selectedVehicle.driverEmail && (
                      <p className="text-sm text-slate-600">
                        {selectedVehicle.driverEmail}
                      </p>
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
                  onClick={() => onEdit(selectedVehicle.id)}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-medium hover:shadow-lg transition-all"
                >
                  Modifier
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white border-t border-slate-200 py-6">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BarChart3 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">
                  Total: {vehicles.length} véhicules • Disponibles:{" "}
                  {vehicles.filter((v) => v.status === "AVAILABLE").length}
                </p>
              </div>
            </div>

            <button
              onClick={onAnalytics}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
            >
              Voir les statistiques détaillées
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

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
  icon: React.ReactNode;
  wrapper: string;
  glow: string;
  value: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="group relative overflow-hidden bg-white rounded-2xl border border-slate-200 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
      <div className={`absolute inset-0 bg-gradient-to-br ${glow} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
      <div className="relative p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="relative">
            <div className={`absolute inset-0 bg-gradient-to-r ${wrapper} rounded-xl blur opacity-30`} />
            <div className={`relative bg-gradient-to-r ${wrapper} p-3 rounded-xl shadow-md`}>
              {icon}
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-800">{value}</div>
        </div>
        <h3 className="text-slate-700 font-semibold mb-1">{title}</h3>
        <p className="text-slate-500 text-sm">{subtitle}</p>
      </div>
    </div>
  );
}

function Legend({ color, text }: { color: string; text: string }) {
  return (
    <span className="text-sm text-slate-500 flex items-center">
      <span className={`inline-block w-2 h-2 ${color} rounded-full mr-1.5`}></span>
      {text}
    </span>
  );
}

function InfoLine({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      {icon}
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="text-slate-800 font-medium">{value}</p>
      </div>
    </div>
  );
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-sm text-slate-500">{label}</label>
      <p className="text-slate-800">{value}</p>
    </div>
  );
}