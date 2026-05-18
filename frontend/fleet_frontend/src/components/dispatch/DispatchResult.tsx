"use client";

import type { DispatchSuggestionDTO } from "@/types/dispatch";

interface Props {
  result: DispatchSuggestionDTO | null;
}

export default function DispatchResult({ result }: Props) {
  if (!result) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
        Aucun résultat pour le moment.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">
              Résultat Smart Assignment
            </h2>
            <p className="text-sm text-slate-500">{result.mode}</p>
          </div>

          <div className="rounded-2xl bg-blue-50 px-4 py-2 font-extrabold text-blue-700">
            Score {result.score}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Véhicule proposé</p>
            <p className="text-lg font-bold text-slate-900">
              {result.vehiclePlate}
            </p>
            <p className="text-xs text-slate-400">ID: {result.vehicleId}</p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Driver proposé</p>
            <p className="text-lg font-bold text-slate-900">
              {result.driverName}
            </p>
            <p className="text-xs text-slate-400">ID: {result.driverId}</p>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="font-extrabold text-slate-900">Pourquoi ce choix ?</h3>

        {result.reasons.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">
            Aucune raison détaillée.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {result.reasons.map((reason, index) => (
              <li key={index} className="text-sm font-medium text-emerald-700">
                ✅ {reason}
              </li>
            ))}
          </ul>
        )}

        {result.warnings.length > 0 && (
          <div className="mt-5">
            <h4 className="font-bold text-red-700">Alertes</h4>
            <ul className="mt-2 space-y-2">
              {result.warnings.map((warning, index) => (
                <li key={index} className="text-sm font-medium text-red-600">
                  ⚠️ {warning}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 font-extrabold text-slate-900">
          Mission proposée
        </h3>

        <div className="space-y-3">
          {result.steps.map((step, index) => (
            <div
              key={index}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
            >
              <span className="text-xs font-bold text-blue-600">
                {step.type}
              </span>

              <p className="mt-1 font-bold text-slate-900">{step.label}</p>

              <p className="text-sm text-slate-500">
                {step.fromCity} {step.toCity ? `→ ${step.toCity}` : ""}
              </p>

              <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-slate-600 md:grid-cols-2">
                <p>Début : {formatDate(step.startTime)}</p>
                <p>Fin : {formatDate(step.endTime)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function formatDate(value?: string) {
  if (!value) return "-";
  return new Date(value).toLocaleString("fr-FR");
}