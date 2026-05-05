"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { ArrowLeft, AlertTriangle, Car, ClipboardList, ShieldAlert } from "lucide-react";

import { incidentService } from "@/lib/services/incidentService";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import type { IncidentDTO } from "@/types/incident";

function severityClass(severity?: string) {
  switch (severity) {
    case "CRITICAL":
      return "bg-red-100 text-red-700 border-red-200";
    case "HIGH":
      return "bg-orange-100 text-orange-700 border-orange-200";
    case "MEDIUM":
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case "LOW":
      return "bg-green-100 text-green-700 border-green-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

function statusClass(status?: string) {
  switch (status) {
    case "REPORTED":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "VALIDATED":
      return "bg-purple-100 text-purple-700 border-purple-200";
    case "IN_PROGRESS":
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case "RESOLVED":
      return "bg-green-100 text-green-700 border-green-200";
    case "REJECTED":
      return "bg-gray-100 text-gray-700 border-gray-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

export default function DriverIncidentDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const id = Number(params.id);

  const [incident, setIncident] = useState<IncidentDTO | null>(null);
  const [loading, setLoading] = useState(true);

  const isValidId = useMemo(() => !!id && !Number.isNaN(id), [id]);

  useEffect(() => {
    async function load() {
      if (!isValidId) {
        setLoading(false);
        return;
      }

      try {
        const data = await incidentService.getById(id);
        setIncident(data);
      } catch {
        toast.error("Incident introuvable");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id, isValidId]);

  return (
    <ProtectedRoute allowedRoles={["ROLE_DRIVER"]}>
      <div className="min-h-screen bg-slate-50 px-4 py-6 md:px-8">
        <div className="mx-auto max-w-5xl space-y-6">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-100"
          >
            <ArrowLeft size={18} />
            Retour
          </button>

          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="h-6 w-48 animate-pulse rounded bg-slate-200" />
              <div className="mt-4 h-4 w-full animate-pulse rounded bg-slate-100" />
              <div className="mt-2 h-4 w-3/4 animate-pulse rounded bg-slate-100" />
            </div>
          ) : !incident ? (
            <div className="rounded-2xl border border-red-100 bg-white p-8 text-center shadow-sm">
              <AlertTriangle className="mx-auto mb-3 text-red-500" size={36} />
              <h2 className="text-lg font-bold text-slate-900">
                Incident introuvable
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Aucun incident ne correspond à cet identifiant.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="bg-gradient-to-r from-red-600 to-orange-500 p-6 text-white">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-sm font-medium">
                        <ShieldAlert size={16} />
                        Détail incident
                      </div>

                      <h1 className="text-2xl font-bold md:text-3xl">
                        {incident.title}
                      </h1>

                      <p className="mt-2 max-w-3xl text-sm text-white/90">
                        {incident.description || "Aucune description fournie."}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-bold ${severityClass(
                          incident.severity
                        )}`}
                      >
                        {incident.severity}
                      </span>

                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-bold ${statusClass(
                          incident.status
                        )}`}
                      >
                        {incident.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 p-6 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                    <div className="mb-3 flex items-center gap-2 text-slate-700">
                      <Car size={20} className="text-red-600" />
                      <h2 className="font-bold">Véhicule</h2>
                    </div>

                    <p className="text-sm text-slate-500">Matricule</p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">
                      {incident.vehicleRegistrationNumber ?? "-"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                    <div className="mb-3 flex items-center gap-2 text-slate-700">
                      <ClipboardList size={20} className="text-red-600" />
                      <h2 className="font-bold">Mission</h2>
                    </div>

                    <p className="text-sm text-slate-500">Mission liée</p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">
                      {incident.missionTitle ?? "-"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-bold text-slate-900">
                  Informations générales
                </h2>

                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <p className="text-xs font-medium uppercase text-slate-400">
                      Type
                    </p>
                    <p className="mt-1 font-semibold text-slate-800">
                      {incident.type ?? "-"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase text-slate-400">
                      Source
                    </p>
                    <p className="mt-1 font-semibold text-slate-800">
                      {incident.source ?? "-"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase text-slate-400">
                      Urgence
                    </p>
                    <p className="mt-1 font-semibold text-slate-800">
                      {incident.emergency ? "Oui" : "Non"}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}