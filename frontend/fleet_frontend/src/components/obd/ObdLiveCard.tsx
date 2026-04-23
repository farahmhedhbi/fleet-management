"use client";

import ObdIndicators from "@/components/obd/ObdIndicators";
import VehicleHealthBadge from "@/components/obd/VehicleHealthBadge";
import type { VehicleObdLiveDTO } from "@/types/obd";

interface Props {
  data: VehicleObdLiveDTO;
}

function formatTimestamp(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
}

export default function ObdLiveCard({ data }: Props) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            État OBD — {data.registrationNumber}
          </h2>
          <p className="text-sm text-slate-500">
            Dernière mise à jour : {formatTimestamp(data.timestamp)}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              data.engineOn
                ? "bg-blue-100 text-blue-700"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {data.engineOn ? "Moteur ON" : "Moteur OFF"}
          </span>

          <VehicleHealthBadge status={data.obdStatus} />
        </div>
      </div>

      <ObdIndicators
        engineRpm={data.engineRpm}
        fuelLevel={data.fuelLevel}
        engineTemperature={data.engineTemperature}
        batteryVoltage={data.batteryVoltage}
        engineLoad={data.engineLoad}
        checkEngineOn={Boolean(data.checkEngineOn)}
      />
    </div>
  );
}