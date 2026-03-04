"use client";

import { useEffect, useMemo, useState } from "react";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { AdminOnly } from "@/components/layout/AdminOnly";
import { AdminShell } from "@/components/admin/AdminShell";
import { toastError } from "@/components/ui/Toast";
import {
  RefreshCcw,
  Users,
  Car,
  Gauge,
  Wrench,
  Shield,
  Activity,
  AlertTriangle,
} from "lucide-react";
import { adminStatsService } from "@/lib/services/adminStatsService";

type AdminStats = {
  ownersCount: number;
  vehiclesCount: number;
  availableVehicles: number;
  inServiceVehicles: number;
  outVehicles: number;
  driversCount: number;
  activeDrivers: number;
  vehiclesNeedingMaintenance: number;
  totalMileage: number;
};

function cn(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

function format(n: number) {
  try {
    return n.toLocaleString();
  } catch {
    return String(n);
  }
}

function StatCard({
  title,
  value,
  icon: Icon,
  hint,
}: {
  title: string;
  value: React.ReactNode;
  icon: any;
  hint?: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-600">{title}</div>
          <div className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
            {value}
          </div>
          {hint ? (
            <div className="mt-2 text-xs font-semibold text-slate-500">{hint}</div>
          ) : null}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-2.5">
          <Icon className="h-5 w-5 text-slate-500" />
        </div>
      </div>
    </div>
  );
}

function MiniCard({
  title,
  value,
  icon: Icon,
  badge,
}: {
  title: string;
  value: React.ReactNode;
  icon?: any;
  badge?: { label: string; tone?: "ok" | "warn" | "danger" };
}) {
  const tone = badge?.tone ?? "ok";
  const badgeClass =
    tone === "ok"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : tone === "warn"
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : "bg-rose-50 text-rose-700 border-rose-200";

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-slate-600">{title}</div>
        {badge ? (
          <span className={cn("rounded-full border px-3 py-1 text-xs font-extrabold", badgeClass)}>
            {badge.label}
          </span>
        ) : Icon ? (
          <Icon className="h-5 w-5 text-slate-400" />
        ) : null}
      </div>

      <div className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">{value}</div>
    </div>
  );
}

export default function AdminOwnersPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  async function load() {
    setRefreshing(true);
    setLoading(true);
    try {
      const data = await adminStatsService.get();
      setStats(data);
      setLastUpdated(new Date());
    } catch (e: any) {
      toastError(e?.response?.data?.message || "Erreur chargement statistiques");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const health = useMemo(() => {
    if (!stats || stats.vehiclesCount === 0) return 100;
    const bad = stats.vehiclesNeedingMaintenance + stats.outVehicles;
    const ratio = bad / stats.vehiclesCount;
    return Math.max(0, Math.min(100, Math.round(100 - ratio * 60)));
  }, [stats]);

  const healthTone = useMemo<"ok" | "warn" | "danger">(() => {
    if (health >= 80) return "ok";
    if (health >= 55) return "warn";
    return "danger";
  }, [health]);

  const healthLabel = useMemo(() => {
    if (healthTone === "ok") return "Good";
    if (healthTone === "warn") return "Watch";
    return "Critical";
  }, [healthTone]);

  const healthBarClass =
    healthTone === "ok"
      ? "bg-emerald-600"
      : healthTone === "warn"
      ? "bg-amber-500"
      : "bg-rose-600";

  const alertsCount = useMemo(() => {
    if (!stats) return 0;
    return stats.vehiclesNeedingMaintenance + stats.outVehicles;
  }, [stats]);

  return (
    <ProtectedRoute requiredRoles={["ROLE_ADMIN"]}>
      <AdminOnly>
        <AdminShell
          title="Platform Analytics"
          subtitle="Admin sees only global statistics (no owner vehicle details)."
        >
          <div className="space-y-6">
            {/* Header card */}
            <div className="rounded-3xl border border-slate-200 bg-white shadow-lg overflow-hidden">
              <div className="p-6 bg-gradient-to-r from-slate-50 to-white">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
                      Platform Analytics
                    </h1>
                    <p className="mt-1 text-slate-600">
                      Overview KPIs for owners, vehicles, drivers, and maintenance.
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-extrabold text-slate-700">
                        <Activity className="h-4 w-4 text-slate-500" />
                        Read-only dashboard
                      </span>

                      <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-extrabold text-slate-700">
                        <AlertTriangle className="h-4 w-4 text-slate-500" />
                        Alerts: {stats ? alertsCount : "—"}
                      </span>

                      {lastUpdated ? (
                        <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-extrabold text-slate-700">
                          Updated: {lastUpdated.toLocaleTimeString()}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <button
                    onClick={load}
                    className={cn(
                      "inline-flex items-center justify-center gap-2 rounded-2xl",
                      "border border-slate-200 bg-white px-4 py-2 text-sm font-extrabold text-slate-700",
                      "shadow-sm hover:bg-slate-50 transition-all"
                    )}
                  >
                    <RefreshCcw className={refreshing ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
                    Refresh
                  </button>
                </div>
              </div>
            </div>

            {/* Skeleton */}
            {loading || !stats ? (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="animate-pulse rounded-3xl border border-slate-200 bg-white p-5 shadow-lg"
                  >
                    <div className="h-4 w-28 rounded bg-slate-200" />
                    <div className="mt-3 h-8 w-20 rounded bg-slate-200" />
                    <div className="mt-3 h-3 w-36 rounded bg-slate-200" />
                  </div>
                ))}
              </div>
            ) : (
              <>
                {/* KPI top */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <StatCard
                    title="Owners"
                    value={format(stats.ownersCount)}
                    icon={Users}
                    hint="Registered fleet owners"
                  />
                  <StatCard
                    title="Vehicles"
                    value={format(stats.vehiclesCount)}
                    icon={Car}
                    hint="Total vehicles tracked"
                  />
                  <StatCard
                    title="Total Mileage"
                    value={`${format(stats.totalMileage)} km`}
                    icon={Gauge}
                    hint="Sum of all odometers"
                  />
                  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-600">Fleet Health</div>
                        <div className="mt-2 flex items-end gap-2">
                          <div className="text-3xl font-extrabold tracking-tight text-slate-900">
                            {health}%
                          </div>
                          <span
                            className={cn(
                              "rounded-full border px-3 py-1 text-xs font-extrabold",
                              healthTone === "ok"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : healthTone === "warn"
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-rose-50 text-rose-700 border-rose-200"
                            )}
                          >
                            {healthLabel}
                          </span>
                        </div>

                        <div className="mt-3 h-2 w-full rounded bg-slate-100">
                          <div
                            className={cn("h-2 rounded", healthBarClass)}
                            style={{ width: `${health}%` }}
                          />
                        </div>

                        <div className="mt-2 text-xs font-semibold text-slate-500">
                          Based on maintenance due + out-of-service.
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-2.5">
                        <Shield className="h-5 w-5 text-slate-500" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Vehicle status */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <MiniCard
                    title="Available"
                    value={format(stats.availableVehicles)}
                    badge={{ label: "Ready", tone: "ok" }}
                  />
                  <MiniCard
                    title="In service"
                    value={format(stats.inServiceVehicles)}
                    badge={{ label: "Running", tone: "ok" }}
                  />
                  <MiniCard
                    title="Out / Broken"
                    value={format(stats.outVehicles)}
                    badge={{ label: "Critical", tone: stats.outVehicles > 0 ? "danger" : "ok" }}
                  />
                  <MiniCard
                    title="Maintenance due"
                    value={format(stats.vehiclesNeedingMaintenance)}
                    icon={Wrench}
                    badge={{
                      label: stats.vehiclesNeedingMaintenance > 0 ? "Action" : "OK",
                      tone: stats.vehiclesNeedingMaintenance > 0 ? "warn" : "ok",
                    }}
                  />
                </div>

                {/* Drivers */}
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-lg font-extrabold text-slate-900">Drivers</div>
                      <div className="mt-1 text-sm font-semibold text-slate-600">
                        Global drivers KPI.
                      </div>
                    </div>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-extrabold text-slate-700">
                      Active rate:{" "}
                      {stats.driversCount
                        ? Math.round((stats.activeDrivers / stats.driversCount) * 100)
                        : 0}
                      %
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                      <div className="text-sm font-semibold text-slate-600">Total Drivers</div>
                      <div className="mt-2 text-3xl font-extrabold text-slate-900">
                        {format(stats.driversCount)}
                      </div>
                      <div className="mt-2 text-xs font-semibold text-slate-500">
                        All registered driver profiles
                      </div>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                      <div className="text-sm font-semibold text-slate-600">Active Drivers</div>
                      <div className="mt-2 text-3xl font-extrabold text-slate-900">
                        {format(stats.activeDrivers)}
                      </div>
                      <div className="mt-2 text-xs font-semibold text-slate-500">
                        Currently active in the platform
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </AdminShell>
      </AdminOnly>
    </ProtectedRoute>
  );
}