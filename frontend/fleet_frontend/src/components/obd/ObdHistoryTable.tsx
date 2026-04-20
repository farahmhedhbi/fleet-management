"use client";

import type { ObdHistoryItem } from "@/types/obd";

interface Props {
  data: ObdHistoryItem[];
}

function formatValue(value: number | null | undefined, suffix = "") {
  if (value === null || value === undefined) return "-";
  return `${value}${suffix}`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

export default function ObdHistoryTable({ data }: Props) {
  return (
    <div className="overflow-x-auto rounded-2xl border bg-white shadow-sm">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-100">
          <tr>
            <th className="px-4 py-3 text-left">Date</th>
            <th className="px-4 py-3 text-left">RPM</th>
            <th className="px-4 py-3 text-left">Fuel</th>
            <th className="px-4 py-3 text-left">Température</th>
            <th className="px-4 py-3 text-left">Batterie</th>
            <th className="px-4 py-3 text-left">Charge moteur</th>
            <th className="px-4 py-3 text-left">Check Engine</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item.id} className="border-t">
              <td className="px-4 py-3">{formatDate(item.timestamp)}</td>
              <td className="px-4 py-3">{formatValue(item.engineRpm)}</td>
              <td className="px-4 py-3">{formatValue(item.fuelLevel, "%")}</td>
              <td className="px-4 py-3">{formatValue(item.engineTemperature, "°C")}</td>
              <td className="px-4 py-3">{formatValue(item.batteryVoltage, "V")}</td>
              <td className="px-4 py-3">{formatValue(item.engineLoad, "%")}</td>
              <td className="px-4 py-3">
                {item.checkEngine ? (
                  <span className="rounded-full bg-red-100 px-3 py-1 text-red-700">
                    ON
                  </span>
                ) : (
                  <span className="rounded-full bg-green-100 px-3 py-1 text-green-700">
                    OFF
                  </span>
                )}
              </td>
            </tr>
          ))}

          {data.length === 0 && (
            <tr>
              <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                Aucun historique OBD trouvé.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}