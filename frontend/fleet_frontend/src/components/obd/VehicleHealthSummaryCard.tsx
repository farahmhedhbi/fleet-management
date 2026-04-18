"use client";

import VehicleHealthBadge from "@/components/obd/VehicleHealthBadge";
import type { VehicleHealthSummaryDTO } from "@/types/obd-alert";

interface Props {
  data: VehicleHealthSummaryDTO;
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

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-sm text-slate-500">Alertes actives</p>
          <p className="mt-1 text-xl font-bold text-slate-900">{data.activeAlertsCount}</p>
        </div>

        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-sm text-slate-500">Carburant</p>
          <p className="mt-1 text-xl font-bold text-slate-900">
            {data.fuelLevel ?? "--"}%
          </p>
        </div>

        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-sm text-slate-500">Température</p>
          <p className="mt-1 text-xl font-bold text-slate-900">
            {data.engineTemperature ?? "--"}°C
          </p>
        </div>

        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-sm text-slate-500">Batterie</p>
          <p className="mt-1 text-xl font-bold text-slate-900">
            {data.batteryVoltage ?? "--"}V
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-medium text-slate-700">Recommandation</p>
        <p className="mt-1 text-sm text-slate-600">{data.maintenanceHint}</p>
      </div>
    </div>
  );
}