"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminOnly } from "@/components/layout/AdminOnly";
import { AdminShell } from "@/components/admin/AdminShell";
import { adminService } from "@/lib/services/adminService";
import type { User } from "@/types/user";
import type { Vehicle } from "@/types/vehicle";
import { Car, ChevronRight, RefreshCcw, Search } from "lucide-react";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";

function cn(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export default function AdminOwnersPage() {
  const [owners, setOwners] = useState<User[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedOwner, setSelectedOwner] = useState<User | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadingVehicles, setLoadingVehicles] = useState(false);

  const [q, setQ] = useState("");

  const filteredOwners = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return owners;
    return owners.filter((o) =>
      `${o.firstName} ${o.lastName} ${o.email}`.toLowerCase().includes(s)
    );
  }, [owners, q]);

  async function loadOwners() {
    setLoading(true);
    try {
      const data = await adminService.listOwners();
      setOwners(data);
      // si owner selectionné existe toujours, on garde
    } finally {
      setLoading(false);
    }
  }

  async function selectOwner(owner: User) {
    setSelectedOwner(owner);
    setLoadingVehicles(true);
    try {
      const data = await adminService.vehiclesByOwner(owner.id);
      setVehicles(data);
    } finally {
      setLoadingVehicles(false);
    }
  }

  useEffect(() => {
    loadOwners();
  }, []);

  return (
    <ProtectedRoute requiredRoles={["ROLE_ADMIN"]}>
    <AdminOnly>
      <AdminShell
        title="Owners & Vehicles"
        subtitle="Select an owner to view their fleet vehicles."
      >
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Owners list */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-lg overflow-hidden">
            <div className="p-5 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center justify-between gap-3">
                <div className="font-bold text-slate-900">Owners</div>
                <button
                  onClick={loadOwners}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <RefreshCcw className="h-4 w-4" />
                  Refresh
                </button>
              </div>

              <div className="mt-4 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search owners..."
                  className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                />
              </div>
            </div>

            <div className="p-4">
              {loading ? (
                <div className="animate-pulse space-y-3">
                  <div className="h-12 rounded-xl bg-slate-200" />
                  <div className="h-12 rounded-xl bg-slate-200" />
                  <div className="h-12 rounded-xl bg-slate-200" />
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
                          "w-full flex items-center justify-between rounded-xl border p-4 text-left transition",
                          active
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-slate-200 bg-white hover:bg-slate-50 text-slate-900"
                        )}
                      >
                        <div>
                          <div className="font-extrabold">
                            {o.firstName} {o.lastName}
                          </div>
                          <div className={cn("text-sm", active ? "text-white/80" : "text-slate-600")}>
                            {o.email}
                          </div>
                        </div>
                        <ChevronRight className={cn("h-5 w-5", active ? "text-white/90" : "text-slate-500")} />
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
                  {vehicles.map((v) => (
                    <div
                      key={v.id}
                      className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 hover:shadow-md transition"
                    >
                      <div>
                        <div className="font-extrabold text-slate-900">
                          {v.registrationNumber || "—"}
                        </div>
                        <div className="text-sm text-slate-600">
                          {v.brand ?? "—"} {v.model ?? ""} • {v.status ?? "—"}
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-slate-700">
                        {v.mileage ?? 0} km
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </AdminShell>
    </AdminOnly>
    </ProtectedRoute>
  );
}
