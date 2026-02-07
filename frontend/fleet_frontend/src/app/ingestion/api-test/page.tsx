"use client";

import { useMemo, useState } from "react";
import { fetchWithAuth } from "@/lib/http/fetchWithAuth";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { Radar, Send, CheckCircle2, AlertTriangle, Loader2, Gauge, CalendarDays, User, Car } from "lucide-react";

export default function ApiTestPage() {
  const [vehicleId, setVehicleId] = useState("1");
  const [driverId, setDriverId] = useState("5");
  const [distance, setDistance] = useState("120");
  const [duration, setDuration] = useState("90");
  const [date, setDate] = useState("2026-01-27");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const preview = useMemo(
    () => ({
      vehicle_id: Number(vehicleId),
      driver_id: Number(driverId),
      distance: Number(distance),
      duration: Number(duration),
      date,
    }),
    [vehicleId, driverId, distance, duration, date]
  );

  async function send() {
    setLoading(true);
    setMsg(null);

    try {
      const res = await fetchWithAuth("http://localhost:8080/api/data", {
        method: "POST",
        body: JSON.stringify(preview),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) setMsg({ type: "error", text: data?.message ?? "Erreur API." });
      else setMsg({ type: "success", text: "Données envoyées et stockées en RAW (API)." });
    } catch (e: any) {
      setMsg({ type: "error", text: "Erreur réseau: " + e.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <ProtectedRoute requiredRoles={["ROLE_ADMIN", "ROLE_OWNER"]}>
      <main className="min-h-[calc(100vh-64px)] bg-slate-50 px-4 py-8">
        <div className="mx-auto max-w-3xl">
          {/* Header */}
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-700">
              <Radar className="h-4 w-4" />
              Poste de contrôle • Télémétrie
            </div>
            <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900">
              Test d’ingestion API
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Envoie un JSON (trajet) et vérifie qu’il est stocké en <b>RAW</b>.
              Endpoint: <span className="font-mono">POST /api/data</span>
            </p>
          </div>

          {/* Card */}
          <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-900 text-white">
                  <Gauge className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-extrabold text-slate-900">Paramètres du trajet</p>
                  <p className="text-xs text-slate-600">Simulation d’un système externe (GPS / App conducteur)</p>
                </div>
              </div>
            </div>

            <div className="px-6 py-6">
              {/* Form */}
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="vehicle_id"
                  icon={<Car className="h-4 w-4" />}
                  value={vehicleId}
                  onChange={setVehicleId}
                />
                <Field
                  label="driver_id"
                  icon={<User className="h-4 w-4" />}
                  value={driverId}
                  onChange={setDriverId}
                />
                <Field
                  label="distance"
                  icon={<Gauge className="h-4 w-4" />}
                  value={distance}
                  onChange={setDistance}
                />
                <Field
                  label="duration"
                  icon={<Gauge className="h-4 w-4" />}
                  value={duration}
                  onChange={setDuration}
                />
                <Field
                  label="date"
                  icon={<CalendarDays className="h-4 w-4" />}
                  value={date}
                  onChange={setDate}
                  placeholder="YYYY-MM-DD"
                  className="sm:col-span-2"
                />
              </div>

              {/* Preview */}
              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-extrabold text-slate-700">Aperçu JSON envoyé</p>
                <pre className="mt-2 overflow-auto rounded-xl bg-white p-3 text-xs text-slate-800">
{JSON.stringify(preview, null, 2)}
                </pre>
              </div>

              {/* Actions */}
              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  onClick={send}
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-extrabold text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                  {loading ? "Envoi en cours..." : "Envoyer"}
                </button>

                <div className="text-xs text-slate-600">
                  Conseil : utilise des IDs existants (Vehicle/Driver) pour garder cohérence.
                </div>
              </div>

              {/* Message */}
              {msg && (
                <div
                  className={[
                    "mt-5 flex items-start gap-3 rounded-2xl border p-4 text-sm font-bold",
                    msg.type === "success"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                      : "border-rose-200 bg-rose-50 text-rose-800",
                  ].join(" ")}
                >
                  {msg.type === "success" ? (
                    <CheckCircle2 className="mt-0.5 h-5 w-5" />
                  ) : (
                    <AlertTriangle className="mt-0.5 h-5 w-5" />
                  )}
                  <div>{msg.text}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  icon,
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  icon: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={["flex flex-col gap-2", className].filter(Boolean).join(" ")}>
      <span className="text-xs font-extrabold text-slate-700">{label}</span>
      <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2">
        <span className="text-slate-500">{icon}</span>
        <input
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
        />
      </div>
    </label>
  );
}
