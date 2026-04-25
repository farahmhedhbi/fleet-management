"use client";

import VehicleHealthBadge from "@/components/obd/VehicleHealthBadge";
import type { VehicleHealthSummaryDTO } from "@/types/obd-alert";

interface Props {
  data: VehicleHealthSummaryDTO;
}

function ValueCard({
  label,
  value,
  danger,
}: {
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p
        className={`mt-1 text-xl font-bold ${
          danger ? "text-red-600" : "text-slate-900"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

export default function VehicleHealthSummaryCard({ data }: Props) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Résumé santé véhicule</h3>
          <p className="text-sm text-slate-500">{data.registrationNumber}</p>
        </div>
        <VehicleHealthBadge status={data.obdStatus} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <ValueCard label="Alertes actives" value={String(data.activeAlertsCount)} />
        <ValueCard label="Carburant" value={`${data.fuelLevel ?? "--"}%`} />
        <ValueCard
          label="Température"
          value={`${data.engineTemperature ?? "--"}°C`}
        />
        <ValueCard label="Batterie" value={`${data.batteryVoltage ?? "--"}V`} />
        <ValueCard
          label="Check Engine"
          value={data.checkEngineOn ? "ON" : "OFF"}
          danger={data.checkEngineOn}
        />
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-medium text-slate-700">Recommandation</p>
        <p className="mt-1 text-sm text-slate-600">{data.maintenanceHint}</p>
      </div>
    </div>
  );
}