"use client";

import Link from "next/link";
import type { Dispatch, SetStateAction } from "react";
import type { Mission, MissionStatus } from "@/types/mission";
import {
  Calendar,
  Car,
  RefreshCcw,
  Search,
  Play,
  Flag,
  Clock,
  MapPin,
  User,
  Route,
  History,
  AlertTriangle,
  ShieldCheck,
  Coffee,
  Warehouse,
  CheckCircle2,
  XCircle,
} from "lucide-react";

function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

function statusBadge(status?: MissionStatus) {
  const s = String(status || "PLANNED");

  if (s === "COMPLETED")
    return "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (s === "IN_PROGRESS")
    return "bg-blue-100 text-blue-700 border-blue-200";
  if (s === "CANCELED") return "bg-rose-100 text-rose-700 border-rose-200";

  return "bg-slate-100 text-slate-700 border-slate-200";
}

function statusLabel(s?: MissionStatus) {
  if (s === "PLANNED") return "Planifiée";
  if (s === "IN_PROGRESS") return "En cours";
  if (s === "COMPLETED") return "Terminée";
  if (s === "CANCELED") return "Annulée";
  return "Planifiée";
}

function routeBadge(status?: string | null) {
  if (status === "SAFE")
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "ALTERNATIVE_SELECTED")
    return "border-orange-200 bg-orange-50 text-orange-700";
  if (status === "LEAST_RISK_SELECTED")
    return "border-red-200 bg-red-50 text-red-700";
  return "border-slate-200 bg-slate-50 text-slate-500";
}

function routeLabel(status?: string | null) {
  if (status === "SAFE") return "Route sûre";
  if (status === "ALTERNATIVE_SELECTED") return "Alternative";
  if (status === "LEAST_RISK_SELECTED") return "Moins dangereuse";
  return "Non vérifiée";
}

function riskTextClass(risk?: string | null) {
  if (risk === "LOW") return "text-emerald-700";
  if (risk === "MEDIUM") return "text-orange-700";
  if (risk === "HIGH" || risk === "CRITICAL") return "text-red-700";
  return "text-slate-600";
}

function canReportIncident(mission: Mission) {
  return mission.status === "IN_PROGRESS";
}

function missionMinutes(mission: Mission) {
  if (!mission.startDate || !mission.endDate) return 0;

  const start = new Date(mission.startDate).getTime();
  const end = new Date(mission.endDate).getTime();

  if (Number.isNaN(start) || Number.isNaN(end)) return 0;

  return Math.max(Math.round((end - start) / 60000), 0);
}

function getRestPolicyText(mission: Mission) {
  const minutes = missionMinutes(mission);

  if (minutes < 60) return "Aucun repos obligatoire";
  if (minutes <= 120) return "Repos 15 min après la mission";
  return "Repos 30 min au milieu de la mission";
}

function canTakeMiddleRest(mission: Mission) {
  return mission.status === "IN_PROGRESS" && missionMinutes(mission) > 120;
}

interface DriverRestInfo {
  status?: string;
  availableAt: string;
  remainingMs: number;
  remainingText: string;
  canMarkReady: boolean;
}

interface MyMissionsViewProps {
  missions: Mission[];
  filtered: Mission[];
  loading: boolean;
  refreshing: boolean;
  q: string;
  setQ: Dispatch<SetStateAction<string>>;
  actingId: number | null;
  checkingRouteId: number | null;
  now: number;
  driverRestInfo: DriverRestInfo | null;
  restLoading: boolean;
  onReady: () => void;
  onRefresh: () => void;
  onCheckRoute: (mission: Mission) => void;
  onStart: (mission: Mission) => void;
  onFinish: (mission: Mission) => void;
  onMiddleRest: (mission: Mission) => void;
  onReturnToDepot: (mission: Mission) => void;
  canStartMission: (mission: Mission) => boolean;
  canFinishMission: (mission: Mission) => boolean;
  getStartBlockedMessage: (mission: Mission) => string | null;
  getFinishBlockedMessage: (mission: Mission) => string | null;
  formatDateTime: (value?: string | null) => string;
}

export default function MyMissionsView({
  missions,
  filtered,
  loading,
  refreshing,
  q,
  setQ,
  actingId,
  checkingRouteId,
  driverRestInfo,
  restLoading,
  onReady,
  onRefresh,
  onCheckRoute,
  onStart,
  onFinish,
  onMiddleRest,
  onReturnToDepot,
  canStartMission,
  canFinishMission,
  getStartBlockedMessage,
  getFinishBlockedMessage,
  formatDateTime,
}: MyMissionsViewProps) {
  const plannedCount = missions.filter((m) => m.status === "PLANNED").length;
  const progressCount = missions.filter((m) => m.status === "IN_PROGRESS").length;
  const completedCount = missions.filter((m) => m.status === "COMPLETED").length;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 text-white md:p-8">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white">
                  <Car className="h-4 w-4" />
                  Driver dashboard
                </div>

                <h1 className="mt-4 text-3xl font-black tracking-tight md:text-4xl">
                  My Missions
                </h1>

                <p className="mt-2 max-w-2xl text-sm font-medium text-slate-300">
                  Suivez vos missions, vérifiez la route, gérez le repos et
                  déclarez un incident si nécessaire.
                </p>
              </div>

              <button
                type="button"
                onClick={onRefresh}
                disabled={refreshing}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-extrabold text-slate-900 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCcw
                  className={cn("h-4 w-4", refreshing && "animate-spin")}
                />
                Actualiser
              </button>
            </div>
          </div>

          <div className="grid gap-3 border-t border-slate-200 bg-white p-4 md:grid-cols-4">
            <StatCard label="Total" value={missions.length} />
            <StatCard label="Planifiées" value={plannedCount} />
            <StatCard label="En cours" value={progressCount} />
            <StatCard label="Terminées" value={completedCount} />
          </div>
        </div>

        {driverRestInfo ? (
          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-white px-3 py-1 text-xs font-black text-amber-700">
                  <Coffee className="h-4 w-4" />
                  Repos conducteur
                </div>

                <h2 className="mt-3 text-xl font-black text-slate-900">
                  Vous êtes en période de repos
                </h2>

                <p className="mt-1 text-sm font-semibold text-slate-600">
                  Disponible à : {formatDateTime(driverRestInfo.availableAt)}
                </p>

                <p className="mt-3 text-3xl font-black text-amber-700">
                  {driverRestInfo.canMarkReady
                    ? "Repos terminé"
                    : driverRestInfo.remainingText}
                </p>
              </div>

              <button
                type="button"
                onClick={onReady}
                disabled={!driverRestInfo.canMarkReady || restLoading}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <CheckCircle2 className="h-4 w-4" />
                {restLoading ? "Validation..." : "Repos terminé / Ready"}
              </button>
            </div>

            <p
              className={cn(
                "mt-3 text-xs font-bold",
                driverRestInfo.canMarkReady
                  ? "text-emerald-700"
                  : "text-amber-700"
              )}
            >
              {driverRestInfo.canMarkReady
                ? "Votre repos est terminé. Cliquez sur Ready pour redevenir disponible."
                : "Pendant le repos, vous ne pouvez pas démarrer une nouvelle mission."}
            </p>
          </div>
        ) : null}

        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher par titre, véhicule, statut, trajet..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-12 pr-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
            />
          </div>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-sm font-bold text-slate-500 shadow-sm">
            Chargement des missions...
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
            <XCircle className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-3 text-lg font-black text-slate-800">
              Aucune mission trouvée
            </p>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Vos missions assignées apparaîtront ici.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {filtered.map((m) => {
              const canStart = canStartMission(m);
              const canFinish = canFinishMission(m);
              const startMessage = getStartBlockedMessage(m);
              const finishMessage = getFinishBlockedMessage(m);
              const busy = actingId === m.id;
              const checking = checkingRouteId === m.id;
              const reportAllowed = canReportIncident(m);
              const middleRestAllowed = canTakeMiddleRest(m);

              return (
                <article
                  key={m.id}
                  className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
                >
                  <div className="border-b border-slate-100 p-5">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0">
                        <h3 className="text-xl font-black text-slate-900">
                          {m.title || "Mission sans titre"}
                        </h3>

                        <p className="mt-1 line-clamp-2 text-sm font-medium text-slate-500">
                          {m.description || "Aucune description"}
                        </p>
                      </div>

                      <span
                        className={cn(
                          "inline-flex shrink-0 items-center justify-center rounded-full border px-3 py-1 text-xs font-black",
                          statusBadge(m.status)
                        )}
                      >
                        {statusLabel(m.status)}
                      </span>
                    </div>

                    <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                      <div className="flex items-start gap-3">
                        <div className="rounded-2xl bg-blue-100 p-3 text-blue-700">
                          <MapPin className="h-5 w-5" />
                        </div>

                        <div className="min-w-0">
                          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                            Trajet
                          </p>
                          <p className="mt-1 text-lg font-black text-slate-900">
                            {m.departure || "Départ inconnu"} →{" "}
                            {m.destination || "Destination inconnue"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 p-5 md:grid-cols-2">
                    <InfoItem
                      icon={<Car className="h-4 w-4" />}
                      label="Véhicule"
                      value={m.vehicleRegistrationNumber || "Inconnu"}
                    />

                    <InfoItem
                      icon={<User className="h-4 w-4" />}
                      label="Conducteur"
                      value={m.driverName || "Inconnu"}
                    />

                    <InfoItem
                      icon={<Calendar className="h-4 w-4" />}
                      label="Début prévu"
                      value={formatDateTime(m.startDate)}
                    />

                    <InfoItem
                      icon={<Flag className="h-4 w-4" />}
                      label="Fin prévue"
                      value={formatDateTime(m.endDate)}
                    />

                    <InfoItem
                      icon={<Clock className="h-4 w-4" />}
                      label="Démarrée"
                      value={formatDateTime(m.startedAt)}
                    />

                    <InfoItem
                      icon={<CheckCircle2 className="h-4 w-4" />}
                      label="Terminée"
                      value={formatDateTime(m.finishedAt)}
                    />
                  </div>

                  <div className="space-y-4 border-t border-slate-100 bg-slate-50 p-5">
                    <section className="rounded-2xl border border-amber-200 bg-white p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="flex items-center gap-2 text-sm font-black text-slate-900">
                            <Coffee className="h-4 w-4 text-amber-600" />
                            Repos driver
                          </p>
                          <p className="mt-1 text-xs font-bold text-slate-500">
                            Durée mission : {missionMinutes(m)} min
                          </p>
                        </div>

                        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-700">
                          {getRestPolicyText(m)}
                        </span>
                      </div>

                      {middleRestAllowed ? (
                        <button
                          type="button"
                          onClick={() => onMiddleRest(m)}
                          disabled={
                            restLoading ||
                            driverRestInfo !== null ||
                            busy ||
                            checking
                          }
                          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 px-4 py-3 text-sm font-black text-white hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Coffee className="h-4 w-4" />
                          {restLoading ? "Repos..." : "Prendre repos 30 min"}
                        </button>
                      ) : null}
                    </section>

                    <section className="rounded-2xl border border-slate-200 bg-white p-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <p className="flex items-center gap-2 text-sm font-black text-slate-900">
                            <ShieldCheck className="h-4 w-4 text-blue-600" />
                            Vérification route
                          </p>
                          <p className="mt-1 text-xs font-bold text-slate-500">
                            Vérifiez la route avant de démarrer.
                          </p>
                        </div>

                        <span
                          className={cn(
                            "inline-flex w-fit rounded-full border px-3 py-1 text-xs font-black",
                            routeBadge(m.routeCheckStatus)
                          )}
                        >
                          {routeLabel(m.routeCheckStatus)}
                        </span>
                      </div>

                      {m.routeCheckMessage ? (
                        <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm font-semibold text-slate-700">
                          {m.routeCheckMessage}
                        </p>
                      ) : null}

                      <div className="mt-4 grid gap-2 text-xs font-bold text-slate-600 sm:grid-cols-2">
                        <p>
                          Risque :{" "}
                          <span
                            className={cn(
                              "font-black",
                              riskTextClass(m.routeRiskLevel)
                            )}
                          >
                            {m.routeRiskLevel || "—"}
                          </span>
                        </p>

                        <p>Retard : +{m.estimatedDelayMinutes ?? 0} min</p>
                        <p>Durée initiale : {m.originalDurationMinutes ?? "—"} min</p>
                        <p>Durée choisie : {m.selectedDurationMinutes ?? "—"} min</p>
                        <p>Distance initiale : {m.originalDistanceKm ?? "—"} km</p>
                        <p>Distance choisie : {m.selectedDistanceKm ?? "—"} km</p>
                      </div>

                      {m.status === "PLANNED" ? (
                        <button
                          type="button"
                          onClick={() => onCheckRoute(m)}
                          disabled={checking || busy}
                          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-black text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Route className="h-4 w-4" />
                          {checking ? "Vérification..." : "Vérifier la route"}
                        </button>
                      ) : null}
                    </section>

                    {(startMessage || finishMessage) && (
                      <div className="space-y-2">
                        {!canStart && startMessage ? (
                          <p className="rounded-xl bg-amber-100 px-3 py-2 text-xs font-bold text-amber-700">
                            {startMessage}
                          </p>
                        ) : null}

                        {!canFinish && finishMessage ? (
                          <p className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-500">
                            {finishMessage}
                          </p>
                        ) : null}
                      </div>
                    )}

                    <div className="grid gap-2 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => onStart(m)}
                        disabled={!canStart || busy || checking}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Play className="h-4 w-4" />
                        {busy && m.status === "PLANNED" ? "Démarrage..." : "Start"}
                      </button>

                      <button
                        type="button"
                        onClick={() => onFinish(m)}
                        disabled={!canFinish || busy || driverRestInfo !== null}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Flag className="h-4 w-4" />
                        {busy && m.status === "IN_PROGRESS"
                          ? "Finalisation..."
                          : "Finish"}
                      </button>
                    </div>

                    {m.status === "COMPLETED" ? (
                      <button
                        type="button"
                        onClick={() => onReturnToDepot(m)}
                        disabled={busy}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-purple-600 px-4 py-3 text-sm font-black text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Warehouse className="h-4 w-4" />
                        {busy ? "Analyse retour..." : "Return to depot"}
                      </button>
                    ) : null}

                    <div className="grid gap-2 sm:grid-cols-2">
                      <Link
                        href={`/driver/missions/${m.id}/map`}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
                      >
                        <Route className="h-4 w-4" />
                        Carte live
                      </Link>

                      <Link
                        href={`/driver/missions/${m.id}/history`}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
                      >
                        <History className="h-4 w-4" />
                        Historique
                      </Link>
                    </div>

                    <Link
                      href={`/my-missions/${m.id}/report-incident`}
                      aria-disabled={!reportAllowed}
                      onClick={(e) => {
                        if (!reportAllowed) e.preventDefault();
                      }}
                      className={cn(
                        "inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black transition",
                        reportAllowed
                          ? "bg-red-600 text-white hover:bg-red-700"
                          : "cursor-not-allowed bg-slate-200 text-slate-400"
                      )}
                    >
                      <AlertTriangle className="h-4 w-4" />
                      Déclarer incident
                    </Link>

                    {!reportAllowed ? (
                      <p className="text-center text-xs font-bold text-slate-400">
                        Disponible seulement quand la mission est en cours.
                      </p>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-2xl font-black text-slate-900">{value}</p>
    </div>
  );
}

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-xs font-bold text-slate-400">{label}</p>
        <p className="truncate text-sm font-extrabold text-slate-800">
          {value}
        </p>
      </div>
    </div>
  );
}