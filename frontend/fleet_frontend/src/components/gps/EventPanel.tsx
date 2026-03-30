"use client";

import type { VehicleEventDTO } from "@/types/gps";

interface Props {
  events: VehicleEventDTO[];
}

function getSeverityClasses(severity: string) {
  switch (severity) {
    case "CRITICAL":
      return "border-red-200 bg-red-50 text-red-700";
    case "WARNING":
      return "border-yellow-200 bg-yellow-50 text-yellow-700";
    default:
      return "border-blue-200 bg-blue-50 text-blue-700";
  }
}

export default function EventPanel({ events }: Props) {
  return (
    <div className="rounded-2xl border bg-white p-4">
      <h3 className="mb-4 text-lg font-semibold">Événements récents</h3>

      <div className="space-y-3">
        {events.length === 0 ? (
          <div className="text-sm text-gray-500">Aucun événement.</div>
        ) : (
          events.map((event) => (
            <div
              key={event.id}
              className={`rounded-xl border p-3 ${getSeverityClasses(event.severity)}`}
            >
              <div className="font-medium">{event.eventType}</div>
              <div className="text-sm">{event.message}</div>
              <div className="mt-1 text-xs opacity-80">
                Sévérité: {event.severity}
              </div>
              <div className="text-xs opacity-80">
                Date: {new Date(event.createdAt).toLocaleString()}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}