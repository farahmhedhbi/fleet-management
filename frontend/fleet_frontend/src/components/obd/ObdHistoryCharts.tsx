"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { ObdHistoryItem } from "@/types/obd";

interface Props {
  data: ObdHistoryItem[];
}

function formatLabel(value: unknown): string {
  if (!value) return "";

  const date = new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString();
}

export default function ObdHistoryCharts({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">
            RPM / Température / Carburant
          </h2>
          <div className="flex h-[350px] items-center justify-center rounded-xl border border-dashed text-slate-500">
            Aucun historique disponible pour afficher le graphique.
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">
            Batterie / Charge moteur
          </h2>
          <div className="flex h-[350px] items-center justify-center rounded-xl border border-dashed text-slate-500">
            Aucun historique disponible pour afficher le graphique.
          </div>
        </div>
      </div>
    );
  }

  const chartData = data.map((item) => ({
    timestamp: item.timestamp,
    rpm: item.engineRpm ?? 0,
    fuel: item.fuelLevel ?? 0,
    temperature: item.engineTemperature ?? 0,
    battery: item.batteryVoltage ?? 0,
    load: item.engineLoad ?? 0,
  }));

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">
          RPM / Température / Carburant
        </h2>

        <div className="h-[350px] min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={formatLabel}
                minTickGap={30}
              />
              <YAxis />
              <Tooltip labelFormatter={formatLabel} />
              <Legend />
              <Line
                type="monotone"
                dataKey="rpm"
                name="RPM"
                stroke="#2563eb"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="temperature"
                name="Température °C"
                stroke="#dc2626"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="fuel"
                name="Carburant %"
                stroke="#16a34a"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">
          Batterie / Charge moteur
        </h2>

        <div className="h-[350px] min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={formatLabel}
                minTickGap={30}
              />
              <YAxis />
              <Tooltip labelFormatter={formatLabel} />
              <Legend />
              <Line
                type="monotone"
                dataKey="battery"
                name="Batterie V"
                stroke="#7c3aed"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="load"
                name="Charge moteur %"
                stroke="#ea580c"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}