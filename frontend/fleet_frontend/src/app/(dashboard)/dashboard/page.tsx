"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/contexts/authContext";
import { vehicleService } from "@/lib/services/vehicleService";
import { driverService } from "@/lib/services/driverService";
import {
  adminStatsService,
  type AdminStats,
} from "@/lib/services/adminStatsService";
import { toastError } from "@/components/ui/Toast";
import type { Vehicle } from "@/types/vehicle";
import type { Driver } from "@/types/driver";
import {
  isSubscriptionActive,
  isSubscriptionExpired,
} from "@/lib/subscription";

import DashboardView, {
  type DashboardStats,
  type QuickAction,
} from "./DashboardView";

import {
  Route,
  BarChart3,
  Settings,
  Car,
  Shield,
} from "lucide-react";

function calcFleetHealth(
  totalVehicles: number,
  maintenanceDue: number,
  outVehicles = 0
) {
  if (!totalVehicles) return 100;
  const bad = maintenanceDue + outVehicles;
  const ratio = bad / totalVehicles;
  return Math.max(0, Math.min(100, Math.round(100 - ratio * 60)));
}

export default function Page() {
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
      // OWNER expiré => dashboard limité
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

      // ADMIN
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
          fleetHealth: calcFleetHealth(
            a.vehiclesCount,
            a.vehiclesNeedingMaintenance,
            a.outVehicles
          ),
        });

        setRecentDrivers([]);
        setRecentVehicles([]);
        return;
      }

      // DRIVER
      if (isDriver) {
        await driverService.me();

        setStats({
          totalDrivers: 1,
          totalVehicles: 0,
          availableVehicles: 0,
          activeDrivers: 1,
          vehiclesNeedingMaintenance: 0,
          totalMileage: 0,
          fleetHealth: 100,
        });

        setAdminStats(null);
        setRecentDrivers([]);
        setRecentVehicles([]);
        return;
      }

      // OWNER
      if (isOwner) {
        const vehicles = await vehicleService.getAll();

        const vehiclesNeedingMaintenance = (vehicles as any[]).filter(
          (v: any) => {
            if (!v.nextMaintenanceDate) return false;
            return new Date(v.nextMaintenanceDate) <= nextWeek;
          }
        ).length;

        const totalMileage = (vehicles as any[]).reduce(
          (sum, v: any) => sum + (v.mileage || 0),
          0
        );

        const fleetHealth = vehicles.length
          ? Math.max(
              0,
              Math.min(
                100,
                100 - (vehiclesNeedingMaintenance / vehicles.length) * 30
              )
            )
          : 100;

        setStats({
          totalDrivers: 0,
          totalVehicles: vehicles.length,
          availableVehicles: (vehicles as any[]).filter(
            (v: any) => v.status === "AVAILABLE"
          ).length,
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
      setStats((prev) => ({ ...prev, fleetHealth: 100 }));
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
          action: () => router.push("/my-missions"),
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
      {
        name: "Maintenance due (7d)",
        value: adminStats.vehiclesNeedingMaintenance,
      },
      { name: "Out/Broken", value: adminStats.outVehicles },
    ];
  }, [adminStats]);

  return (
    <DashboardView
      user={user}
      isAdmin={isAdmin}
      isOwner={isOwner}
      isDriver={isDriver}
      ownerActive={ownerActive}
      ownerExpired={ownerExpired}
      stats={stats}
      adminStats={adminStats}
      recentDrivers={recentDrivers}
      recentVehicles={recentVehicles}
      loading={loading}
      isRefreshing={isRefreshing}
      quickActions={quickActions}
      adminPieData={adminPieData}
      adminBarData={adminBarData}
      onRefresh={loadDashboardData}
      onNavigate={router.push}
    />
  );
}