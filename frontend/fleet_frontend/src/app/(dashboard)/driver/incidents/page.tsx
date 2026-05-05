"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ClipboardList,
  Eye,
  FileWarning,
  PlusCircle,
} from "lucide-react";
import { toast } from "react-toastify";

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
    case "OPEN":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "IN_PROGRESS":
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case "RESOLVED":
      return "bg-green-100 text-green-700 border-green-200";
    case "CLOSED":
      return "bg-gray-100 text-gray-700 border-gray-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

export default function DriverIncidentsPage() {
  const [incidents, setIncidents] = useState<IncidentDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await incidentService.getMine();
        setIncidents(data);
      } catch {
        toast.error("Erreur chargement incidents");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const stats = useMemo(() => {
    return {
      total: incidents.length,
      critical: incidents.filter((i) => i.severity === "CRITICAL").length,
      open: incidents.filter(
        (i) => i.status === "OPEN" || i.status === "IN_PROGRESS"
      ).length,
    };
  }, [incidents]);

  return (
    <ProtectedRoute allowedRoles={["ROLE_DRIVER"]}>
      <div className="min-h-screen bg-slate-50 px-4 py-6 md:px-8">
        <div className="mx-auto max-w-6xl space-y-6">
          
          {/* HEADER */}
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="bg-gradient-to-r from-red-600 to-orange-500 p-6 text-white">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-sm font-medium">
                    <FileWarning size={16} />
                    Espace Driver
                  </div>

                  <h1 className="text-2xl font-bold md:text-3xl">
                    Mes Incidents
                  </h1>

                  <p className="mt-2 max-w-2xl text-sm text-white/90">
                    Consultez les incidents liés à vos missions.
                  </p>
                </div>

                <Link
                  href="/driver/incidents/new"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-red-600 shadow-sm transition hover:bg-red-50"
                >
                  <PlusCircle size={18} />
                  Déclarer incident
                </Link>
              </div>
            </div>

            {/* STATS */}
            <div className="grid gap-4 p-6 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                <p className="text-sm text-slate-500">Total incidents</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {stats.total}
                </p>
              </div>

              <div className="rounded-2xl border border-red-100 bg-red-50 p-5">
                <p className="text-sm text-red-600">Critiques</p>
                <p className="mt-2 text-3xl font-bold text-red-700">
                  {stats.critical}
                </p>
              </div>

              <div className="rounded-2xl border border-orange-100 bg-orange-50 p-5">
                <p className="text-sm text-orange-600">
                  En cours / ouverts
                </p>
                <p className="mt-2 text-3xl font-bold text-orange-700">
                  {stats.open}
                </p>
              </div>
            </div>
          </div>

          {/* LOADING */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border bg-white p-5 shadow-sm"
                >
                  <div className="h-5 w-48 animate-pulse bg-slate-200 rounded" />
                </div>
              ))}
            </div>
          ) : incidents.length === 0 ? (
            
            /* EMPTY STATE */
            <div className="rounded-3xl border bg-white p-10 text-center shadow-sm">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
                <AlertTriangle className="text-red-600" size={34} />
              </div>

              <h2 className="text-xl font-bold text-slate-900">
                Aucun incident trouvé
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Aucun incident pour le moment.
              </p>
            </div>

          ) : (
            
            /* LIST */
            <div className="space-y-4">
              {incidents.map((i) => (
                <div
                  key={i.id}
                  className="rounded-3xl border bg-white p-5 shadow-sm hover:shadow-md transition"
                >
                  <div className="flex flex-col md:flex-row md:justify-between gap-4">
                    
                    <div className="flex gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50">
                        <ClipboardList className="text-red-600" size={24} />
                      </div>

                      <div>
                        <h2 className="text-lg font-bold text-slate-900">
                          {i.title}
                        </h2>

                        <p className="text-sm text-slate-500">
                          {i.description || "Aucune description"}
                        </p>

                        <div className="mt-3 flex gap-2 flex-wrap">
                          <span className="px-3 py-1 text-xs bg-slate-100 rounded-full">
                            {i.type}
                          </span>

                          <span
                            className={`px-3 py-1 text-xs rounded-full border ${statusClass(
                              i.status
                            )}`}
                          >
                            {i.status}
                          </span>

                          <span
                            className={`px-3 py-1 text-xs rounded-full border ${severityClass(
                              i.severity
                            )}`}
                          >
                            {i.severity}
                          </span>
                        </div>

                        <p className="mt-2 text-sm text-slate-500">
                          Mission: {i.missionTitle ?? "-"}
                        </p>
                      </div>
                    </div>

                    <Link
                      href={`/driver/incidents/${i.id}`}
                      className="flex items-center gap-2 text-sm text-red-600 font-semibold hover:underline"
                    >
                      <Eye size={16} />
                      Détail
                    </Link>

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