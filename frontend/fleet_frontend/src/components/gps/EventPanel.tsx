"use client";

import type { VehicleEventDTO } from "@/types/gps";
import ConfirmEventAsIncidentButton from "@/components/incidents/ConfirmEventAsIncidentButton";

interface Props {
  events: VehicleEventDTO[];
}

const INCIDENT_CONFIRMABLE_EVENTS = new Set([
  "OFF_ROUTE",
  "STOP_LONG",
  "NO_SIGNAL",
  "OVERSPEED",
  "OBD_LOW_FUEL",
  "OBD_HIGH_TEMP",
  "OBD_LOW_BATTERY",
  "OBD_CHECK_ENGINE",
  "ENGINE_FAILURE",
  "MISSION_INTERRUPTED",
  "LOW_FUEL_WARNING",
  "LOW_FUEL_CRITICAL",
  "HIGH_TEMP_WARNING",
  "HIGH_TEMP_CRITICAL",
  "LOW_BATTERY_WARNING",
  "LOW_BATTERY_CRITICAL",
  "CHECK_ENGINE_ON",
]);

function getSeverityClasses(severity: string) {
  switch (severity) {
    case "CRITICAL":
      return "border-red-200 bg-red-50 text-red-700";
    case "WARNING":
      return "border-amber-200 bg-amber-50 text-amber-700";
    default:
      return "border-blue-200 bg-blue-50 text-blue-700";
  }
}

function getEventLabel(type: string) {
  switch (type) {
    case "OBD_LOW_FUEL":
    case "LOW_FUEL_WARNING":
    case "LOW_FUEL_CRITICAL":
      return "Carburant critique";

    case "OBD_HIGH_TEMP":
    case "HIGH_TEMP_WARNING":
    case "HIGH_TEMP_CRITICAL":
      return "Température moteur critique";

    case "OBD_LOW_BATTERY":
    case "LOW_BATTERY_WARNING":
    case "LOW_BATTERY_CRITICAL":
      return "Batterie critique";

    case "OBD_CHECK_ENGINE":
    case "CHECK_ENGINE_ON":
      return "Voyant moteur activé";

    case "ENGINE_FAILURE":
      return "Panne moteur probable";

    case "MISSION_INTERRUPTED":
      return "Mission interrompue";

    case "OFF_ROUTE":
      return "Hors trajet";

    case "OVERSPEED":
      return "Excès de vitesse";

    case "ENGINE_ON":
      return "Moteur allumé";

    case "ENGINE_OFF":
      return "Moteur éteint";

    case "MISSION_STARTED":
      return "Mission démarrée";

    case "MISSION_COMPLETED":
      return "Mission terminée";

    case "STOP_LONG":
      return "Arrêt prolongé";

    case "NO_SIGNAL":
      return "Signal perdu";

    default:
      return type;
  }
}

function eventKey(event: VehicleEventDTO) {
  return event.id != null
    ? String(event.id)
    : `${event.vehicleId}-${event.missionId ?? "no-mission"}-${
        event.eventType
      }-${event.severity}-${event.createdAt}`;
}

function canConfirmAsIncident(event: VehicleEventDTO) {
  if (!event.id) return false;

  if (event.severity !== "WARNING" && event.severity !== "CRITICAL") {
    return false;
  }

  return INCIDENT_CONFIRMABLE_EVENTS.has(event.eventType);
}

export default function EventPanel({ events }: Props) {
  const visibleEvents = events
    .filter(
      (event) =>
        event.severity === "WARNING" || event.severity === "CRITICAL"
    )
    .slice(0, 50);

  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold">Événements récents</h3>

      <div className="space-y-3">
        {visibleEvents.length === 0 ? (
          <div className="text-sm text-gray-500">Aucune alerte récente.</div>
        ) : (
          visibleEvents.map((event) => (
            <div
              key={eventKey(event)}
              className={`rounded-xl border p-3 ${getSeverityClasses(
                event.severity
              )}`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="font-semibold">
                  {getEventLabel(event.eventType)}
                </div>

                <span className="rounded-full bg-white/70 px-2 py-1 text-xs font-bold">
                  {event.severity}
                </span>
              </div>

              <div className="mt-1 text-sm">
                {event.message || "Aucun message."}
              </div>

              <div className="mt-2 text-xs opacity-80">
                Véhicule #{event.vehicleId}
                {event.missionId ? ` — Mission #${event.missionId}` : ""}
              </div>

              <div className="text-xs opacity-80">
                Date :{" "}
                {event.createdAt
                  ? new Date(event.createdAt).toLocaleString()
                  : "—"}
              </div>

              {canConfirmAsIncident(event) ? (
                <div className="mt-3 flex justify-end">
                  <ConfirmEventAsIncidentButton event={event} />
                </div>
              ) : null}
            </div>
          ))
        )}
      </div>
    </div>
  );
}