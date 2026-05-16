"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { Clock3, RefreshCcw, User, CheckCircle2 } from "lucide-react";

import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { driverService } from "@/lib/services/driverService";
import type { Driver } from "@/types/driver";

function formatDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("fr-FR");
}

function remainingTime(value?: string | null) {
  if (!value) return "Non défini";

  const end = new Date(value).getTime();
  const now = Date.now();

  if (Number.isNaN(end)) return "Date invalide";

  const diff = end - now;

  if (diff <= 0) return "Repos terminé";

  const minutes = Math.ceil(diff / 60000);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;

  if (h > 0) return `${h}h ${m}min restantes`;
  return `${m}min restantes`;
}

export default function OwnerRestingDriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function loadDrivers() {
    try {
      setRefreshing(true);
      const data = await driverService.getAll();
      setDrivers(data);
    } catch (e: any) {
      toast.error(
        e?.response?.data?.message ||
          e?.response?.data?.error ||
          e?.message ||
          "Erreur chargement chauffeurs"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadDrivers();
  }, []);

  const restingDrivers = useMemo(() => {
    return drivers
      .filter((driver) => driver.status === "RESTING")
      .sort((a, b) => {
        const da = a.availableAt ? new Date(a.availableAt).getTime() : 0;
        const db = b.availableAt ? new Date(b.availableAt).getTime() : 0;
        return db - da;
      });
  }, [drivers]);

  return (
    <ProtectedRoute allowedRoles={["ROLE_OWNER"]}>
      <div className="min-h-screen bg-slate-100 p-6">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-600">
                  Driver Rest Monitoring
                </p>

                <h1 className="mt-2 text-3xl font-extrabold text-slate-900">
                  Chauffeurs en pause
                </h1>

                <p className="mt-2 text-sm text-slate-600">
                  Cette page affiche les derniers chauffeurs actuellement en repos après une mission.
                </p>
              </div>

              <button
                type="button"
                onClick={loadDrivers}
                disabled={refreshing}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 font-bold text-white hover:bg-slate-800 disabled:opacity-60"
              >
                <RefreshCcw className="h-4 w-4" />
                {refreshing ? "Actualisation..." : "Actualiser"}
              </button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <StatCard
              title="Total chauffeurs"
              value={drivers.length}
              icon={<User className="h-5 w-5" />}
            />

            <StatCard
              title="En pause"
              value={restingDrivers.length}
              icon={<Clock3 className="h-5 w-5" />}
            />

            <StatCard
              title="Disponibles"
              value={drivers.filter((d) => d.status === "AVAILABLE").length}
              icon={<CheckCircle2 className="h-5 w-5" />}
            />
          </div>

          {loading ? (
            <div className="rounded-3xl border bg-white p-8 text-slate-500 shadow-sm">
              Chargement...
            </div>
          ) : restingDrivers.length === 0 ? (
            <div className="rounded-3xl border border-dashed bg-white p-10 text-center shadow-sm">
              <Clock3 className="mx-auto h-10 w-10 text-slate-400" />
              <h2 className="mt-3 text-xl font-bold text-slate-900">
                Aucun chauffeur en pause
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Tous les chauffeurs sont disponibles ou dans un autre statut.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {restingDrivers.map((driver) => (
                <div
                  key={driver.id}
                  className="rounded-3xl border bg-white p-5 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-orange-700">
                        <Clock3 className="h-6 w-6" />
                      </div>

                      <div>
                        <h3 className="text-lg font-extrabold text-slate-900">
                          {driver.firstName} {driver.lastName}
                        </h3>

                        <p className="text-sm text-slate-500">
                          {driver.email}
                        </p>

                        <span className="mt-2 inline-flex rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-bold text-orange-700">
                          RESTING
                        </span>
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <InfoBox
                        label="Disponible à"
                        value={formatDate(driver.availableAt)}
                      />

                      <InfoBox
                        label="Temps restant"
                        value={remainingTime(driver.availableAt)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-extrabold text-slate-900">{value}</p>
        </div>

        <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">{icon}</div>
      </div>
    </div>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-bold text-slate-900">{value}</p>
    </div>
  );
}