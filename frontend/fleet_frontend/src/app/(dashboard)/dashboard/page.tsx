"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  Car,
  Route,
  Settings,
  Shield,
  Users,
  Wrench,
} from "lucide-react";

import { useAuth } from "@/contexts/authContext";
import { driverService } from "@/lib/services/driverService";
import {
  adminStatsService,
  type AdminStats,
} from "@/lib/services/adminStatsService";
import { dashboardService } from "@/lib/services/dashboardService";
import {
  subscribeOwnerDashboardKpi,
  unsubscribeOwnerDashboardKpi,
} from "@/lib/websocket";
import { toastError } from "@/components/ui/Toast";
import type { DashboardKpiDTO } from "@/types/dashboard";
import type { Driver } from "@/types/driver";
import type { Vehicle } from "@/types/vehicle";
import {
  isSubscriptionActive,
  isSubscriptionExpired,
} from "@/lib/subscription";

import DashboardView, {
  type DashboardStats,
  type QuickAction,
} from "./DashboardView";

const emptyKpi: DashboardKpiDTO = {
  totalVehicles: 0,
  availableVehicles: 0,
  inUseVehicles: 0,
  maintenanceVehicles: 0,
  reservedVehicles: 0,
  outOfServiceVehicles: 0,

  plannedMissions: 0,
  activeMissions: 0,
  completedMissions: 0,
  canceledMissions: 0,

  openIncidents: 0,
  inProgressIncidents: 0,
  resolvedIncidents: 0,
  criticalIncidents: 0,

  plannedMaintenances: 0,
  inProgressMaintenances: 0,
  doneMaintenances: 0,
  overdueMaintenances: 0,
  canceledMaintenances: 0,

  maintenanceTotalCost: 0,

  criticalAlertsToday: 0,
  warningAlertsToday: 0,
};

function calcFleetHealth(kpi: DashboardKpiDTO) {
  if (!kpi.totalVehicles) return 100;

  const risk =
    kpi.outOfServiceVehicles +
    kpi.maintenanceVehicles +
    kpi.openIncidents +
    kpi.criticalAlertsToday +
    kpi.overdueMaintenances;

  return Math.max(
    0,
    Math.min(100, Math.round(100 - (risk / kpi.totalVehicles) * 14))
  );
}

export default function Page() {
  const router = useRouter();
  const { user } = useAuth();

  const role = user?.role;
  const isAdmin = role === "ROLE_ADMIN";
  const isOwner = role === "ROLE_OWNER";
  const isDriver = role === "ROLE_DRIVER";

  const ownerId = user?.id ? Number(user.id) : null;
  const ownerActive = isOwner && isSubscriptionActive(user ?? undefined);
  const ownerExpired = isOwner && isSubscriptionExpired(user ?? undefined);

  const [kpi, setKpi] = useState<DashboardKpiDTO>(emptyKpi);

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

  const syncStatsFromKpi = (data: DashboardKpiDTO) => {
    setStats({
      totalDrivers: 0,
      totalVehicles: data.totalVehicles,
      availableVehicles: data.availableVehicles,
      activeDrivers: 0,
      vehiclesNeedingMaintenance:
        data.plannedMaintenances + data.overdueMaintenances,
      totalMileage: 0,
      fleetHealth: calcFleetHealth(data),
    });
  };

  const loadDashboardData = useCallback(async () => {
    setIsRefreshing(true);

    try {
      if (isOwner && !ownerActive) {
        setKpi(emptyKpi);
        syncStatsFromKpi(emptyKpi);
        setAdminStats(null);
        setRecentDrivers([]);
        setRecentVehicles([]);
        return;
      }

      if (isOwner && ownerActive) {
        const data = await dashboardService.getOwnerKpi();
        setKpi(data);
        syncStatsFromKpi(data);
        setAdminStats(null);
        setRecentDrivers([]);
        setRecentVehicles([]);
        return;
      }

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
          fleetHealth: 100,
        });

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
        return;
      }
    } catch (err) {
      console.error(err);
      toastError?.("Failed to load dashboard data");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [isOwner, ownerActive, isAdmin, isDriver]);

  useEffect(() => {
    setLoading(true);
    loadDashboardData();
  }, [role, loadDashboardData]);

  useEffect(() => {
    if (!isOwner || !ownerActive || !ownerId) return;

    subscribeOwnerDashboardKpi<DashboardKpiDTO>(ownerId, (data) => {
      setKpi(data);
      syncStatsFromKpi(data);
    });

    return () => {
      unsubscribeOwnerDashboardKpi(ownerId);
    };
  }, [isOwner, ownerActive, ownerId]);

  const quickActions: QuickAction[] = useMemo(() => {
    if (isDriver) {
      return [
        {
          title: "My Session",
          description: "Status, access & account actions",
          icon: Shield,
          color: "bg-gradient-to-br from-slate-800 to-slate-950",
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
          color: "bg-gradient-to-br from-violet-600 to-fuchsia-600",
          hoverColor: "hover:shadow-purple-500/25",
          action: () => router.push("/reports"),
        },
      ];
    }

    if (isOwner && !ownerActive) {
      return [
        {
          title: "Activate Subscription",
          description: "Unlock owner features",
          icon: BarChart3,
          color: "bg-gradient-to-br from-rose-500 to-red-700",
          hoverColor: "hover:shadow-red-500/25",
          action: () => router.push("/owner/billing"),
        },
        {
          title: "Billing",
          description: "Check your payment instructions",
          icon: Settings,
          color: "bg-gradient-to-br from-slate-800 to-slate-950",
          hoverColor: "hover:shadow-black/25",
          action: () => router.push("/owner/billing"),
        },
      ];
    }

    return [
      {
        title: "Missions",
        description: "Create and assign missions",
        icon: Route,
        color: "bg-gradient-to-br from-blue-600 to-cyan-600",
        hoverColor: "hover:shadow-blue-500/25",
        action: () => router.push("/missions"),
      },
      {
        title: "Drivers",
        description: "Manage drivers",
        icon: Users,
        color: "bg-gradient-to-br from-emerald-600 to-teal-600",
        hoverColor: "hover:shadow-green-500/25",
        action: () => router.push("/drivers"),
      },
      {
        title: "Maintenance",
        description: "Plan interventions",
        icon: Wrench,
        color: "bg-gradient-to-br from-amber-500 to-orange-600",
        hoverColor: "hover:shadow-amber-500/25",
        action: () => router.push("/maintenance"),
      },
      {
        title: "Vehicles",
        description: "Manage fleet vehicles",
        icon: Car,
        color: "bg-gradient-to-br from-slate-700 to-slate-950",
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
        name: "Maintenance due",
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
      kpi={kpi}
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