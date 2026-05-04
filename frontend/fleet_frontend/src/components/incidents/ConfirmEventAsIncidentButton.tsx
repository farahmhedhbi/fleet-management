"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import { AlertTriangle } from "lucide-react";

import { incidentService } from "@/lib/services/incidentService";
import type { IncidentSeverity, IncidentType } from "@/types/incident";
import type { VehicleEventDTO } from "@/types/gps";

function mapEventToIncident(eventType?: string | null): {
  type: IncidentType;
  severity: IncidentSeverity;
  title: string;
} {
  switch (eventType) {
    case "OFF_ROUTE":
      return {
        type: "MISSION_PROBLEM",
        severity: "HIGH",
        title: "Déviation de route confirmée",
      };

    case "STOP_LONG":
      return {
        type: "MISSION_PROBLEM",
        severity: "MEDIUM",
        title: "Arrêt prolongé confirmé",
      };

    case "NO_SIGNAL":
      return {
        type: "GPS_ANOMALY",
        severity: "MEDIUM",
        title: "Perte signal GPS confirmée",
      };

    case "OVERSPEED":
      return {
        type: "DRIVER_BEHAVIOR",
        severity: "HIGH",
        title: "Comportement conducteur à risque",
      };

    case "OBD_HIGH_TEMP":
    case "HIGH_TEMP_WARNING":
    case "HIGH_TEMP_CRITICAL":
      return {
        type: "VEHICLE_BREAKDOWN",
        severity: "CRITICAL",
        title: "Surchauffe moteur confirmée",
      };

    case "OBD_LOW_FUEL":
    case "LOW_FUEL_WARNING":
    case "LOW_FUEL_CRITICAL":
      return {
        type: "VEHICLE_BREAKDOWN",
        severity: "MEDIUM",
        title: "Carburant faible confirmé",
      };

    case "OBD_LOW_BATTERY":
    case "LOW_BATTERY_WARNING":
    case "LOW_BATTERY_CRITICAL":
      return {
        type: "VEHICLE_BREAKDOWN",
        severity: "HIGH",
        title: "Batterie faible confirmée",
      };

    case "OBD_CHECK_ENGINE":
    case "CHECK_ENGINE_ON":
      return {
        type: "VEHICLE_BREAKDOWN",
        severity: "CRITICAL",
        title: "Voyant moteur confirmé",
      };

    case "ENGINE_FAILURE":
      return {
        type: "VEHICLE_BREAKDOWN",
        severity: "CRITICAL",
        title: "Panne moteur confirmée",
      };

    case "MISSION_INTERRUPTED":
      return {
        type: "MISSION_PROBLEM",
        severity: "CRITICAL",
        title: "Mission interrompue confirmée",
      };

    default:
      return {
        type: "OTHER",
        severity: "MEDIUM",
        title: "Incident confirmé depuis une alerte",
      };
  }
}

export default function ConfirmEventAsIncidentButton({
  event,
  onConfirmed,
}: {
  event: VehicleEventDTO;
  onConfirmed?: () => void;
}) {
  const [loading, setLoading] = useState(false);

  async function confirm() {
    if (!event?.id) {
      toast.error("Event invalide");
      return;
    }

    try {
      setLoading(true);

      const mapped = mapEventToIncident(event.eventType);

      await incidentService.createFromEvent({
        vehicleEventId: event.id,
        type: mapped.type,
        severity: mapped.severity,
        title: mapped.title,
        description:
          event.message ||
          `Incident confirmé depuis l’alerte technique ${event.eventType || ""}`,
        emergency: mapped.severity === "CRITICAL",
      });

      toast.success("Incident créé depuis l’alerte");
      onConfirmed?.();
    } catch (e: any) {
      console.error(e);
      toast.error(
        e?.response?.data?.message ||
          e?.response?.data?.error ||
          "Erreur lors de la confirmation"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={confirm}
      disabled={loading}
      className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-3 py-2 text-xs font-extrabold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <AlertTriangle className="h-4 w-4" />
      {loading ? "Confirmation..." : "Confirmer incident"}
    </button>
  );
}