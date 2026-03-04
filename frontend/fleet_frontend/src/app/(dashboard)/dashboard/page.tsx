"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Car,
  Users,
  Route,
  BarChart3,
  Settings,
  RefreshCcw,
  Shield,
} from "lucide-react";

import { useAuth } from "@/contexts/authContext";
import { vehicleService } from "@/lib/services/vehicleService";
import { driverService } from "@/lib/services/driverService";
import { adminStatsService, type AdminStats } from "@/lib/services/adminStatsService";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from "recharts";

import { toastError } from "@/components/ui/Toast";
import type { Vehicle } from "@/types/vehicle";
import type { Driver } from "@/types/driver";

import { SubscriptionBanner } from "@/components/subscription/SubscriptionBanner";
import { isSubscriptionActive, isSubscriptionExpired } from "@/lib/subscription";

/* -------------------------------- utils -------------------------------- */
function cn(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

function calcFleetHealth(totalVehicles: number, maintenanceDue: number, outVehicles = 0) {
  if (!totalVehicles) return 100;
  const bad = maintenanceDue + outVehicles;
  const ratio = bad / totalVehicles;
  return Math.max(0, Math.min(100, Math.round(100 - ratio * 60)));
}

function Badge({
  label,
  tone = "ok",
}: {
  label: string;
  tone?: "ok" | "warn" | "danger";
}) {
  const cls =
    tone === "ok"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : tone === "warn"
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : "bg-rose-50 text-rose-700 border-rose-200";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-extrabold",
        cls
      )}
    >
      {label}
    </span>
  );
}

function StatusPill({ status }: { status: string }) {
  const s = String(status || "").toUpperCase();
  const cls =
    s === "AVAILABLE"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : s === "IN_USE" || s === "RESERVED"
      ? "bg-blue-50 text-blue-700 border-blue-200"
      : s === "UNDER_MAINTENANCE"
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : "bg-rose-50 text-rose-700 border-rose-200";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-extrabold",
        cls
      )}
    >
      {s.replaceAll("_", " ")}
    </span>
  );
}

function SessionCard({
  userEmail,
  role,
  vehiclesCount,
  fleetHealth,
  onLogout,
  onRefresh,
  refreshing,
}: {
  userEmail: string;
  role: string;
  vehiclesCount: number;
  fleetHealth: number;
  onLogout: () => void;
  onRefresh: () => void;
  refreshing: boolean;
}) {
  const healthTone = fleetHealth >= 80 ? "ok" : fleetHealth >= 55 ? "warn" : "danger";
  const healthLabel = fleetHealth >= 80 ? "Good" : fleetHealth >= 55 ? "Watch" : "Critical";

  return (
    <div className="rounded-3xl border border-slate-200 bg-white shadow-lg overflow-hidden">
      <div className="p-6 bg-gradient-to-r from-slate-50 to-white">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-extrabold text-slate-900">My Session</h2>
              <Badge label={role.replace("ROLE_", "")} tone="ok" />
              <Badge label={healthLabel} tone={healthTone} />
            </div>

            <p className="mt-1 text-sm font-semibold text-slate-600">
              Signed in as <span className="text-slate-900">{userEmail}</span>
            </p>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="text-xs font-bold text-slate-500">Assigned Vehicles</div>
                <div className="mt-1 text-2xl font-extrabold text-slate-900">{vehiclesCount}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="text-xs font-bold text-slate-500">Fleet Health</div>
                <div className="mt-1 text-2xl font-extrabold text-slate-900">{fleetHealth}%</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="text-xs font-bold text-slate-500">Access</div>
                <div className="mt-1 text-2xl font-extrabold text-slate-900">Driver</div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-extrabold text-slate-700 shadow-sm hover:bg-slate-50 transition-all"
            >
              <RefreshCcw className={refreshing ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
              Refresh
            </button>

            <button
              onClick={onLogout}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-900 px-4 py-2 text-sm font-extrabold text-white shadow-sm hover:bg-slate-800 transition-all"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 pt-0">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-700">
          Tip: keep your profile updated, and check maintenance alerts to avoid unexpected stops.
        </div>
      </div>
    </div>
  );
}

/* -------------------------------- types -------------------------------- */
interface DashboardStats {
  totalDrivers: number;
  totalVehicles: number;
  availableVehicles: number;
  activeDrivers: number;
  vehiclesNeedingMaintenance: number;
  totalMileage: number;
  fleetHealth: number;
}

type QuickAction = {
  title: string;
  description: string;
  icon: any;
  color: string;
  hoverColor: string;
  action: () => void;
};

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();

  const role = user?.role;
  const isAdmin = role === "ROLE_ADMIN";
  const isOwner = role === "ROLE_OWNER";
  const isDriver = role === "ROLE_DRIVER";

  const ownerActive = isOwner && isSubscriptionActive(user ?? undefined);
  const ownerExpired = isOwner && isSubscriptionExpired(user ?? undefined);

  const [stats, setStats] = useState<DashboardStats>({
    totalDrivers: 0,
    totalVehicles: 0,
    availableVehicles: 0,
    activeDrivers: 0,
    vehiclesNeedingMaintenance: 0,
    totalMileage: 0,
    fleetHealth: 100,
  });

  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [recentDrivers, setRecentDrivers] = useState<Driver[]>([]);
  const [recentVehicles, setRecentVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadDashboardData = async () => {
    setIsRefreshing(true);
    try {
      // ✅ OWNER expiré => dashboard lite
      if (isOwner && !ownerActive) {
        setStats({
          totalDrivers: 0,
          totalVehicles: 0,
          availableVehicles: 0,
          activeDrivers: 0,
          vehiclesNeedingMaintenance: 0,
          totalMileage: 0,
          fleetHealth: 0,
        });
        setAdminStats(null);
        setRecentDrivers([]);
        setRecentVehicles([]);
        return;
      }

      const now = new Date();
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      // ✅ ADMIN: analytics only (NO lists)
      if (isAdmin) {
        const a = await adminStatsService.get();
        setAdminStats(a);

        setStats({
          totalDrivers: a.driversCount,
          totalVehicles: a.vehiclesCount,
          availableVehicles: a.availableVehicles,
          activeDrivers: a.activeDrivers,
          vehiclesNeedingMaintenance: a.vehiclesNeedingMaintenance,
          totalMileage: a.totalMileage,
          fleetHealth: calcFleetHealth(a.vehiclesCount, a.vehiclesNeedingMaintenance, a.outVehicles),
        });

        setRecentDrivers([]);
        setRecentVehicles([]);
        return;
      }

      // ✅ DRIVER: my profile + my vehicles
      if (isDriver) {
        const [, myVehicles] = await Promise.all([driverService.me(), vehicleService.getMine()]);

        const vehiclesNeedingMaintenance = (myVehicles as any[]).filter((v: any) => {
          if (!v.nextMaintenanceDate) return false;
          return new Date(v.nextMaintenanceDate) <= nextWeek;
        }).length;

        const totalMileage = (myVehicles as any[]).reduce(
          (sum, v: any) => sum + (v.mileage || 0),
          0
        );

        setStats({
          totalDrivers: 1,
          totalVehicles: myVehicles.length,
          availableVehicles: (myVehicles as any[]).filter((v: any) => v.status === "AVAILABLE").length,
          activeDrivers: 1,
          vehiclesNeedingMaintenance,
          totalMileage,
          fleetHealth: 100,
        });

        setAdminStats(null);
        setRecentDrivers([]);
        setRecentVehicles((myVehicles as any[]).slice(0, 5));
        return;
      }

      // ✅ OWNER: vehicles only
      if (isOwner) {
        const vehicles = await vehicleService.getAll(); // backend must return only owner’s vehicles

        const vehiclesNeedingMaintenance = (vehicles as any[]).filter((v: any) => {
          if (!v.nextMaintenanceDate) return false;
          return new Date(v.nextMaintenanceDate) <= nextWeek;
        }).length;

        const totalMileage = (vehicles as any[]).reduce(
          (sum, v: any) => sum + (v.mileage || 0),
          0
        );

        const fleetHealth = vehicles.length
          ? Math.max(0, Math.min(100, 100 - (vehiclesNeedingMaintenance / vehicles.length) * 30))
          : 100;

        setStats({
          totalDrivers: 0,
          totalVehicles: vehicles.length,
          availableVehicles: (vehicles as any[]).filter((v: any) => v.status === "AVAILABLE").length,
          activeDrivers: 0,
          vehiclesNeedingMaintenance,
          totalMileage,
          fleetHealth: Math.round(fleetHealth),
        });

        setAdminStats(null);
        setRecentDrivers([]);
        setRecentVehicles((vehicles as any[]).slice(0, 8));
        return;
      }

      // fallback
      setStats((p) => ({ ...p, fleetHealth: 100 }));
      setAdminStats(null);
      setRecentDrivers([]);
      setRecentVehicles([]);
    } catch (err) {
      console.error(err);
      toastError?.("Failed to load dashboard data");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  const quickActions: QuickAction[] = useMemo(() => {
    if (isDriver) {
      return [
        {
          title: "My Session",
          description: "Status, access & account actions",
          icon: Shield,
          color: "bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900",
          hoverColor: "hover:shadow-lg hover:shadow-slate-900/20",
          action: () => router.push("/profile"),
        },
        {
          title: "My Vehicles",
          description: "View assigned vehicles",
          icon: Car,
          color: "bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600",
          hoverColor: "hover:shadow-lg hover:shadow-green-500/25",
          action: () => router.push("/my-vehicles"),
        },
      ];
    }

    if (isAdmin) {
      return [
        {
          title: "Reports",
          description: "View analytics and KPIs",
          icon: BarChart3,
          color: "bg-gradient-to-r from-purple-500 via-purple-600 to-pink-600",
          hoverColor: "hover:shadow-lg hover:shadow-purple-500/25",
          action: () => router.push("/reports"),
        },
      ];
    }

    if (isOwner && !ownerActive) {
      return [
        {
          title: "Activate Subscription",
          description: "Follow payment steps to unlock features",
          icon: BarChart3,
          color: "bg-gradient-to-r from-red-500 via-rose-500 to-red-600",
          hoverColor: "hover:shadow-lg hover:shadow-red-500/25",
          action: () => router.push("/owner/billing"),
        },
        {
          title: "Billing",
          description: "Offline payment instructions",
          icon: Settings,
          color: "bg-gradient-to-r from-slate-800 via-slate-900 to-black",
          hoverColor: "hover:shadow-lg hover:shadow-black/25",
          action: () => router.push("/owner/billing"),
        },
      ];
    }

    // ✅ OWNER (active)
    return [
      {
        title: "Dispatch Vehicle",
        description: "Assign mission to driver",
        icon: Route,
        color: "bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700",
        hoverColor: "hover:shadow-lg hover:shadow-blue-500/25",
        action: () => router.push("/missions"),
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
        description: "Reports and KPIs",
        icon: BarChart3,
        color: "bg-gradient-to-r from-purple-500 via-purple-600 to-pink-600",
        hoverColor: "hover:shadow-lg hover:shadow-purple-500/25",
        action: () => router.push("/analytics"),
      },
    ];
  }, [isDriver, isAdmin, isOwner, ownerActive, router]);

  // ✅ Admin charts data
  const adminPieData = useMemo(() => {
    if (!adminStats) return [];
    return [
      { name: "Available", value: adminStats.availableVehicles },
      { name: "In Service", value: adminStats.inServiceVehicles },
      { name: "Out/Broken", value: adminStats.outVehicles },
    ];
  }, [adminStats]);

  const adminBarData = useMemo(() => {
    if (!adminStats) return [];
    return [
      { name: "Maintenance due (7d)", value: adminStats.vehiclesNeedingMaintenance },
      { name: "Out/Broken", value: adminStats.outVehicles },
    ];
  }, [adminStats]);

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
      {/* header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            {isDriver ? "Driver Dashboard" : isAdmin ? "Admin Dashboard" : ownerExpired ? "Dashboard (Limited)" : "Owner Dashboard"}
          </h1>
          <p className="mt-1 text-slate-600">
            {isDriver
              ? "Your session overview and assigned vehicles summary"
              : isAdmin
              ? "Platform analytics (read-only)"
              : ownerExpired
              ? "Your trial ended. Activate subscription to unlock features."
              : "Fleet overview and operations"}
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

      {/* Subscription banner (optional) */}
      

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {quickActions.map((qa) => {
          const Icon = qa.icon;
          return (
            <button
              key={qa.title}
              onClick={qa.action}
              className={cn(
                "rounded-2xl p-5 text-left text-white shadow-lg transition-all",
                qa.color,
                qa.hoverColor
              )}
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

      {/* ✅ DRIVER: My Session section */}
      {isDriver && (
        <SessionCard
          userEmail={user?.email || "—"}
          role={user?.role || "ROLE_DRIVER"}
          vehiclesCount={stats.totalVehicles}
          fleetHealth={stats.fleetHealth}
          onRefresh={loadDashboardData}
          refreshing={isRefreshing}
          onLogout={() => {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            window.location.href = "/login";
          }}
        />
      )}

      {/* stats row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg">
          <div className="text-sm font-semibold text-slate-600">
            {isDriver ? "Assigned Vehicles" : "Vehicles"}
          </div>
          <div className="mt-2 text-3xl font-extrabold text-slate-900">{stats.totalVehicles}</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg">
          <div className="text-sm font-semibold text-slate-600">
            {isAdmin ? "Owners" : isDriver ? "My Status" : "Available Vehicles"}
          </div>
          <div className="mt-2 text-3xl font-extrabold text-slate-900">
            {isAdmin ? (adminStats?.ownersCount ?? 0) : isDriver ? 1 : stats.availableVehicles}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg">
          <div className="text-sm font-semibold text-slate-600">
            {isAdmin ? "Drivers" : "Maintenance Due"}
          </div>
          <div className="mt-2 text-3xl font-extrabold text-slate-900">
            {isAdmin ? stats.totalDrivers : stats.vehiclesNeedingMaintenance}
          </div>
          {isOwner && !isAdmin && (
            <div className="mt-1 text-xs font-semibold text-slate-500">Next 7 days</div>
          )}
          {isAdmin && <div className="mt-1 text-xs font-semibold text-slate-500">Total drivers</div>}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-slate-600">Fleet Health</div>
            <Shield className="h-5 w-5 text-slate-400" />
          </div>
          <div className="mt-2 text-3xl font-extrabold text-slate-900">{stats.fleetHealth}%</div>
          <div className="mt-3 h-2 w-full rounded bg-slate-100">
            <div className="h-2 rounded bg-slate-900" style={{ width: `${stats.fleetHealth}%` }} />
          </div>
        </div>
      </div>

      {/* ✅ OWNER alert card */}
      {isOwner && ownerActive && stats.vehiclesNeedingMaintenance > 0 && (
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 shadow-lg">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-extrabold text-amber-800">Maintenance Alert</div>
              <div className="mt-1 text-sm font-semibold text-amber-800/80">
                {stats.vehiclesNeedingMaintenance} vehicle(s) need maintenance in the next 7 days.
              </div>
            </div>
            <button
              onClick={() => router.push("/maintenance")}
              className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-extrabold text-white hover:bg-slate-800 transition-all"
            >
              Open Maintenance
            </button>
          </div>
        </div>
      )}

      {/* ✅ ADMIN charts only */}
      {isAdmin && adminStats && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-extrabold text-slate-900">Vehicle Status</div>
                <div className="mt-1 text-xs font-semibold text-slate-500">
                  Distribution across the platform
                </div>
              </div>
              <Badge label={`Total: ${adminStats.vehiclesCount}`} tone="ok" />
            </div>

            <div className="mt-4 h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={adminPieData} dataKey="value" nameKey="name" outerRadius={110} />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-extrabold text-slate-900">Alerts</div>
                <div className="mt-1 text-xs font-semibold text-slate-500">
                  Maintenance & critical vehicles
                </div>
              </div>
              <Badge label={`Out: ${adminStats.outVehicles}`} tone={adminStats.outVehicles ? "warn" : "ok"} />
            </div>

            <div className="mt-4 h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={adminBarData}>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ✅ OWNER vehicles list */}
      {isOwner && ownerActive && (
        <div className="rounded-3xl border border-slate-200 bg-white shadow-lg overflow-hidden">
          <div className="p-6 border-b border-slate-200 bg-slate-50">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div>
                <div className="text-lg font-extrabold text-slate-900">Fleet Vehicles</div>
                <div className="mt-1 text-sm font-semibold text-slate-600">
                  Latest vehicles in your fleet (quick view).
                </div>
              </div>
              <button
                onClick={() => router.push("/vehicles")}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-extrabold text-slate-700 hover:bg-slate-50 transition-all"
              >
                View all
              </button>
            </div>
          </div>

          <div className="p-6">
            {recentVehicles.length === 0 ? (
              <div className="text-slate-600">No vehicles found.</div>
            ) : (
              <div className="space-y-3">
                {recentVehicles.map((v: any) => {
                  const dueSoon =
                    v.nextMaintenanceDate &&
                    new Date(v.nextMaintenanceDate) <= new Date(Date.now() + 7 * 86400000);

                  return (
                    <div
                      key={v.id}
                      className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-2">
                          <Car className="h-5 w-5 text-slate-600" />
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="font-extrabold text-slate-900">{v.registrationNumber || "—"}</div>
                            <StatusPill status={v.status} />
                            {dueSoon ? <Badge label="Maintenance soon" tone="warn" /> : null}
                          </div>

                          <div className="mt-1 text-sm font-semibold text-slate-600">
                            {v.brand} {v.model} • Year {v.year ?? "—"}
                          </div>

                          {v.nextMaintenanceDate ? (
                            <div className="mt-1 text-xs font-semibold text-slate-500">
                              Next maintenance: {new Date(v.nextMaintenanceDate).toLocaleDateString()}
                            </div>
                          ) : (
                            <div className="mt-1 text-xs font-semibold text-slate-500">Next maintenance: —</div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between md:justify-end gap-4">
                        <div className="text-sm font-extrabold text-slate-900">
                          {(v.mileage ?? 0).toLocaleString()} km
                        </div>

                        <button
                          onClick={() => router.push(`/vehicles/${v.id}`)}
                          className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-extrabold text-slate-700 hover:bg-slate-50 transition-all"
                        >
                          View
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}