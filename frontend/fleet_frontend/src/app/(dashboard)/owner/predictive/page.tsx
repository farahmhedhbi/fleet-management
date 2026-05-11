"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Brain,
  CheckCircle2,
  Loader2,
  RefreshCcw,
  ShieldAlert,
  Wrench,
} from "lucide-react";
import { toast } from "react-toastify";

import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { predictiveService } from "@/lib/services/predictiveService";
import type { PredictiveAlertDTO } from "@/types/predictive";

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("fr-FR");
}

function riskLabel(level: string) {
  switch (level) {
    case "CRITICAL":
      return "Critique";
    case "HIGH":
      return "Élevé";
    case "WARNING":
      return "Attention";
    case "NORMAL":
      return "Normal";
    default:
      return level;
  }
}

function riskClasses(level: string) {
  switch (level) {
    case "CRITICAL":
      return "bg-red-100 text-red-700 border-red-200";
    case "HIGH":
      return "bg-orange-100 text-orange-700 border-orange-200";
    case "WARNING":
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case "NORMAL":
      return "bg-green-100 text-green-700 border-green-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

function scoreBarClasses(level: string) {
  switch (level) {
    case "CRITICAL":
      return "bg-red-500";
    case "HIGH":
      return "bg-orange-500";
    case "WARNING":
      return "bg-yellow-500";
    case "NORMAL":
      return "bg-green-500";
    default:
      return "bg-gray-500";
  }
}

function predictionLabel(type: string) {
  switch (type) {
    case "ENGINE_FAILURE_RISK":
      return "Risque panne moteur";
    case "BATTERY_REPLACEMENT_RISK":
      return "Risque batterie";
    case "HIGH_TEMPERATURE_RISK":
      return "Température élevée";
    case "LOW_FUEL_RISK":
      return "Risque carburant";
    case "MAINTENANCE_RECOMMENDED":
      return "Maintenance recommandée";
    case "DRIVER_RISK_BEHAVIOR":
      return "Comportement conducteur risqué";
    case "OFF_ROUTE_REPEATED":
      return "Sorties de route répétées";
    case "OVERSPEED_REPEATED":
      return "Excès de vitesse répétés";
    default:
      return type;
  }
}

export default function OwnerPredictivePage() {
  const [alerts, setAlerts] = useState<PredictiveAlertDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState<number | null>(null);

  async function load() {
    try {
      setLoading(true);
      const data = await predictiveService.getActive();
      setAlerts(data);
    } catch {
      toast.error("Erreur chargement alertes IA");
    } finally {
      setLoading(false);
    }
  }

  async function resolveAlert(id: number) {
    try {
      setResolvingId(id);
      await predictiveService.resolve(id);
      toast.success("Alerte IA résolue");
      await load();
    } catch {
      toast.error("Impossible de résoudre cette alerte");
    } finally {
      setResolvingId(null);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const stats = useMemo(() => {
    const critical = alerts.filter((a) => a.riskLevel === "CRITICAL").length;
    const high = alerts.filter((a) => a.riskLevel === "HIGH").length;
    const warning = alerts.filter((a) => a.riskLevel === "WARNING").length;

    const average =
      alerts.length === 0
        ? 0
        : Math.round(
            alerts.reduce((sum, item) => sum + item.riskScore, 0) /
              alerts.length
          );

    return { critical, high, warning, average };
  }, [alerts]);

  return (
    <ProtectedRoute allowedRoles={["ROLE_OWNER", "ROLE_ADMIN"]}>
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex flex-col justify-between gap-4 rounded-3xl bg-white p-6 shadow-sm md:flex-row md:items-center">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-indigo-100 p-3 text-indigo-700">
                <Brain size={28} />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Analyse prédictive IA
                </h1>
                <p className="text-sm text-slate-500">
                  Suivi intelligent des risques véhicules et comportements
                  conducteurs.
                </p>
              </div>
            </div>

            <button
              onClick={load}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <RefreshCcw size={18} />
              )}
              Actualiser
            </button>
          </div>

          <section className="grid gap-4 md:grid-cols-4">
            <div className="rounded-3xl bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">Alertes critiques</p>
                <ShieldAlert className="text-red-500" size={22} />
              </div>
              <p className="mt-3 text-3xl font-bold text-slate-900">
                {stats.critical}
              </p>
            </div>

            <div className="rounded-3xl bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">Risques élevés</p>
                <AlertTriangle className="text-orange-500" size={22} />
              </div>
              <p className="mt-3 text-3xl font-bold text-slate-900">
                {stats.high}
              </p>
            </div>

            <div className="rounded-3xl bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">Warnings</p>
                <AlertTriangle className="text-yellow-500" size={22} />
              </div>
              <p className="mt-3 text-3xl font-bold text-slate-900">
                {stats.warning}
              </p>
            </div>

            <div className="rounded-3xl bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">Score moyen</p>
                <Brain className="text-indigo-500" size={22} />
              </div>
              <p className="mt-3 text-3xl font-bold text-slate-900">
                {stats.average}%
              </p>
            </div>
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-lg font-bold text-slate-900">
                Alertes IA actives
              </h2>
              <p className="text-sm text-slate-500">
                Résultats générés par Python IA à partir des données GPS, OBD,
                incidents et maintenance.
              </p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16 text-slate-500">
                <Loader2 className="mr-2 animate-spin" size={22} />
                Chargement des alertes IA...
              </div>
            ) : alerts.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 p-10 text-center">
                <CheckCircle2
                  className="mx-auto mb-3 text-green-500"
                  size={40}
                />
                <h3 className="text-lg font-semibold text-slate-900">
                  Aucune alerte IA active
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  La flotte ne présente pas de risque prédictif actif.
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {alerts.map((alert) => (
                  <article
                    key={alert.id}
                    className="rounded-3xl border border-slate-200 p-5 transition hover:shadow-md"
                  >
                    <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-bold ${riskClasses(
                              alert.riskLevel
                            )}`}
                          >
                            {riskLabel(alert.riskLevel)}
                          </span>

                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                            Véhicule #{alert.vehicleId}
                          </span>

                          <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                            {predictionLabel(alert.type)}
                          </span>
                        </div>

                        <div>
                          <h3 className="text-lg font-bold text-slate-900">
                            {alert.title}
                          </h3>
                          <p className="mt-1 text-sm leading-6 text-slate-600">
                            {alert.message}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-slate-50 p-4">
                          <div className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-900">
                            <Wrench size={18} />
                            Recommandation IA
                          </div>
                          <p className="text-sm leading-6 text-slate-600">
                            {alert.recommendation}
                          </p>
                        </div>

                        <p className="text-xs text-slate-400">
                          Créée le : {formatDate(alert.createdAt)}
                        </p>
                      </div>

                      <div className="w-full lg:w-64">
                        <div className="rounded-3xl bg-slate-50 p-4">
                          <div className="mb-2 flex items-center justify-between">
                            <span className="text-sm font-semibold text-slate-600">
                              Risk Score
                            </span>
                            <span className="text-xl font-bold text-slate-900">
                              {alert.riskScore}%
                            </span>
                          </div>

                          <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                            <div
                              className={`h-full rounded-full ${scoreBarClasses(
                                alert.riskLevel
                              )}`}
                              style={{
                                width: `${Math.min(alert.riskScore, 100)}%`,
                              }}
                            />
                          </div>

                          <button
                            onClick={() => resolveAlert(alert.id)}
                            disabled={resolvingId === alert.id}
                            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100 disabled:opacity-60"
                          >
                            {resolvingId === alert.id ? (
                              <Loader2 className="animate-spin" size={18} />
                            ) : (
                              <CheckCircle2 size={18} />
                            )}
                            Marquer résolue
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </ProtectedRoute>
  );
}