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
  Users,
  Wrench,
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
        setRecentVehicles([]); // important: ne plus afficher les voitures
        return;
      }

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
          color:
            "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950",
          hoverColor: "hover:shadow-slate-900/20",
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
          color:
            "bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600",
          hoverColor: "hover:shadow-purple-500/25",
          action: () => router.push("/reports"),
        },
      ];
    }

    if (isOwner && !ownerActive) {
      return [
        {
          title: "Activate Subscription",
          description: "Unlock the full dashboard and owner features",
          icon: BarChart3,
          color: "bg-gradient-to-br from-rose-500 via-red-500 to-red-700",
          hoverColor: "hover:shadow-red-500/25",
          action: () => router.push("/owner/billing"),
        },
        {
          title: "Billing",
          description: "Check your payment instructions",
          icon: Settings,
          color:
            "bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950",
          hoverColor: "hover:shadow-black/25",
          action: () => router.push("/owner/billing"),
        },
      ];
    }

    return [
      {
        title: "Manage Missions",
        description: "Create and assign missions quickly",
        icon: Route,
        color: "bg-gradient-to-br from-blue-600 via-sky-600 to-cyan-600",
        hoverColor: "hover:shadow-blue-500/25",
        action: () => router.push("/missions"),
      },
      {
        title: "Drivers",
        description: "Manage your drivers and access",
        icon: Users,
        color:
          "bg-gradient-to-br from-emerald-600 via-green-600 to-teal-600",
        hoverColor: "hover:shadow-green-500/25",
        action: () => router.push("/drivers"),
      },
      {
        title: "Maintenance",
        description: "Follow maintenance schedules and alerts",
        icon: Wrench,
        color:
          "bg-gradient-to-br from-amber-500 via-orange-500 to-yellow-500",
        hoverColor: "hover:shadow-amber-500/25",
        action: () => router.push("/maintenance"),
      },
      {
        title: "Vehicles",
        description: "Open vehicle management page",
        icon: Car,
        color:
          "bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900",
        hoverColor: "hover:shadow-slate-700/25",
        action: () => router.push("/vehicles"),
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