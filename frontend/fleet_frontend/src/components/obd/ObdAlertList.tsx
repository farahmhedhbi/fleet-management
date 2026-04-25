"use client";

import type { ObdAlertDTO } from "@/types/obd-alert";

interface Props {
  alerts: ObdAlertDTO[];
}

function getAlertLabel(code: string) {
  switch (code) {
    case "LOW_FUEL_WARNING":
      return "Carburant faible";
    case "LOW_FUEL_CRITICAL":
      return "Carburant critique";
    case "HIGH_TEMP_WARNING":
      return "Température moteur élevée";
    case "HIGH_TEMP_CRITICAL":
      return "Température moteur critique";
    case "LOW_BATTERY_WARNING":
      return "Batterie faible";
    case "LOW_BATTERY_CRITICAL":
      return "Batterie critique";
    case "CHECK_ENGINE_ON":
      return "Voyant moteur activé";
    default:
      return code;
  }
}

export default function ObdAlertList({ alerts }: Props) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-bold text-slate-900">Alertes techniques</h3>

      {alerts.length === 0 ? (
        <p className="text-sm text-slate-500">Aucune alerte active.</p>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => {
            const isCritical = alert.severity === "CRITICAL";

            const style = isCritical
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-amber-200 bg-amber-50 text-amber-700";

            return (
              <div key={alert.code} className={`rounded-2xl border p-4 ${style}`}>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold">
                    {getAlertLabel(alert.code)}
                  </span>
                  <span className="rounded-full bg-white/70 px-2 py-1 text-xs font-bold">
                    {alert.severity}
                  </span>
                </div>

                <p className="mt-2 text-sm">{alert.message}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}