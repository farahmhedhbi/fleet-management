"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, RefreshCcw, Users, Car, UserMinus } from "lucide-react";
import { toast } from "react-toastify";

import { useAuth } from "@/contexts/authContext";
import { vehicleService } from "@/lib/services/vehicleService";
import { driverService } from "@/lib/services/driverService";
import type { Vehicle } from "@/types/vehicle";
import type { Driver } from "@/types/driver";

function cn(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

// ✅ normalize: كي driverId = null/undefined/0 => ""
function normalizeDriverId(v: any): number | "" {
  const raw = v?.driverId ?? v?.driver?.id ?? null;
  const n = raw === null || raw === undefined ? 0 : Number(raw);
  return n > 0 ? n : "";
}

export default function OwnerAssignmentsPage() {
  const router = useRouter();
  const { isAuthenticated, user, loading } = useAuth();
  const isOwner = user?.role === "ROLE_OWNER";

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedDriverByVehicle, setSelectedDriverByVehicle] = useState<
    Record<number, number | "">
  >({});
  const [savingVehicleIds, setSavingVehicleIds] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    if (!isOwner) {
      router.replace("/dashboard");
      return;
    }

    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, isAuthenticated, isOwner]);

  const loadAll = async () => {
    setPageLoading(true);
    try {
      const [vs, ds] = await Promise.all([vehicleService.getAll(), driverService.getAll()]);
      setVehicles(vs);
      setDrivers(ds);

      // ✅ init select per vehicle
      const map: Record<number, number | ""> = {};
      (vs as any[]).forEach((v: any) => {
        map[Number(v.id)] = normalizeDriverId(v); // ✅ empty when no driver
      });
      setSelectedDriverByVehicle(map);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.response?.data?.message || e?.message || "Failed to load assignments data");
    } finally {
      setPageLoading(false);
    }
  };

  const refresh = async () => {
    setRefreshing(true);
    try {
      await loadAll();
    } finally {
      setRefreshing(false);
    }
  };

  const driverLabel = (d: Driver) =>
    `${d.firstName ?? ""} ${d.lastName ?? ""}`.trim() + (d.licenseNumber ? ` (${d.licenseNumber})` : "");

  const driverById = useMemo(() => {
    const m = new Map<number, Driver>();
    (drivers as any[]).forEach((d: any) => m.set(Number(d.id), d));
    return m;
  }, [drivers]);

  const handleAssign = async (vehicleId: number) => {
    const driverId = selectedDriverByVehicle[vehicleId];

    if (!driverId) {
      toast.warn("Choisis un driver avant d’affecter.");
      return;
    }

    setSavingVehicleIds((prev) => ({ ...prev, [vehicleId]: true }));
    try {
      await vehicleService.assignDriver(vehicleId, Number(driverId));
      toast.success("Conducteur affecté ✅");
      await loadAll();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.response?.data?.message || e?.message || "Assign failed");
    } finally {
      setSavingVehicleIds((prev) => ({ ...prev, [vehicleId]: false }));
    }
  };

  const handleUnassign = async (vehicleId: number) => {
    setSavingVehicleIds((prev) => ({ ...prev, [vehicleId]: true }));
    try {
      await vehicleService.unassignDriver(vehicleId);
      toast.success("Conducteur désaffecté ✅");

      // ✅ خلي الselect يولي فارغ مباشرة
      setSelectedDriverByVehicle((prev) => ({ ...prev, [vehicleId]: "" }));

      await loadAll();
    } catch (e: any) {
      console.error(e);
      // لو backend يرجّع message واضح
      toast.error(e?.response?.data?.message || e?.message || "Unassign failed");
    } finally {
      setSavingVehicleIds((prev) => ({ ...prev, [vehicleId]: false }));
    }
  };

  if (loading || pageLoading) {
    return (
      <div className="p-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg animate-pulse">
          <div className="h-6 w-60 rounded bg-slate-200" />
          <div className="mt-4 h-4 w-96 rounded bg-slate-200" />
        </div>
      </div>
    );
  }

  const assignedCount = (vehicles as any[]).filter((v: any) => normalizeDriverId(v) !== "").length;

  return (
    <div className="p-6 md:p-10 space-y-6">
      {/* header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Affectation Véhicule ↔ Conducteur
          </h1>
          <p className="mt-1 text-slate-600">Affecte / désaffecte un conducteur facilement.</p>
        </div>

        <button
          onClick={refresh}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-all"
        >
          <RefreshCcw className={refreshing ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
          Refresh
        </button>
      </div>

      {/* stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
            <Car className="h-4 w-4" /> Mes véhicules
          </div>
          <div className="mt-2 text-3xl font-extrabold text-slate-900">{vehicles.length}</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
            <Users className="h-4 w-4" /> Conducteurs
          </div>
          <div className="mt-2 text-3xl font-extrabold text-slate-900">{drivers.length}</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg">
          <div className="text-sm font-semibold text-slate-600">Véhicules affectés</div>
          <div className="mt-2 text-3xl font-extrabold text-slate-900">{assignedCount}</div>
        </div>
      </div>

      {/* list cards */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-lg overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50">
          <div className="font-bold text-slate-900">Liste des véhicules</div>
          <div className="text-sm text-slate-600">Choisis un conducteur (ou désaffecte).</div>
        </div>

        <div className="divide-y divide-slate-100">
          {vehicles.map((v: any) => {
            const vehicleId = Number(v.id);
            const saving = !!savingVehicleIds[vehicleId];

            const currentDriverId = normalizeDriverId(v);
            const currentDriver =
              currentDriverId !== "" ? driverById.get(Number(currentDriverId)) ?? null : null;

            const selected = selectedDriverByVehicle[vehicleId] ?? "";

            return (
              <div key={vehicleId} className="p-5 hover:bg-slate-50 transition">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* left info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="text-lg font-extrabold text-slate-900">
                        {v.registrationNumber || "—"}
                      </div>
                      <span className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-700">
                        {v.status}
                      </span>
                    </div>

                    <div className="mt-1 text-sm text-slate-600">
                      {v.brand} {v.model} • {v.year}
                    </div>

                    <div className="mt-3">
                      {currentDriver ? (
                        <div className="rounded-xl border border-slate-200 bg-white p-3">
                          <div className="text-xs font-bold text-slate-500">Conducteur actuel</div>
                          <div className="mt-1 font-semibold text-slate-900">{driverLabel(currentDriver)}</div>
                          <div className="text-sm text-slate-600">{currentDriver.email}</div>
                        </div>
                      ) : (
                        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-3 text-sm text-slate-500">
                          Aucun conducteur affecté
                        </div>
                      )}
                    </div>
                  </div>

                  {/* right actions */}
                  <div className="w-full lg:w-[420px] space-y-3">
                    <select
                      value={selected}
                      onChange={(e) =>
                        setSelectedDriverByVehicle((prev) => ({
                          ...prev,
                          [vehicleId]: e.target.value ? Number(e.target.value) : "",
                        }))
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={saving}
                    >
                      <option value="">— Choisir un conducteur —</option>
                      {drivers.map((d: any) => (
                        <option key={d.id} value={d.id}>
                          {driverLabel(d)}
                        </option>
                      ))}
                    </select>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={() => handleAssign(vehicleId)}
                        disabled={saving || !selected}
                        className={cn(
                          "flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-white shadow-sm transition-all",
                          saving || !selected ? "bg-slate-300 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700"
                        )}
                      >
                        <CheckCircle className="h-4 w-4" />
                        Affecter
                      </button>

                      <button
                        onClick={() => handleUnassign(vehicleId)}
                        disabled={saving || !currentDriverId}
                        className={cn(
                          "flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold shadow-sm transition-all",
                          saving || !currentDriverId
                            ? "border border-slate-200 text-slate-400 bg-slate-50 cursor-not-allowed"
                            : "border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100"
                        )}
                      >
                        <UserMinus className="h-4 w-4" />
                        Désaffecter
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {vehicles.length === 0 && (
            <div className="py-10 text-center text-slate-600">Aucun véhicule trouvé.</div>
          )}
        </div>
      </div>
    </div>
  );
}