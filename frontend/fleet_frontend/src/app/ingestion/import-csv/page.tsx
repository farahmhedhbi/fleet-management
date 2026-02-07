"use client";

import { useMemo, useState } from "react";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { Upload, FileText, CheckCircle2, AlertTriangle, Loader2, Car } from "lucide-react";

export default function ImportCsvPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  const fileLabel = useMemo(() => {
    if (!file) return "Aucun fichier sélectionné";
    return `${file.name} • ${(file.size / 1024).toFixed(1)} KB`;
  }, [file]);

  async function upload() {
    if (!file) {
      setMsg({ type: "error", text: "Choisir un fichier CSV d'abord." });
      return;
    }

    setLoading(true);
    setMsg(null);

    const token = localStorage.getItem("token");
    const form = new FormData();
    form.append("file", file);

    try {
      const res = await fetch("http://localhost:8080/import/csv", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: form,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg({ type: "error", text: data?.message ?? "Erreur import CSV." });
      } else {
        setMsg({
          type: "success",
          text: `Import OK — lignes stockées RAW: ${data?.rows ?? data?.count ?? "?"}`,
        });
      }
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
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-700">
                <Car className="h-4 w-4" />
                Garage • Ingestion RAW
              </div>
              <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900">
                Importer des données CSV
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Téléverse un CSV (trajets, conducteurs, incidents) pour le stocker en <b>RAW</b> dans PostgreSQL.
              </p>
            </div>
          </div>

          {/* Card */}
          <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-900 text-white">
                    <Upload className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-slate-900">Station d’import</p>
                    <p className="text-xs text-slate-600">Endpoint: <span className="font-mono">POST /import/csv</span></p>
                  </div>
                </div>
                <span className="hidden rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700 md:inline">
                  CSV → RAW
                </span>
              </div>
            </div>

            <div className="px-6 py-6">
              {/* File picker */}
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-2xl border border-slate-200 bg-white">
                      <FileText className="h-5 w-5 text-slate-700" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">Fichier CSV</p>
                      <p className="text-xs text-slate-600">{fileLabel}</p>
                    </div>
                  </div>

                  <label className="inline-flex cursor-pointer items-center justify-center rounded-2xl bg-slate-900 px-4 py-2 text-sm font-extrabold text-white shadow-sm hover:bg-slate-800">
                    Choisir un fichier
                    <input
                      type="file"
                      accept=".csv"
                      className="hidden"
                      onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    />
                  </label>
                </div>

                <p className="mt-3 text-xs text-slate-600">
                  Astuce : ton CSV devrait contenir des colonnes comme{" "}
                  <span className="font-mono">vehicle_id, driver_id, distance, duration, date</span>.
                </p>
              </div>

              {/* Actions */}
              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  onClick={upload}
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-extrabold text-white shadow-sm hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
                  {loading ? "Import en cours..." : "Importer"}
                </button>

                <div className="text-xs text-slate-600">
                  Les données seront stockées <b>sans nettoyage</b> (audit & traçabilité).
                </div>
              </div>

              {/* Message */}
              {msg && (
                <div
                  className={[
                    "mt-5 flex items-start gap-3 rounded-2xl border p-4 text-sm font-bold",
                    msg.type === "success"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                      : msg.type === "error"
                      ? "border-rose-200 bg-rose-50 text-rose-800"
                      : "border-slate-200 bg-slate-50 text-slate-800",
                  ].join(" ")}
                >
                  {msg.type === "success" ? (
                    <CheckCircle2 className="mt-0.5 h-5 w-5" />
                  ) : msg.type === "error" ? (
                    <AlertTriangle className="mt-0.5 h-5 w-5" />
                  ) : (
                    <Loader2 className="mt-0.5 h-5 w-5" />
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
