"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminOnly } from "@/components/layout/AdminOnly";
import { AdminShell } from "@/components/admin/AdminShell";
import { adminService } from "@/lib/services/adminService";
import type { User } from "@/types/user";
import type { Vehicle } from "@/types/vehicle";
import {
  Car,
  ChevronRight,
  RefreshCcw,
  Search,
  Users,
  Mail,
  Gauge,
  Shield,
  BadgeCheck,
} from "lucide-react";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { toastError } from "@/components/ui/Toast";

function cn(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

function statusChip(status?: string) {
  const s = String(status || "").toUpperCase();
  if (s.includes("AVAILABLE"))
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (s.includes("IN_SERVICE") || s.includes("MAINT"))
    return "bg-amber-50 text-amber-700 border-amber-200";
  if (s.includes("OUT") || s.includes("BROKEN"))
    return "bg-rose-50 text-rose-700 border-rose-200";
  return "bg-slate-50 text-slate-700 border-slate-200";
}

export default function AdminOwnersPage() {
  const [owners, setOwners] = useState<User[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedOwner, setSelectedOwner] = useState<User | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [q, setQ] = useState("");

  const filteredOwners = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return owners;
    return owners.filter((o) =>
      `${o.firstName} ${o.lastName} ${o.email}`.toLowerCase().includes(s)
    );
  }, [owners, q]);

  async function loadOwners() {
    setIsRefreshing(true);
    setLoading(true);
    try {
      const data = await adminService.listOwners();
      setOwners(data);
    } catch (e: any) {
      toastError(e?.response?.data?.message || "Erreur chargement owners");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }

  async function selectOwner(owner: User) {
    setSelectedOwner(owner);
    setLoadingVehicles(true);
    try {
      const data = await adminService.vehiclesByOwner(owner.id);
      setVehicles(data);
    } catch (e: any) {
      toastError(e?.response?.data?.message || "Erreur chargement véhicules");
      setVehicles([]);
    } finally {
      setLoadingVehicles(false);
    }
  }

  useEffect(() => {
    loadOwners();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalKm = useMemo(
    () => vehicles.reduce((sum: number, v: any) => sum + (v?.mileage || 0), 0),
    [vehicles]
  );

  return (
    <ProtectedRoute requiredRoles={["ROLE_ADMIN"]}>
      <AdminOnly>
        <AdminShell
          title="Owners & Vehicles"
          subtitle="Select an owner to view their fleet vehicles."
        >
          <div className="space-y-6">
            {/* Header (dashboard feel) */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
                  Owners & Vehicles
                </h1>
                <p className="mt-1 text-slate-600">
                  Browse owners and inspect their fleet vehicles.
                </p>
              </div>

              <button
                onClick={loadOwners}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-all"
              >
                <RefreshCcw
                  className={isRefreshing ? "h-4 w-4 animate-spin" : "h-4 w-4"}
                />
                Refresh
              </button>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-slate-600">Owners</div>
                  <Users className="h-5 w-5 text-slate-400" />
                </div>
                <div className="mt-2 text-3xl font-extrabold text-slate-900">
                  {owners.length}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-slate-600">Vehicles (selected)</div>
                  <Car className="h-5 w-5 text-slate-400" />
                </div>
                <div className="mt-2 text-3xl font-extrabold text-slate-900">
                  {vehicles.length}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-slate-600">Total mileage</div>
                  <Gauge className="h-5 w-5 text-slate-400" />
                </div>
                <div className="mt-2 text-3xl font-extrabold text-slate-900">
                  {totalKm.toLocaleString()} km
                </div>
              </div>
            </div>

            {/* Main grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Owners list */}
              <div className="rounded-2xl border border-slate-200 bg-white shadow-lg overflow-hidden">
                <div className="p-5 border-b border-slate-200 bg-slate-50">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <Shield className="h-5 w-5 text-slate-700" />
                      Owners
                    </div>

                    <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-extrabold text-slate-700">
                      <Users className="h-4 w-4" />
                      {filteredOwners.length}
                    </div>
                  </div>

                  <div className="mt-4 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      placeholder="Search owners by name or email..."
                      className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-slate-200"
                    />
                  </div>
                </div>

                <div className="p-4">
                  {loading ? (
                    <div className="animate-pulse space-y-3">
                      <div className="h-14 rounded-xl bg-slate-200" />
                      <div className="h-14 rounded-xl bg-slate-200" />
                      <div className="h-14 rounded-xl bg-slate-200" />
                    </div>
                  ) : filteredOwners.length === 0 ? (
                    <div className="text-slate-600">No owners found.</div>
                  ) : (
                    <div className="space-y-2">
                      {filteredOwners.map((o) => {
                        const active = selectedOwner?.id === o.id;

                        return (
                          <button
                            key={o.id}
                            onClick={() => selectOwner(o)}
                            className={cn(
                              "w-full flex items-center justify-between rounded-2xl border p-4 text-left shadow-sm transition-all",
                              active
                                ? "border-slate-900 bg-slate-900 text-white"
                                : "border-slate-200 bg-white hover:bg-slate-50 text-slate-900"
                            )}
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className={cn(
                                  "grid h-11 w-11 place-items-center rounded-2xl shadow-md",
                                  active ? "bg-white/10" : "bg-slate-900 text-white"
                                )}
                              >
                                <BadgeCheck className={cn("h-5 w-5", active ? "text-white" : "text-white")} />
                              </div>

                              <div>
                                <div className="font-extrabold">
                                  {o.firstName} {o.lastName}
                                </div>

                                <div
                                  className={cn(
                                    "mt-1 inline-flex items-center gap-2 text-sm font-semibold",
                                    active ? "text-white/80" : "text-slate-600"
                                  )}
                                >
                                  <Mail className={cn("h-4 w-4", active ? "text-white/70" : "text-slate-400")} />
                                  {o.email}
                                </div>
                              </div>
                            </div>

                            <ChevronRight
                              className={cn(
                                "h-5 w-5",
                                active ? "text-white/90" : "text-slate-500"
                              )}
                            />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Vehicles list */}
              <div className="xl:col-span-2 rounded-2xl border border-slate-200 bg-white shadow-lg overflow-hidden">
                <div className="p-5 border-b border-slate-200 bg-slate-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900">Owner Vehicles</div>
                      <div className="text-sm text-slate-600">
                        {selectedOwner
                          ? `${selectedOwner.firstName} ${selectedOwner.lastName}`
                          : "Select an owner to view vehicles"}
                      </div>
                    </div>

                    <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-semibold text-slate-700">
                      <Car className="h-4 w-4" />
                      {vehicles.length}
                    </div>
                  </div>
                </div>

                <div className="p-5">
                  {!selectedOwner ? (
                    <div className="text-slate-600">
                      Choose an owner from the list to load their vehicles.
                    </div>
                  ) : loadingVehicles ? (
                    <div className="animate-pulse space-y-3">
                      <div className="h-14 rounded-xl bg-slate-200" />
                      <div className="h-14 rounded-xl bg-slate-200" />
                      <div className="h-14 rounded-xl bg-slate-200" />
                    </div>
                  ) : vehicles.length === 0 ? (
                    <div className="text-slate-600">No vehicles for this owner.</div>
                  ) : (
                    <div className="space-y-3">
                      {vehicles.map((v: any) => (
                        <div
                          key={v.id}
                          className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 hover:shadow-md transition-all"
                        >
                          <div className="flex items-start gap-3">
                            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-900 text-white shadow-md">
                              <Car className="h-5 w-5" />
                            </div>

                            <div>
                              <div className="font-extrabold text-slate-900">
                                {v.registrationNumber || "—"}
                              </div>

                              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-600">
                                <span>
                                  {v.brand ?? "—"} {v.model ?? ""}
                                </span>

                                <span
                                  className={cn(
                                    "inline-flex items-center rounded-full border px-3 py-1 text-xs font-extrabold",
                                    statusChip(v.status)
                                  )}
                                >
                                  {v.status ?? "—"}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="text-sm font-extrabold text-slate-900">
                            {(v.mileage ?? 0).toLocaleString()} km
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </AdminShell>
      </AdminOnly>
    </ProtectedRoute>
  );
}
