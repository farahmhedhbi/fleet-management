import type { VehicleLiveStatusDTO, GpsFilterStatus } from "@/types/gps";

export function formatTimestamp(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

export function getStatusLabel(status?: string | null) {
  const s = String(status || "");
  if (s === "OFFLINE") return "Offline";
  if (s === "NO_DATA") return "No data";
  if (s === "ENGINE_OFF") return "Engine off";
  if (s === "STOPPED") return "Stopped";
  if (s === "PAUSED_ON_MISSION") return "Paused on mission";
  if (s === "MOVING") return "Moving";
  if (s === "MISSION_COMPLETED") return "Mission completed";
  if (s === "OFF_ROUTE") return "Off route";
  return s || "Unknown";
}

export function getStatusClasses(status?: string | null) {
  const s = String(status || "");
  if (s === "MOVING") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (s === "MISSION_COMPLETED") return "bg-cyan-50 text-cyan-700 border-cyan-200";
  if (s === "OFF_ROUTE") return "bg-rose-50 text-rose-700 border-rose-200";
  if (s === "OFFLINE" || s === "NO_DATA") return "bg-slate-100 text-slate-700 border-slate-200";
  if (s === "ENGINE_OFF" || s === "STOPPED" || s === "PAUSED_ON_MISSION") {
    return "bg-amber-50 text-amber-700 border-amber-200";
  }
  return "bg-slate-50 text-slate-700 border-slate-200";
}

export function countByStatus(
  vehicles: VehicleLiveStatusDTO[],
  status: GpsFilterStatus
) {
  if (status === "ALL") {
    return vehicles.length;
  }

  if (status === "OFFLINE") {
    return vehicles.filter(
      (v) => v.liveStatus === "OFFLINE" || v.liveStatus === "NO_DATA"
    ).length;
  }

  if (status === "MISSION") {
    return vehicles.filter((v) => v.missionActive).length;
  }

  if (status === "ALERT") {
    return vehicles.filter(
      (v) => v.liveStatus === "OFF_ROUTE" || v.liveStatus === "MISSION_COMPLETED"
    ).length;
  }

  return vehicles.filter((v) => v.liveStatus === status).length;
}