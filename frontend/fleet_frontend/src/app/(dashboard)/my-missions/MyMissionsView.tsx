"use client";

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
} from "lucide-react";

function cn(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

function statusBadge(status?: MissionStatus) {
  const s = String(status || "PLANNED");
  if (s === "DONE") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (s === "IN_PROGRESS") return "bg-blue-50 text-blue-700 border-blue-200";
  if (s === "CANCELED") return "bg-rose-50 text-rose-700 border-rose-200";
  return "bg-slate-50 text-slate-700 border-slate-200";
}

function statusLabel(s: MissionStatus) {
  if (s === "PLANNED") return "Planned";
  if (s === "IN_PROGRESS") return "In Progress";
  if (s === "DONE") return "Done";
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
            Start and finish missions. Your owner will be notified automatically.
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

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-slate-200 bg-white p-2">
            <Search className="h-4 w-4 text-slate-600" />
          </div>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search in my missions..."
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg animate-pulse">
          <div className="h-5 w-48 rounded bg-slate-200" />
          <div className="mt-3 h-4 w-72 rounded bg-slate-200" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
          <div className="text-lg font-bold text-slate-900">No missions assigned</div>
          <div className="mt-1 text-slate-600">
            When an owner assigns you a mission, it will appear here.
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((m) => {
            const busy = actingId === m.id;
            const canStart = canStartMission(m);
            const canFinish = canFinishMission(m);
            const startBlockedMessage = getStartBlockedMessage(m);
            const finishBlockedMessage = getFinishBlockedMessage(m);

            return (
              <div
                key={m.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden"
              >
                <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-lg font-extrabold truncate">
                        {m.title || "—"}
                      </div>
                      <div className="mt-1 text-xs text-white/80 flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5" />
                        <span className="truncate">
                          {formatDateTime(m.startDate)} → {formatDateTime(m.endDate)}
                        </span>
                      </div>
                    </div>

                    <span
                      className={cn(
                        "shrink-0 rounded-full border px-3 py-1 text-xs font-bold",
                        statusBadge(m.status)
                      )}
                    >
                      {statusLabel(m.status)}
                    </span>
                  </div>
                </div>

                <div className="p-5 space-y-3">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                      <Car className="h-4 w-4" />
                      Vehicle
                    </div>
                    <div className="mt-1 text-sm text-slate-900 font-semibold">
                      {m.vehicleRegistrationNumber || `#${m.vehicleId}`}
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                      <Clock className="h-4 w-4" />
                      Mission Schedule
                    </div>
                    <div className="mt-1 text-sm text-slate-900">
                      Start: <span className="font-semibold">{formatDateTime(m.startDate)}</span>
                    </div>
                    <div className="mt-1 text-sm text-slate-900">
                      End: <span className="font-semibold">{formatDateTime(m.endDate)}</span>
                    </div>
                  </div>

                  {m.description && (
                    <div className="text-sm text-slate-700">
                      <span className="font-bold text-slate-900">Notes: </span>
                      {m.description}
                    </div>
                  )}

                  {startBlockedMessage && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
                      {startBlockedMessage}
                    </div>
                  )}

                  {finishBlockedMessage && (
                    <div className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-700">
                      {finishBlockedMessage}
                    </div>
                  )}

                  <div className="pt-2 flex gap-2">
                    <button
                      onClick={() => onStart(m)}
                      disabled={busy || !canStart}
                      className={cn(
                        "flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-extrabold text-white transition-all",
                        busy || !canStart
                          ? "bg-slate-300 cursor-not-allowed"
                          : "bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 hover:shadow-lg"
                      )}
                    >
                      <Play className="h-4 w-4" />
                      Start
                    </button>

                    <button
                      onClick={() => onFinish(m)}
                      disabled={busy || !canFinish}
                      className={cn(
                        "flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-extrabold text-white transition-all",
                        busy || !canFinish
                          ? "bg-slate-300 cursor-not-allowed"
                          : "bg-gradient-to-r from-blue-500 to-cyan-500 hover:shadow-lg"
                      )}
                    >
                      <Flag className="h-4 w-4" />
                      Finish
                    </button>
                  </div>

                  {busy && (
                    <div className="text-xs font-bold text-slate-500">
                      Processing...
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}