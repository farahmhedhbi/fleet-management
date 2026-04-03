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
} from "lucide-react";

function cn(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

function statusBadge(status?: MissionStatus) {
  const s = String(status || "PLANNED");
  if (s === "COMPLETED") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (s === "IN_PROGRESS") return "bg-blue-50 text-blue-700 border-blue-200";
  if (s === "CANCELED") return "bg-rose-50 text-rose-700 border-rose-200";
  return "bg-slate-50 text-slate-700 border-slate-200";
}

function statusLabel(s: MissionStatus) {
  if (s === "PLANNED") return "Planned";
  if (s === "IN_PROGRESS") return "In Progress";
  if (s === "COMPLETED") return "Completed";
  return "Canceled";
}

interface MyMissionsViewProps {
  missions: Mission[];
  filtered: Mission[];
  loading: boolean;
  refreshing: boolean;
  q: string;
  setQ: Dispatch<SetStateAction<string>>;
  actingId: number | null;
  now: number;
  onRefresh: () => void;
  onStart: (mission: Mission) => void;
  onFinish: (mission: Mission) => void;
  canStartMission: (mission: Mission) => boolean;
  canFinishMission: (mission: Mission) => boolean;
  getStartBlockedMessage: (mission: Mission) => string | null;
  getFinishBlockedMessage: (mission: Mission) => string | null;
  formatDateTime: (value?: string) => string;
}

export default function MyMissionsView({
  filtered,
  loading,
  refreshing,
  q,
  setQ,
  actingId,
  onRefresh,
  onStart,
  onFinish,
  canStartMission,
  canFinishMission,
  getStartBlockedMessage,
  getFinishBlockedMessage,
  formatDateTime,
}: MyMissionsViewProps) {
  return (
    <div className="p-6 md:p-10 space-y-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            My Missions
          </h1>
          <p className="mt-1 text-slate-600">
            Start and finish your assigned missions.
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-all"
        >
          <RefreshCcw className={refreshing ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
          Refresh
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by title, vehicle, status, route..."
            className="w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 py-3 text-sm font-medium text-slate-800 outline-none focus:border-slate-300 focus:ring-2 focus:ring-sky-500/20"
          />
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm font-semibold text-slate-500 shadow-sm">
          Loading missions...
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
          <p className="text-lg font-bold text-slate-800">No missions found</p>
          <p className="mt-2 text-sm text-slate-500">
            Your assigned missions will appear here.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((m) => {
            const canStart = canStartMission(m);
            const canFinish = canFinishMission(m);
            const busy = actingId === m.id;

            return (
              <div
                key={m.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-900">{m.title}</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {m.description || "No description"}
                    </p>
                  </div>

                  <span
                    className={cn(
                      "inline-flex items-center rounded-full border px-3 py-1 text-xs font-extrabold",
                      statusBadge(m.status)
                    )}
                  >
                    {statusLabel(m.status)}
                  </span>
                </div>

                <div className="grid gap-3 text-sm text-slate-700">
                  <div className="flex items-center gap-2">
                    <Car className="h-4 w-4 text-slate-400" />
                    <span>{m.vehicleRegistrationNumber || "Unknown vehicle"}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-slate-400" />
                    <span>{m.driverName || "Unknown driver"}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    <span>
                      {m.departure} → {m.destination}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span>{formatDateTime(m.startDate)}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-slate-400" />
                    <span>Started: {formatDateTime(m.startedAt)}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Flag className="h-4 w-4 text-slate-400" />
                    <span>Finished: {formatDateTime(m.finishedAt)}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  {!canStart && getStartBlockedMessage(m) ? (
                    <div className="text-xs font-semibold text-amber-700">
                      {getStartBlockedMessage(m)}
                    </div>
                  ) : null}

                  {!canFinish && getFinishBlockedMessage(m) ? (
                    <div className="text-xs font-semibold text-slate-500">
                      {getFinishBlockedMessage(m)}
                    </div>
                  ) : null}

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => onStart(m)}
                      disabled={!canStart || busy}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Play className="h-4 w-4" />
                      Start
                    </button>

                    <button
                      onClick={() => onFinish(m)}
                      disabled={!canFinish || busy}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Flag className="h-4 w-4" />
                      Finish
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Link
                      href={`/driver/missions/${m.id}/map`}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <Route className="h-4 w-4" />
                      Carte live
                    </Link>

                    <Link
                      href={`/driver/missions/${m.id}/history`}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <History className="h-4 w-4" />
                      Historique
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}