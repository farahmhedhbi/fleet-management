"use client";

import {
  AlertTriangle,
  BarChart3,
  Car,
  CheckCircle2,
  CircleDollarSign,
  Clock,
  RefreshCcw,
  Route,
  ShieldCheck,
  TrendingUp,
  Wrench,
  Zap,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  LineChart,
  Line,
} from "recharts";

import type { AdminStats } from "@/lib/services/adminStatsService";
import type { DashboardKpiDTO } from "@/types/dashboard";
import type { Driver } from "@/types/driver";
import type { Vehicle } from "@/types/vehicle";

function cn(...classes: (string | false | undefined | null)[]) {
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

const EMPTY_KPI: DashboardKpiDTO = {
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

interface DashboardViewProps {
  user: any;
  isAdmin: boolean;
  isOwner: boolean;
  isDriver: boolean;
  ownerActive: boolean;
  ownerExpired: boolean;
  kpi?: DashboardKpiDTO;
  stats: DashboardStats;
  adminStats: AdminStats | null;
  recentDrivers: Driver[];
  recentVehicles: Vehicle[];
  loading: boolean;
  isRefreshing: boolean;
  quickActions?: any[];
  adminPieData?: { name: string; value: number }[];
  adminBarData?: { name: string; value: number }[];
  onRefresh: () => void;
  onNavigate: (path: string) => void;
}

function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: any;
  trend?: "up" | "down";
  trendValue?: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/20 bg-white/80 p-6 shadow-xl backdrop-blur-sm transition-all duration-300 hover:shadow-2xl hover:-translate-y-0.5">
      <div className="absolute right-0 top-0 h-32 w-32 -translate-y-8 translate-x-8 rounded-full bg-gradient-to-br from-blue-200/50 to-indigo-200/50 opacity-0 transition-opacity group-hover:opacity-100" />
      
      <div className="relative flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">{title}</p>
          <h2 className="mt-2 text-3xl font-bold text-gray-800">{value}</h2>
          <p className="mt-1 text-xs text-gray-500">{subtitle}</p>
          
          {trend && trendValue && (
            <div className="mt-2 flex items-center gap-1">
              {trend === "up" && <TrendingUp className="h-3 w-3 text-emerald-600" />}
              {trend === "down" && <TrendingUp className="h-3 w-3 rotate-180 text-rose-600" />}
              <span className={`text-xs font-medium ${
                trend === "up" ? "text-emerald-600" : "text-rose-600"
              }`}>
                {trendValue}
              </span>
            </div>
          )}
        </div>

        <div className="rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 p-3 shadow-lg shadow-blue-500/30">
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );
}

function Panel({
  title,
  subtitle,
  icon: Icon,
  children,
  action,
}: {
  title: string;
  subtitle: string;
  icon: any;
  children: React.ReactNode;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="rounded-2xl border border-white/20 bg-white/70 p-6 shadow-xl backdrop-blur-sm transition-all duration-300 hover:shadow-2xl">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 p-2.5 shadow-lg shadow-blue-500/30">
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">{title}</h3>
            <p className="text-xs text-gray-500">{subtitle}</p>
          </div>
        </div>

        {action && (
          <button
            onClick={action.onClick}
            className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50"
          >
            {action.label}
          </button>
        )}
      </div>

      {children}
    </div>
  );
}

export default function DashboardView({
  user,
  isAdmin,
  isOwner,
  isDriver,
  ownerActive,
  ownerExpired,
  kpi,
  stats,
  adminStats,
  loading,
  isRefreshing,
  adminPieData = [],
  adminBarData = [],
  onRefresh,
  onNavigate,
}: DashboardViewProps) {
  const safeKpi = kpi ?? EMPTY_KPI;

  const vehicleStatusData = [
    { name: "Disponibles", value: safeKpi.availableVehicles, color: "#10b981" },
    { name: "En utilisation", value: safeKpi.inUseVehicles, color: "#3b82f6" },
    { name: "Maintenance", value: safeKpi.maintenanceVehicles, color: "#f59e0b" },
    { name: "Hors service", value: safeKpi.outOfServiceVehicles, color: "#ef4444" },
  ];

  const missionData = [
    { name: "Planifiées", value: safeKpi.plannedMissions, color: "#8b5cf6" },
    { name: "Actives", value: safeKpi.activeMissions, color: "#3b82f6" },
    { name: "Terminées", value: safeKpi.completedMissions, color: "#10b981" },
    { name: "Annulées", value: safeKpi.canceledMissions, color: "#ef4444" },
  ];

  const weeklyActivity = [
    { day: "Lun", missions: safeKpi.activeMissions || 12, incidents: safeKpi.openIncidents || 3 },
    { day: "Mar", missions: safeKpi.activeMissions || 15, incidents: safeKpi.openIncidents || 2 },
    { day: "Mer", missions: safeKpi.activeMissions || 18, incidents: safeKpi.openIncidents || 4 },
    { day: "Jeu", missions: safeKpi.activeMissions || 14, incidents: safeKpi.openIncidents || 1 },
    { day: "Ven", missions: safeKpi.completedMissions || 22, incidents: safeKpi.criticalIncidents || 3 },
    { day: "Sam", missions: 8, incidents: 0 },
    { day: "Dim", missions: 5, incidents: 1 },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8">
        <div className="mx-auto max-w-7xl">
          <div className="h-96 animate-pulse rounded-2xl bg-white/50" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <main className="relative mx-auto max-w-7xl space-y-6 p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 px-3 py-1 shadow-lg shadow-blue-500/30">
              <Zap className="h-3.5 w-3.5 text-white" />
              <span className="text-xs font-bold text-white">
                {isOwner && ownerActive
                  ? "Live WebSocket KPI"
                  : isAdmin
                  ? "Admin Analytics"
                  : isDriver
                  ? "Driver Overview"
                  : "Dashboard"}
              </span>
            </div>

            <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-800 lg:text-4xl">
              Tableau de bord flotte
            </h1>

            <p className="mt-2 text-sm text-gray-600">
              Aperçu en temps réel des opérations de votre flotte
            </p>

            <div className="mt-2 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              <p className="text-xs text-gray-500">
                Connecté en tant que {user?.email || "—"}
              </p>
            </div>
          </div>

          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white/80 px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-lg backdrop-blur-sm transition-all hover:bg-white hover:shadow-xl disabled:opacity-50"
          >
            <RefreshCcw
              className={cn("h-4 w-4", isRefreshing && "animate-spin")}
            />
            Actualiser
          </button>
        </div>

        {/* Owner Active Dashboard */}
        {isOwner && ownerActive && (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <KpiCard
                title="Flotte totale"
                value={safeKpi.totalVehicles}
                subtitle={`${safeKpi.availableVehicles} disponibles • ${safeKpi.inUseVehicles} en utilisation`}
                icon={Car}
                trend="up"
                trendValue="+12%"
              />

              <KpiCard
                title="Missions actives"
                value={safeKpi.activeMissions}
                subtitle={`${safeKpi.completedMissions} missions complétées`}
                icon={Route}
                trend="up"
                trendValue="+8%"
              />

              <KpiCard
                title="Incidents ouverts"
                value={safeKpi.openIncidents}
                subtitle={`${safeKpi.criticalIncidents} incidents critiques`}
                icon={AlertTriangle}
                trend="down"
                trendValue="-2"
              />

              <KpiCard
                title="Coût maintenance"
                value={`${(safeKpi.maintenanceTotalCost || 0).toLocaleString()} DT`}
                subtitle={`${safeKpi.plannedMaintenances} planifiées • ${safeKpi.overdueMaintenances} en retard`}
                icon={CircleDollarSign}
              />
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <Panel
                title="Statut des véhicules"
                subtitle="Distribution par statut"
                icon={Car}
                action={{ label: "Voir détails", onClick: () => onNavigate("/vehicles") }}
              >
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={vehicleStatusData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={3}
                      >
                        {vehicleStatusData.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: "white", 
                          border: "1px solid #e2e8f0",
                          borderRadius: "0.75rem",
                          color: "#1e293b"
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 flex flex-wrap justify-center gap-3">
                  {vehicleStatusData.map((item) => (
                    <div key={item.name} className="flex items-center gap-1.5">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-xs text-gray-600">{item.name}</span>
                      <span className="text-xs font-semibold text-gray-800">{item.value}</span>
                    </div>
                  ))}
                </div>
              </Panel>

              <Panel
                title="Performance des missions"
                subtitle="Planification et exécution"
                icon={BarChart3}
              >
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={missionData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis type="number" stroke="#94a3b8" />
                      <YAxis type="category" dataKey="name" stroke="#94a3b8" width={80} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: "white", 
                          border: "1px solid #e2e8f0",
                          borderRadius: "0.75rem",
                          color: "#1e293b"
                        }}
                      />
                      <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                        {missionData.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Panel>

              <Panel
                title="Santé de la flotte"
                subtitle="Indicateur de performance global"
                icon={ShieldCheck}
              >
                <div className="flex h-[280px] flex-col justify-center">
                  <div className="text-center">
                    <div className="text-5xl font-bold text-gray-800">
                      {stats?.fleetHealth ?? 0}%
                    </div>
                    <p className="mt-2 text-sm text-gray-500">Efficacité opérationnelle</p>
                  </div>

                  <div className="mt-6">
                    <div className="h-3 overflow-hidden rounded-full bg-gray-200">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-blue-500 transition-all duration-500"
                        style={{ width: `${stats?.fleetHealth ?? 0}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-white/50 p-2 text-center">
                      <div className="text-xs text-gray-500">Disponibilité</div>
                      <div className="text-sm font-semibold text-gray-800">
                        {Math.round((safeKpi.availableVehicles / safeKpi.totalVehicles) * 100)}%
                      </div>
                    </div>
                    <div className="rounded-lg bg-white/50 p-2 text-center">
                      <div className="text-xs text-gray-500">Taux d'utilisation</div>
                      <div className="text-sm font-semibold text-gray-800">
                        {Math.round((safeKpi.inUseVehicles / safeKpi.totalVehicles) * 100)}%
                      </div>
                    </div>
                  </div>
                </div>
              </Panel>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <Panel
                  title="Activité hebdomadaire"
                  subtitle="Missions vs incidents"
                  icon={TrendingUp}
                >
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={weeklyActivity}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="day" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" allowDecimals={false} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: "white", 
                            border: "1px solid #e2e8f0",
                            borderRadius: "0.75rem",
                            color: "#1e293b"
                          }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="missions" 
                          stroke="#3b82f6" 
                          strokeWidth={3}
                          dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="incidents" 
                          stroke="#ef4444" 
                          strokeWidth={3}
                          dot={{ fill: "#ef4444", strokeWidth: 2, r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Panel>
              </div>

              <Panel
                title="Aperçu intelligent"
                subtitle="Recommandations"
                icon={CheckCircle2}
              >
                <div className="space-y-3">
                  {safeKpi.activeMissions > 0 && (
                    <div className="flex items-start gap-3 rounded-xl bg-blue-50 border border-blue-200 p-3">
                      <div className="rounded-lg bg-blue-100 p-1.5">
                        <Route className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-blue-800">
                          {safeKpi.activeMissions} mission(s) en cours
                        </p>
                        <p className="text-xs text-blue-600">Suivez leur progression en temps réel</p>
                      </div>
                    </div>
                  )}

                  {safeKpi.openIncidents > 0 && (
                    <div className="flex items-start gap-3 rounded-xl bg-amber-50 border border-amber-200 p-3">
                      <div className="rounded-lg bg-amber-100 p-1.5">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-amber-800">
                          {safeKpi.openIncidents} incident(s) non résolus
                        </p>
                        <p className="text-xs text-amber-600">Dont {safeKpi.criticalIncidents} critiques</p>
                      </div>
                    </div>
                  )}

                  {safeKpi.overdueMaintenances > 0 && (
                    <div className="flex items-start gap-3 rounded-xl bg-rose-50 border border-rose-200 p-3">
                      <div className="rounded-lg bg-rose-100 p-1.5">
                        <Wrench className="h-4 w-4 text-rose-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-rose-800">
                          {safeKpi.overdueMaintenances} maintenance(s) en retard
                        </p>
                        <p className="text-xs text-rose-600">Intervention requise immédiatement</p>
                      </div>
                    </div>
                  )}

                  {safeKpi.activeMissions === 0 && safeKpi.openIncidents === 0 && safeKpi.overdueMaintenances === 0 && (
                    <div className="flex items-start gap-3 rounded-xl bg-emerald-50 border border-emerald-200 p-3">
                      <div className="rounded-lg bg-emerald-100 p-1.5">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-emerald-800">
                          Tout est en ordre !
                        </p>
                        <p className="text-xs text-emerald-600">Aucune alerte à signaler</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 border-t border-gray-200 pt-3 text-xs text-gray-500">
                    <Clock className="h-3.5 w-3.5" />
                    Dernière mise à jour :{" "}
                    {safeKpi.generatedAt
                      ? new Date(safeKpi.generatedAt).toLocaleString()
                      : "—"}
                  </div>
                </div>
              </Panel>
            </div>
          </>
        )}

        {/* Admin Dashboard */}
        {isAdmin && adminStats && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Panel
              title="Distribution des véhicules"
              subtitle="Aperçu global de la flotte"
              icon={Car}
            >
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={adminPieData}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={100}
                      label={({ name, percent }) => {
                        if (percent === undefined) return name;
                        return `${name} (${(percent * 100).toFixed(0)}%)`;
                      }}
                      labelStyle={{ fill: "#1e293b", fontSize: "12px" }}
                    >
                      {adminPieData.map((_, index) => (
                        <Cell key={index} fill={["#3b82f6", "#10b981", "#f59e0b", "#ef4444"][index % 4]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "white", 
                        border: "1px solid #e2e8f0",
                        borderRadius: "0.75rem",
                        color: "#1e293b"
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            <Panel
              title="Alertes opérationnelles"
              subtitle="Véhicules nécessitant attention"
              icon={AlertTriangle}
            >
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={adminBarData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" stroke="#94a3b8" />
                    <YAxis allowDecimals={false} stroke="#94a3b8" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "white", 
                        border: "1px solid #e2e8f0",
                        borderRadius: "0.75rem",
                        color: "#1e293b"
                      }}
                    />
                    <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>
          </div>
        )}

        {/* Owner Expired */}
        {ownerExpired && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
              <AlertTriangle className="h-8 w-8 text-amber-600" />
            </div>
            <h3 className="mb-2 text-xl font-bold text-amber-800">Abonnement expiré</h3>
            <p className="mx-auto max-w-md text-amber-700">
              Votre abonnement a expiré. Renouvelez-le pour réactiver l'ensemble des fonctionnalités.
            </p>
          </div>
        )}

        {/* Driver Dashboard */}
        {isDriver && (
          <div className="rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 p-8 shadow-xl">
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-white/10 p-3 backdrop-blur-sm">
                <ShieldCheck className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Espace conducteur</h3>
                <p className="text-blue-100">
                  Bienvenue {user?.email || "conducteur"}. Consultez vos missions et votre tableau de bord.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}