"use client";

import { DispatchSuggestionDTO } from "@/types/dispatch";

interface Props {
  result: DispatchSuggestionDTO | null;
}

export default function DispatchResult({ result }: Props) {
  if (!result) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-center text-gray-500">
        Aucun résultat pour le moment.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-white p-5 shadow-sm border">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Résultat Smart Dispatch
            </h2>
            <p className="text-sm text-gray-500">{result.mode}</p>
          </div>

          <div className="rounded-xl bg-blue-50 px-4 py-2 text-blue-700 font-bold">
            Score {result.score}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl bg-gray-50 p-4">
            <p className="text-sm text-gray-500">Véhicule proposé</p>
            <p className="text-lg font-semibold">{result.vehiclePlate}</p>
            <p className="text-xs text-gray-400">ID: {result.vehicleId}</p>
          </div>

          <div className="rounded-xl bg-gray-50 p-4">
            <p className="text-sm text-gray-500">Driver proposé</p>
            <p className="text-lg font-semibold">{result.driverName}</p>
            <p className="text-xs text-gray-400">ID: {result.driverId}</p>
          </div>
        </div>

        {result.returnToDepotSuggested && (
          <div className="mt-4 rounded-xl bg-orange-50 p-4 text-orange-700">
            Retour dépôt conseillé.
          </div>
        )}
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm border">
        <h3 className="font-bold text-gray-900 mb-3">Pourquoi ce choix ?</h3>

        {result.reasons.length === 0 ? (
          <p className="text-gray-500 text-sm">Aucune raison détaillée.</p>
        ) : (
          <ul className="space-y-2">
            {result.reasons.map((reason, index) => (
              <li key={index} className="text-sm text-green-700">
                ✅ {reason}
              </li>
            ))}
          </ul>
        )}

        {result.warnings.length > 0 && (
          <div className="mt-4">
            <h4 className="font-semibold text-red-700 mb-2">Alertes</h4>
            <ul className="space-y-2">
              {result.warnings.map((warning, index) => (
                <li key={index} className="text-sm text-red-600">
                  ⚠️ {warning}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm border">
        <h3 className="font-bold text-gray-900 mb-4">Planning proposé</h3>

        <div className="space-y-3">
          {result.steps.map((step, index) => (
            <div
              key={index}
              className="rounded-xl border bg-gray-50 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
            >
              <div>
                <span className="text-xs font-bold text-blue-600">
                  {step.type}
                </span>
                <p className="font-semibold text-gray-900">{step.label}</p>
                <p className="text-sm text-gray-500">
                  {step.fromCity} {step.toCity ? `→ ${step.toCity}` : ""}
                </p>
              </div>

              <div className="text-sm text-gray-600">
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