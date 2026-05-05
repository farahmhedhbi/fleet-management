"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import { incidentService } from "@/lib/services/incidentService";
import type { VehicleEventDTO } from "@/types/gps";
import type { IncidentSeverity, IncidentType } from "@/types/incident";

interface Props {
  event: VehicleEventDTO;
  onConfirmed?: () => void;
}

function mapEventToIncidentType(eventType?: string | null): IncidentType {
  if (!eventType) return "OTHER";

  if (eventType === "OFF_ROUTE" || eventType === "NO_SIGNAL") {
    return "GPS_ANOMALY";
  }

  if (eventType === "STOP_LONG" || eventType === "MISSION_INTERRUPTED") {
    return "MISSION_PROBLEM";
  }

  if (
    eventType.startsWith("OBD_") ||
    eventType.includes("LOW_FUEL") ||
    eventType.includes("HIGH_TEMP") ||
    eventType.includes("LOW_BATTERY") ||
    eventType === "CHECK_ENGINE_ON"
  ) {
    return "OBD_ALERT";
  }

  if (eventType === "ENGINE_FAILURE") {
    return "VEHICLE_BREAKDOWN";
  }

  if (eventType === "OVERSPEED") {
    return "DRIVER_BEHAVIOR";
  }

  return "OTHER";
}

function mapSeverity(severity?: string | null): IncidentSeverity {
  if (severity === "CRITICAL") return "CRITICAL";
  if (severity === "WARNING") return "HIGH";
  return "MEDIUM";
}

function buildTitle(event: VehicleEventDTO) {
  switch (event.eventType) {
    case "OFF_ROUTE":
      return "Véhicule hors trajet";
    case "OVERSPEED":
      return "Comportement conducteur à risque";
    case "STOP_LONG":
      return "Arrêt prolongé en mission";
    case "OBD_HIGH_TEMP":
      return "Température moteur critique";
    case "OBD_LOW_FUEL":
      return "Carburant faible";
    case "OBD_LOW_BATTERY":
      return "Batterie faible";
    case "OBD_CHECK_ENGINE":
      return "Voyant moteur activé";
    case "ENGINE_FAILURE":
      return "Panne moteur détectée";
    case "MISSION_INTERRUPTED":
      return "Mission interrompue";
    default:
      return "Incident confirmé depuis une alerte";
  }
}

export default function ConfirmEventAsIncidentButton({ event, onConfirmed }: Props) {
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  async function handleConfirm() {
    if (!event.id) {
      toast.error("Event invalide");
      return;
    }

    try {
      setLoading(true);

      await incidentService.fromEvent({
        vehicleEventId: event.id,
        type: mapEventToIncidentType(event.eventType),
        severity: mapSeverity(event.severity),
        title: buildTitle(event),
        description: event.message ?? "Incident confirmé depuis une alerte GPS/OBD.",
        emergency: event.severity === "CRITICAL",
      });

      setConfirmed(true);
      toast.success("Incident créé avec succès");
      onConfirmed?.();
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la confirmation de l'incident");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleConfirm}
      disabled={loading || confirmed}
      className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
    >
      {confirmed ? "Incident confirmé" : loading ? "Confirmation..." : "Confirmer incident"}
    </button>
  );
}