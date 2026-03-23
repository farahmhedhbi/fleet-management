"use client";

import {
  Car,
  RefreshCcw,
  Shield,
} from "lucide-react";

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

import type { AdminStats } from "@/lib/services/adminStatsService";
import type { Vehicle } from "@/types/vehicle";
import type { Driver } from "@/types/driver";

function cn(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export interface DashboardStats {
  totalDrivers: number;
  totalVehicles: number;
  availableVehicles: number;
  activeDrivers: number;
  vehiclesNeedingMaintenance: number;
  totalMileage: number;
  fleetHealth: number;
}

export type QuickAction = {
  title: string;
  description: string;
  icon: any;
  color: string;
  hoverColor: string;
  action: () => void;
};

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
  onRefresh,
  refreshing,
}: {
  userEmail: string;
  role: string;
  vehiclesCount: number;
  fleetHealth: number;
  onRefresh: () => void;
  refreshing: boolean;
}) {
  const healthTone =
    fleetHealth >= 80 ? "ok" : fleetHealth >= 55 ? "warn" : "danger";
  const healthLabel =
    fleetHealth >= 80 ? "Good" : fleetHealth >= 55 ? "Watch" : "Critical";

  return (
    <div className="rounded-3xl border border-slate-200 bg-white shadow-lg overflow-hidden">
      <div className="p-6 bg-gradient-to-r from-slate-50 to-white">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-extrabold text-slate-900">
                My Session
              </h2>
              <Badge label={role.replace("ROLE_", "")} tone="ok" />
              <Badge label={healthLabel} tone={healthTone} />
            </div>

            <p className="mt-1 text-sm font-semibold text-slate-600">
              Signed in as <span className="text-slate-900">{userEmail}</span>
            </p>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="text-xs font-bold text-slate-500">
                  Assigned Vehicles
                </div>
                <div className="mt-1 text-2xl font-extrabold text-slate-900">
                  {vehiclesCount}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="text-xs font-bold text-slate-500">
                  Fleet Health
                </div>
                <div className="mt-1 text-2xl font-extrabold text-slate-900">
                  {fleetHealth}%
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="text-xs font-bold text-slate-500">Access</div>
                <div className="mt-1 text-2xl font-extrabold text-slate-900">
                  Driver
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-extrabold text-slate-700 shadow-sm hover:bg-slate-50 transition-all"
            >
              <RefreshCcw
                className={refreshing ? "h-4 w-4 animate-spin" : "h-4 w-4"}
              />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 pt-0">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-700">
          Tip: keep your profile updated, and check maintenance alerts to avoid
          unexpected stops.
        </div>
      </div>
    </div>
  );
}

interface DashboardViewProps {
  user: any;
  isAdmin: boolean;
  isOwner: boolean;
  isDriver: boolean;
  ownerActive: boolean;
  ownerExpired: boolean;
  stats: DashboardStats;
  adminStats: AdminStats | null;
  recentDrivers: Driver[];
  recentVehicles: Vehicle[];
  loading: boolean;
  isRefreshing: boolean;
  quickActions: QuickAction[];
  adminPieData: { name: string; value: number }[];
  adminBarData: { name: string; value: number }[];
  onRefresh: () => void;
  onNavigate: (path: string) => void;
}

export default function DashboardView({
  user,
  isAdmin,
  isOwner,
  isDriver,
  ownerActive,
  ownerExpired,
  stats,
  adminStats,
  recentVehicles,
  loading,
  isRefreshing,
  quickActions,
  adminPieData,
  adminBarData,
  onRefresh,
  onNavigate,
}: DashboardViewProps) {
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
            {isDriver
              ? "Driver Dashboard"
              : isAdmin
              ? "Admin Dashboard"
              : ownerExpired
              ? "Dashboard (Limited)"
              : "Owner Dashboard"}
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
          onClick={onRefresh}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-all"
        >
          <RefreshCcw className={isRefreshing ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
          Refresh
        </button>
      </div>

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
              <div className="mt-2 text-sm text-white/90">
                {qa.description}
              </div>
            </button>
          );
        })}
      </div>

      {isDriver && (
        <SessionCard
          userEmail={user?.email || "—"}
          role={user?.role || "ROLE_DRIVER"}
          vehiclesCount={stats.totalVehicles}
          fleetHealth={stats.fleetHealth}
          onRefresh={onRefresh}
          refreshing={isRefreshing}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg">
          <div className="text-sm font-semibold text-slate-600">
            {isDriver ? "Assigned Vehicles" : "Vehicles"}
          </div>
          <div className="mt-2 text-3xl font-extrabold text-slate-900">
            {stats.totalVehicles}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg">
          <div className="text-sm font-semibold text-slate-600">
            {isAdmin ? "Owners" : isDriver ? "My Status" : "Available Vehicles"}
          </div>
          <div className="mt-2 text-3xl font-extrabold text-slate-900">
            {isAdmin ? adminStats?.ownersCount ?? 0 : isDriver ? 1 : stats.availableVehicles}
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
            <div className="mt-1 text-xs font-semibold text-slate-500">
              Next 7 days
            </div>
          )}
          {isAdmin && (
            <div className="mt-1 text-xs font-semibold text-slate-500">
              Total drivers
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-slate-600">
              Fleet Health
            </div>
            <Shield className="h-5 w-5 text-slate-400" />
          </div>

          <div className="mt-2 text-3xl font-extrabold text-slate-900">
            {stats.fleetHealth}%
          </div>

          <div className="mt-3 h-2 w-full rounded bg-slate-100">
            <div
              className="h-2 rounded bg-slate-900"
              style={{ width: `${stats.fleetHealth}%` }}
            />
          </div>
        </div>
      </div>

      {isOwner && ownerActive && stats.vehiclesNeedingMaintenance > 0 && (
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 shadow-lg">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-extrabold text-amber-800">
                Maintenance Alert
              </div>
              <div className="mt-1 text-sm font-semibold text-amber-800/80">
                {stats.vehiclesNeedingMaintenance} vehicle(s) need maintenance
                in the next 7 days.
              </div>
            </div>

            <button
              onClick={() => onNavigate("/maintenance")}
              className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-extrabold text-white hover:bg-slate-800 transition-all"
            >
              Open Maintenance
            </button>
          </div>
        </div>
      )}

      {isAdmin && adminStats && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-extrabold text-slate-900">
                  Vehicle Status
                </div>
                <div className="mt-1 text-xs font-semibold text-slate-500">
                  Distribution across the platform
                </div>
              </div>
              <Badge label={`Total: ${adminStats.vehiclesCount}`} tone="ok" />
            </div>

            <div className="mt-4 h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={adminPieData}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={110}
                  />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-extrabold text-slate-900">
                  Alerts
                </div>
                <div className="mt-1 text-xs font-semibold text-slate-500">
                  Maintenance & critical vehicles
                </div>
              </div>
              <Badge
                label={`Out: ${adminStats.outVehicles}`}
                tone={adminStats.outVehicles ? "warn" : "ok"}
              />
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

      {isOwner && ownerActive && (
        <div className="rounded-3xl border border-slate-200 bg-white shadow-lg overflow-hidden">
          <div className="p-6 border-b border-slate-200 bg-slate-50">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div>
                <div className="text-lg font-extrabold text-slate-900">
                  Fleet Vehicles
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-600">
                  Latest vehicles in your fleet (quick view).
                </div>
              </div>

              <button
                onClick={() => onNavigate("/vehicles")}
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
                    new Date(v.nextMaintenanceDate) <=
                      new Date(Date.now() + 7 * 86400000);

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
                            <div className="font-extrabold text-slate-900">
                              {v.registrationNumber || "—"}
                            </div>
                            <StatusPill status={v.status} />
                            {dueSoon ? (
                              <Badge label="Maintenance soon" tone="warn" />
                            ) : null}
                          </div>

                          <div className="mt-1 text-sm font-semibold text-slate-600">
                            {v.brand} {v.model} • Year {v.year ?? "—"}
                          </div>

                          {v.nextMaintenanceDate ? (
                            <div className="mt-1 text-xs font-semibold text-slate-500">
                              Next maintenance:{" "}
                              {new Date(v.nextMaintenanceDate).toLocaleDateString()}
                            </div>
                          ) : (
                            <div className="mt-1 text-xs font-semibold text-slate-500">
                              Next maintenance: —
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between md:justify-end gap-4">
                        <div className="text-sm font-extrabold text-slate-900">
                          {(v.mileage ?? 0).toLocaleString()} km
                        </div>

                        <button
                          onClick={() => onNavigate(`/vehicles/${v.id}`)}
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