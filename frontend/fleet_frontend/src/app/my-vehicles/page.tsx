"use client";

import { useEffect, useMemo, useState } from "react";
import { Car, RefreshCcw, Eye, Fuel, Gauge, Wrench } from "lucide-react";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { vehicleService } from "@/lib/services/vehicleService";
import type { Vehicle } from "@/types/vehicle";

function cn(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export default function MyVehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<Vehicle | null>(null);

  const load = async () => {
    setRefreshing(true);
    try {
      const data = await vehicleService.getMine();
      setVehicles(data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const statusBadge = (status: any) => {
    const s = String(status || "").toUpperCase();
    const style =
      s === "AVAILABLE"
        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
        : s === "IN_USE"
        ? "bg-blue-50 text-blue-700 border-blue-200"
        : "bg-amber-50 text-amber-800 border-amber-200";
    return (
      <span className={cn("inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold", style)}>
        {s || "UNKNOWN"}
      </span>
    );
  };

  return (
    <ProtectedRoute requiredRoles={["ROLE_DRIVER"]}>
      <div className="p-8 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">My Vehicles</h1>
            <p className="mt-1 text-slate-600">Vehicles assigned to you</p>
          </div>

          <button
            onClick={load}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-all"
          >
            <RefreshCcw className={refreshing ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg animate-pulse">
            <div className="h-5 w-40 rounded bg-slate-200" />
            <div className="mt-3 h-4 w-72 rounded bg-slate-200" />
          </div>
        ) : vehicles.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
            <div className="text-lg font-bold text-slate-900">No assigned vehicles</div>
            <div className="mt-1 text-slate-600">Ask your owner/admin to assign a vehicle to you.</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {vehicles.map((v: any) => (
              <div
                key={v.id}
                className="rounded-2xl border border-slate-200 bg-white shadow-lg overflow-hidden"
              >
                <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-white/10 p-2">
                        <Car className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-lg font-extrabold">{v.registrationNumber || "—"}</div>
                        <div className="text-xs text-white/80">{v.brand} {v.model} • {v.year || "—"}</div>
                      </div>
                    </div>
                    {statusBadge(v.status)}
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <div className="flex items-center gap-2 text-slate-700 text-xs font-bold">
                        <Gauge className="h-4 w-4" /> Mileage
                      </div>
                      <div className="mt-1 text-lg font-extrabold text-slate-900">{v.mileage ?? 0} km</div>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <div className="flex items-center gap-2 text-slate-700 text-xs font-bold">
                        <Fuel className="h-4 w-4" /> Fuel
                      </div>
                      <div className="mt-1 text-lg font-extrabold text-slate-900">
                        {(v as any).fuelType || "—"}
                      </div>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <div className="flex items-center gap-2 text-slate-700 text-xs font-bold">
                        <Wrench className="h-4 w-4" /> Next
                      </div>
                      <div className="mt-1 text-sm font-extrabold text-slate-900">
                        {v.nextMaintenanceDate ? new Date(v.nextMaintenanceDate as any).toLocaleDateString() : "—"}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={() => setSelected(v)}
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-2 text-sm font-bold text-white shadow-md hover:shadow-lg transition-all"
                    >
                      <Eye className="h-4 w-4" />
                      View details
                    </button>
                  </div>

                  {selected?.id === v.id && (
                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                      <div className="text-sm font-extrabold text-slate-900">Details</div>
                      <div className="mt-2 text-sm text-slate-700">
                        VIN: {(v as any).vin || "—"} <br />
                        Color: {(v as any).color || "—"} <br />
                        Transmission: {(v as any).transmission || "—"}
                      </div>
                      <div className="mt-3 flex justify-end">
                        <button
                          onClick={() => setSelected(null)}
                          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
                        >
                          Close
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
