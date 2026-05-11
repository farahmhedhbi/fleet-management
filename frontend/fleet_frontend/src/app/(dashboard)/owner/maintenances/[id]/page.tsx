"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Car,
  CheckCircle2,
  Clock3,
  DollarSign,
  Loader2,
  Wrench,
} from "lucide-react";
import { toast } from "react-toastify";

import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { maintenanceService } from "@/lib/services/maintenanceService";
import type { MaintenanceDTO, MaintenanceStatus } from "@/types/maintenance";

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("fr-FR");
}

function statusColor(status: MaintenanceStatus) {
  switch (status) {
    case "DONE":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "IN_PROGRESS":
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case "OVERDUE":
      return "bg-orange-100 text-orange-700 border-orange-200";
    case "CANCELED":
      return "bg-red-100 text-red-700 border-red-200";
    case "PLANNED":
    default:
      return "bg-blue-100 text-blue-700 border-blue-200";
  }
}

function priorityColor(priority: string) {
  switch (priority) {
    case "CRITICAL":
      return "bg-red-100 text-red-700 border-red-200";
    case "HIGH":
      return "bg-orange-100 text-orange-700 border-orange-200";
    case "MEDIUM":
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case "LOW":
    default:
      return "bg-green-100 text-green-700 border-green-200";
  }
}

export default function MaintenanceDetailPage() {
  const params = useParams();
  const id = Number(params?.id);
  const isValidId = Number.isFinite(id) && id > 0;

  const [item, setItem] = useState<MaintenanceDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  async function load() {
    if (!isValidId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setItem(await maintenanceService.getById(id));
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Erreur chargement maintenance"
      );
      setItem(null);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(status: MaintenanceStatus) {
    if (!item) return;

    try {
      setUpdating(true);
      await maintenanceService.updateStatus(item.id, status);

      if (status === "IN_PROGRESS") toast.success("Maintenance démarrée");
      else if (status === "DONE") toast.success("Maintenance terminée");
      else toast.success("Statut mis à jour");

      await load();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Impossible de modifier le statut"
      );
    } finally {
      setUpdating(false);
    }
  }

  async function cancel() {
    if (!item) return;

    try {
      setUpdating(true);
      await maintenanceService.cancel(item.id);
      toast.success("Maintenance annulée");
      await load();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Impossible d'annuler la maintenance"
      );
    } finally {
      setUpdating(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  return (
    <ProtectedRoute allowedRoles={["ROLE_OWNER", "ROLE_ADMIN"]}>
      <div className="min-h-screen bg-slate-50 px-4 py-6 md:px-8">
        <div className="mx-auto max-w-5xl space-y-6">
          <Link
            href="/owner/maintenances"
            className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:underline"
          >
            <ArrowLeft size={16} />
            Retour maintenances
          </Link>

          {loading ? (
            <div className="rounded-3xl border bg-white p-8 shadow-sm">
              <div className="flex items-center gap-3 text-slate-600">
                <Loader2 className="animate-spin" />
                Chargement maintenance...
              </div>
            </div>
          ) : !item ? (
            <div className="rounded-3xl border bg-white p-8 text-red-600 shadow-sm">
              Maintenance introuvable
            </div>
          ) : (
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="bg-gradient-to-r from-blue-700 to-cyan-500 p-6 text-white">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h1 className="text-2xl font-black">{item.title}</h1>
                    <p className="mt-1 text-sm text-white/90">
                      Maintenance #{item.id} • {item.type}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`rounded-full border px-4 py-2 text-xs font-black ${statusColor(
                        item.status
                      )}`}
                    >
                      {item.status}
                    </span>

                    <span
                      className={`rounded-full border px-4 py-2 text-xs font-black ${priorityColor(
                        item.priority
                      )}`}
                    >
                      {item.priority}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 p-6 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                  <h2 className="mb-4 font-black text-slate-800">
                    Informations générales
                  </h2>

                  <div className="space-y-3 text-sm">
                    <p>
                      <Car size={15} className="mr-2 inline text-blue-600" />
                      Véhicule : {item.vehicleRegistrationNumber ?? "-"}
                    </p>
                    <p>
                      <Wrench size={15} className="mr-2 inline text-blue-600" />
                      Type : {item.type}
                    </p>
                    <p>
                      <Calendar size={15} className="mr-2 inline text-blue-600" />
                      Début prévu : {formatDate(item.plannedDate)}
                    </p>
                    <p>
                      <Calendar size={15} className="mr-2 inline text-blue-600" />
                      Fin / intervention : {formatDate(item.maintenanceDate)}
                    </p>
                    <p>
                      <DollarSign size={15} className="mr-2 inline text-blue-600" />
                      Coût : {item.cost != null ? `${item.cost} DT` : "-"}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                  <h2 className="mb-4 font-black text-slate-800">
                    Statut & suivi
                  </h2>

                  <div className="space-y-3 text-sm">
                    <p>
                      {item.status === "DONE" && (
                        <CheckCircle2
                          size={15}
                          className="mr-2 inline text-emerald-600"
                        />
                      )}
                      {item.status === "IN_PROGRESS" && (
                        <Wrench
                          size={15}
                          className="mr-2 inline text-yellow-600"
                        />
                      )}
                      {item.status === "OVERDUE" && (
                        <AlertTriangle
                          size={15}
                          className="mr-2 inline text-orange-600"
                        />
                      )}
                      {item.status === "PLANNED" && (
                        <Clock3
                          size={15}
                          className="mr-2 inline text-blue-600"
                        />
                      )}
                      Statut : {item.status}
                    </p>

                    <p>Date terminée : {formatDate(item.completedAt)}</p>
                    <p>Kilométrage : {item.mileage ?? "-"}</p>
                    <p>Créée par : {item.createdByEmail ?? "-"}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-5 px-6 pb-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <h2 className="mb-3 font-black text-slate-800">
                    Description
                  </h2>
                  <p className="text-sm text-slate-600">
                    {item.description || "Aucune description"}
                  </p>
                </div>

                {item.incidentId && (
                  <div className="rounded-2xl border border-orange-200 bg-orange-50 p-5">
                    <h2 className="mb-3 font-black text-orange-800">
                      Incident lié
                    </h2>

                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <p className="font-semibold text-orange-800">
                        #{item.incidentId} - {item.incidentTitle ?? "Incident"}
                      </p>

                      <Link
                        href={`/owner/incidents/${item.incidentId}`}
                        className="rounded-xl bg-orange-600 px-4 py-2 text-xs font-black text-white hover:bg-orange-700"
                      >
                        Voir incident
                      </Link>
                    </div>
                  </div>
                )}

                {item.workOrderId && (
                  <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
                    <h2 className="mb-3 font-black text-blue-800">
                      Work Order lié
                    </h2>

                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <p className="font-semibold text-blue-800">
                        #{item.workOrderId} -{" "}
                        {item.workOrderTitle ?? "Intervention garage"}
                      </p>

                      <Link
                        href={`/owner/maintenance-work-orders/${item.workOrderId}`}
                        className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-black text-white hover:bg-blue-700"
                      >
                        Voir WorkOrder
                      </Link>
                    </div>
                  </div>
                )}

                {item.status !== "DONE" && item.status !== "CANCELED" && (
                  <div className="flex flex-wrap gap-3">
                    {(item.status === "PLANNED" ||
                      item.status === "OVERDUE") && (
                      <button
                        onClick={() => updateStatus("IN_PROGRESS")}
                        disabled={updating}
                        className="rounded-xl bg-yellow-600 px-4 py-2 text-sm font-black text-white hover:bg-yellow-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {updating ? "CHARGEMENT..." : "START"}
                      </button>
                    )}

                    {item.status === "IN_PROGRESS" && (
                      <button
                        onClick={() => updateStatus("DONE")}
                        disabled={updating}
                        className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-black text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {updating ? "CHARGEMENT..." : "DONE"}
                      </button>
                    )}

                    <button
                      onClick={cancel}
                      disabled={updating}
                      className="rounded-xl bg-red-600 px-4 py-2 text-sm font-black text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {updating ? "CHARGEMENT..." : "CANCEL"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}