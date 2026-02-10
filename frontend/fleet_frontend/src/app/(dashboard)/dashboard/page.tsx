"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Car,
  Users,
  CheckCircle,
  Wrench,
  Shield,
  BatteryCharging,
  Route,
  BarChart3,
  Settings,
  RefreshCcw,
} from "lucide-react";

import { useAuth } from "@/contexts/authContext";
import { vehicleService } from "@/lib/services/vehicleService";
import { driverService } from "@/lib/services/driverService";
import { toastError } from "@/components/ui/Toast"; // si tu l'as, sinon remplace par console.error
import type { Vehicle } from "@/types/vehicle";
import type { Driver } from "@/types/driver";

interface DashboardStats {
  totalDrivers: number;
  totalVehicles: number;
  availableVehicles: number;
  activeDrivers: number;
  vehiclesNeedingMaintenance: number;
  totalMileage: number;
  fleetHealth: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();

  const role = user?.role;
  const isAdmin = role === "ROLE_ADMIN";
  const isOwner = role === "ROLE_OWNER";
  const isDriver = role === "ROLE_DRIVER";

  const [stats, setStats] = useState<DashboardStats>({
    totalDrivers: 0,
    totalVehicles: 0,
    availableVehicles: 0,
    activeDrivers: 0,
    vehiclesNeedingMaintenance: 0,
    totalMileage: 0,
    fleetHealth: 85,
  });
  const [recentDrivers, setRecentDrivers] = useState<Driver[]>([]);
  const [recentVehicles, setRecentVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadDashboardData = async () => {
    setIsRefreshing(true);

    try {
      const now = new Date();
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      // ✅ DRIVER : only my profile + my vehicles
      if (isDriver) {
  const [meDriver, myVehicles] = await Promise.all([
    driverService.me(),
    vehicleService.getMine(), // ✅ maintenant -> GET /api/vehicles
  ]);

        const vehiclesNeedingMaintenance = (myVehicles as any[]).filter((v: any) => {
          if (!v.nextMaintenanceDate) return false;
          return new Date(v.nextMaintenanceDate) <= nextWeek;
        }).length;

        const totalMileage = (myVehicles as any[]).reduce((sum, v: any) => sum + (v.mileage || 0), 0);

        setStats({
          totalDrivers: 1,
          totalVehicles: myVehicles.length,
          availableVehicles: (myVehicles as any[]).filter((v: any) => v.status === "AVAILABLE").length,
          activeDrivers: 1,
          vehiclesNeedingMaintenance,
          totalMileage,
          fleetHealth: 100,
        });

        setRecentDrivers([meDriver as any]);
        setRecentVehicles((myVehicles as any[]).slice(0, 5));
        return;
      }

      // ✅ OWNER : vehicles only (drivers forbidden chez toi)
      const vehiclesPromise = (isAdmin || isOwner) ? vehicleService.getAll() : Promise.resolve([]);
      const driversPromise = isAdmin ? driverService.getAll() : Promise.resolve([]);

      const [drivers, vehicles] = await Promise.all([driversPromise, vehiclesPromise]);

      const vehiclesNeedingMaintenance = (vehicles as any[]).filter((v: any) => {
        if (!v.nextMaintenanceDate) return false;
        return new Date(v.nextMaintenanceDate) <= nextWeek;
      }).length;

      const totalMileage = (vehicles as any[]).reduce((sum, v: any) => sum + (v.mileage || 0), 0);

      const fleetHealth = (vehicles as any[]).length > 0
        ? Math.max(0, Math.min(100, 100 - (vehiclesNeedingMaintenance / (vehicles as any[]).length) * 30))
        : 100;

      setStats({
        totalDrivers: (drivers as any[]).length,
        totalVehicles: (vehicles as any[]).length,
        availableVehicles: (vehicles as any[]).filter((v: any) => v.status === "AVAILABLE").length,
        activeDrivers: (drivers as any[]).filter((d: any) => d.status === "ACTIVE").length,
        vehiclesNeedingMaintenance,
        totalMileage,
        fleetHealth: Math.round(fleetHealth),
      });

      setRecentDrivers((drivers as any[]).slice(0, 5));
      setRecentVehicles((vehicles as any[]).slice(0, 5));
    } catch (err) {
      console.error(err);
      toastError?.("Failed to load dashboard data");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const quickActions = useMemo(() => {
    return isDriver
      ? [
          {
            title: "My Vehicles",
            description: "View assigned vehicles",
            icon: Car,
            color: "bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600",
            hoverColor: "hover:shadow-lg hover:shadow-green-500/25",
            action: () => router.push("/my-vehicles"),
          },
          {
            title: "My Profile",
            description: "View my information",
            icon: Users,
            color: "bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700",
            hoverColor: "hover:shadow-lg hover:shadow-blue-500/25",
            action: () => router.push("/profile"),
          },
        ]
      : [
          {
            title: "Dispatch Vehicle",
            description: "Assign trip to driver",
            icon: Route,
            color: "bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700",
            hoverColor: "hover:shadow-lg hover:shadow-blue-500/25",
            action: () => router.push("/dispatch"),
          },
          {
            title: "Add Vehicle",
            description: "Register new fleet vehicle",
            icon: Car,
            color: "bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600",
            hoverColor: "hover:shadow-lg hover:shadow-green-500/25",
            action: () => router.push("/vehicles/create"),
          },
          {
            title: "Schedule Maintenance",
            description: "Plan vehicle service",
            icon: Settings,
            color: "bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600",
            hoverColor: "hover:shadow-lg hover:shadow-amber-500/25",
            action: () => router.push("/maintenance"),
          },
          {
            title: "Fleet Analytics",
            description: "View performance reports",
            icon: BarChart3,
            color: "bg-gradient-to-r from-purple-500 via-purple-600 to-pink-600",
            hoverColor: "hover:shadow-lg hover:shadow-purple-500/25",
            action: () => router.push("/analytics"),
          },
        ];
  }, [isDriver, router]);

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse rounded-2xl bg-white p-6 shadow-lg border border-slate-200">
          <div className="h-6 w-48 rounded bg-slate-200" />
          <div className="mt-4 h-4 w-72 rounded bg-slate-200" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            {isDriver ? "Driver Dashboard" : "Fleet Dashboard"}
          </h1>
          <p className="mt-1 text-slate-600">
            {isDriver ? "Your assigned vehicles and status overview" : "Fleet overview and operations"}
          </p>
        </div>

        <button
          onClick={loadDashboardData}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-all"
        >
          <RefreshCcw className={isRefreshing ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
          Refresh
        </button>
      </div>

      {/* quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {quickActions.map((qa) => {
          const Icon = qa.icon;
          return (
            <button
              key={qa.title}
              onClick={qa.action}
              className={`rounded-2xl p-5 text-left text-white shadow-lg transition-all ${qa.color} ${qa.hoverColor}`}
            >
              <div className="flex items-center justify-between">
                <div className="text-lg font-bold">{qa.title}</div>
                <Icon className="h-6 w-6 opacity-90" />
              </div>
              <div className="mt-2 text-sm text-white/90">{qa.description}</div>
            </button>
          );
        })}
      </div>

      {/* simple stats row (same feeling design) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg">
          <div className="text-sm font-semibold text-slate-600">{isDriver ? "My Vehicles" : "Fleet Size"}</div>
          <div className="mt-2 text-3xl font-extrabold text-slate-900">{stats.totalVehicles}</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg">
          <div className="text-sm font-semibold text-slate-600">{isDriver ? "My Status" : "Active Drivers"}</div>
          <div className="mt-2 text-3xl font-extrabold text-slate-900">{stats.activeDrivers}</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg">
          <div className="text-sm font-semibold text-slate-600">Maintenance Due</div>
          <div className="mt-2 text-3xl font-extrabold text-slate-900">{stats.vehiclesNeedingMaintenance}</div>
        </div>
      </div>

      {/* recent vehicles list placeholder */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-lg overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center justify-between">
            <div className="font-bold text-slate-900">Recent Vehicles</div>
            <button
              onClick={() => router.push(isDriver ? "/my-vehicles" : "/vehicles")}
              className="text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              View all
            </button>
          </div>
        </div>
        <div className="p-5">
          {recentVehicles.length === 0 ? (
            <div className="text-slate-600">No vehicles found.</div>
          ) : (
            <div className="space-y-3">
              {recentVehicles.map((v: any) => (
                <div
                  key={v.id}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 hover:shadow-md transition-all"
                >
                  <div>
                    <div className="font-bold text-slate-900">{v.registrationNumber || "—"}</div>
                    <div className="text-sm text-slate-600">{v.brand} {v.model} • {v.status}</div>
                  </div>
                  <div className="text-sm font-semibold text-slate-700">{v.mileage ?? 0} km</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
