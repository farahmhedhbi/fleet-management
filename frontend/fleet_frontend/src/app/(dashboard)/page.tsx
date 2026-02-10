"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { useAuth } from "@/contexts/authContext";
import { vehicleService } from "@/lib/services/vehicleService";
import type { Vehicle } from "@/types/vehicle";
import { Car, Plus, Edit, Trash2, Eye, RefreshCcw } from "lucide-react";

export default function VehiclesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const role = user?.role;

  const canManage =  role === "ROLE_OWNER";

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState<number | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  const load = async () => {
    setRefreshing(true);
    try {
      const data = await vehicleService.getAll();
      setVehicles(data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const confirmDelete = async (id: number) => {
    await vehicleService.remove(id);
    setShowDeleteModal(null);
    await load();
  };

  return (
    <ProtectedRoute requiredRoles={["ROLE_ADMIN", "ROLE_OWNER"]}>
      <div className="p-8 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Vehicles</h1>
            <p className="mt-1 text-slate-600">Manage your fleet vehicles</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={load}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-all"
            >
              <RefreshCcw className={refreshing ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
              Refresh
            </button>

            {canManage && (
              <button
                onClick={() => router.push("/vehicles/create")}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 px-4 py-2 text-sm font-extrabold text-white shadow-md hover:shadow-lg transition-all"
              >
                <Plus className="h-4 w-4" />
                Add Vehicle
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg animate-pulse">
            <div className="h-5 w-40 rounded bg-slate-200" />
            <div className="mt-3 h-4 w-72 rounded bg-slate-200" />
          </div>
        ) : vehicles.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
            <div className="text-lg font-bold text-slate-900">No vehicles found</div>
            <div className="mt-1 text-slate-600">Create your first vehicle to start tracking fleet operations.</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {vehicles.map((vehicle: any) => (
              <div key={vehicle.id} className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
                <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-white/10 p-2">
                        <Car className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-lg font-extrabold">{vehicle.registrationNumber || "—"}</div>
                        <div className="text-xs text-white/80">{vehicle.brand} {vehicle.model}</div>
                      </div>
                    </div>

                    <span className="rounded-full bg-white/10 border border-white/20 px-3 py-1 text-xs font-bold">
                      {vehicle.status || "—"}
                    </span>
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-slate-600">
                      Mileage: <span className="font-bold text-slate-900">{vehicle.mileage ?? 0} km</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {canManage && (
                        <>
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
                        </>
                      )}

                      <button
                        onClick={() => setSelectedVehicle(vehicle)}
                        className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:shadow-lg transition-all shadow-md"
                        title="Voir détails"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* details panel */}
                  {selectedVehicle?.id === vehicle.id && (
                    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="text-sm font-extrabold text-slate-900">Details</div>
                      <div className="mt-2 text-sm text-slate-700">
                        VIN: {vehicle.vin || "—"}<br />
                        Fuel: {vehicle.fuelType || "—"}<br />
                        Transmission: {vehicle.transmission || "—"}
                      </div>
                      <div className="mt-3 flex justify-end">
                        <button
                          onClick={() => setSelectedVehicle(null)}
                          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  )}

                  {/* delete modal simple */}
                  {showDeleteModal === vehicle.id && (
                    <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4">
                      <div className="font-extrabold text-rose-800">Delete vehicle?</div>
                      <div className="mt-1 text-sm text-rose-700">
                        This action cannot be undone.
                      </div>
                      <div className="mt-3 flex justify-end gap-2">
                        <button
                          onClick={() => setShowDeleteModal(null)}
                          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => confirmDelete(vehicle.id)}
                          className="rounded-xl bg-gradient-to-r from-rose-500 to-red-600 px-4 py-2 text-sm font-extrabold text-white shadow-md hover:shadow-lg"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
