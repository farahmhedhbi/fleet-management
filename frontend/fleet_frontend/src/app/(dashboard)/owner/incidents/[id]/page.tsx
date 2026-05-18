/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Loader2,
  MapPin,
  Wrench,
  ExternalLink,
} from "lucide-react";

import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { incidentService } from "@/lib/services/incidentService";
import { maintenanceService } from "@/lib/services/maintenanceService";
import type {
  IncidentDTO,
  IncidentHistoryDTO,
  IncidentStatus,
} from "@/types/incident";
import type { MaintenanceDTO } from "@/types/maintenance";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:8080";

function getFileUrl(url?: string | null) {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `${API_BASE_URL}${url}`;
}

function getIncidentPhotos(incident: IncidentDTO) {
  if (incident.photoUrls?.length > 0) {
    return incident.photoUrls.map(getFileUrl).filter(Boolean) as string[];
  }

  const fallback = getFileUrl(incident.photoUrl);
  return fallback ? [fallback] : [];
}

function historyLabel(h: IncidentHistoryDTO) {
  if (h.action === "INCIDENT_CREATED") return "Incident déclaré";
  if (h.action === "INCIDENT_CREATED_FROM_EVENT")
    return "Incident confirmé depuis une alerte";
  if (h.action === "STATUS_CHANGED") return "Changement de statut";
  return h.action;
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("fr-FR");
}

function statusBadgeClass(status: IncidentStatus) {
  switch (status) {
    case "OPEN":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "IN_PROGRESS":
      return "bg-orange-100 text-orange-700 border-orange-200";
    case "RESOLVED":
      return "bg-green-100 text-green-700 border-green-200";
    case "CLOSED":
      return "bg-slate-100 text-slate-700 border-slate-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

export default function IncidentDetailPage() {
  const params = useParams();
  const id = Number(params?.id);
  const isValidId = Number.isFinite(id) && id > 0;

  const [incident, setIncident] = useState<IncidentDTO | null>(null);
  const [history, setHistory] = useState<IncidentHistoryDTO[]>([]);
  const [linkedMaintenance, setLinkedMaintenance] =
    useState<MaintenanceDTO | null>(null);

  const [loadingIncident, setLoadingIncident] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingMaintenance, setLoadingMaintenance] = useState(false);

  const [creatingMaintenance, setCreatingMaintenance] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const loadIncident = useCallback(async () => {
    if (!isValidId) {
      setLoadingIncident(false);
      return;
    }

    try {
      setLoadingIncident(true);
      const incidentData = await incidentService.getById(id);
      setIncident(incidentData);
    } catch {
      setIncident(null);
      toast.error("Incident introuvable");
    } finally {
      setLoadingIncident(false);
    }
  }, [id, isValidId]);

  const loadHistory = useCallback(async () => {
    if (!isValidId) return;

    try {
      setLoadingHistory(true);
      const historyData = await incidentService.getHistory(id);
      setHistory(historyData);
    } catch {
      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  }, [id, isValidId]);

  const loadLinkedMaintenance = useCallback(async () => {
    if (!isValidId) return;

    try {
      setLoadingMaintenance(true);
      const maintenanceData = await maintenanceService.getByIncident(id);
      setLinkedMaintenance(maintenanceData);
    } catch {
      setLinkedMaintenance(null);
    } finally {
      setLoadingMaintenance(false);
    }
  }, [id, isValidId]);

  async function reloadAll() {
    await Promise.all([loadIncident(), loadHistory(), loadLinkedMaintenance()]);
  }

  async function createMaintenance() {
    if (!incident || !isValidId) return;

    if (linkedMaintenance) {
      toast.info("Une maintenance existe déjà pour cet incident");
      return;
    }

    try {
      setCreatingMaintenance(true);

      await maintenanceService.createFromIncident(id);

      toast.success("Maintenance créée. Incident passé en cours de traitement.");

      await reloadAll();
    } catch {
      toast.error("Impossible de créer la maintenance");
    } finally {
      setCreatingMaintenance(false);
    }
  }

  async function closeIncident() {
    if (!isValidId) return;

    try {
      setUpdatingStatus(true);

      await incidentService.updateStatus(id, "CLOSED");
      toast.success("Incident clôturé");

      await reloadAll();
    } catch {
      toast.error("Erreur clôture incident");
    } finally {
      setUpdatingStatus(false);
    }
  }

  useEffect(() => {
    if (!isValidId) {
      setLoadingIncident(false);
      return;
    }

    loadIncident();
    loadHistory();
    loadLinkedMaintenance();
  }, [isValidId, loadIncident, loadHistory, loadLinkedMaintenance]);

  const photos = incident ? getIncidentPhotos(incident) : [];

  const hasCoordinates =
    incident?.latitude != null && incident?.longitude != null;

  const googleMapsUrl = hasCoordinates
    ? `https://www.google.com/maps?q=${incident?.latitude},${incident?.longitude}`
    : null;

  return (
    <ProtectedRoute allowedRoles={["ROLE_OWNER", "ROLE_ADMIN", "ROLE_DRIVER"]}>
      <div className="min-h-screen bg-slate-50 px-4 py-6 md:px-8">
        <div className="mx-auto max-w-5xl space-y-6">
          <Link
            href="/owner/incidents"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft size={16} />
            Retour
          </Link>

          {loadingIncident ? (
            <div className="rounded-3xl border bg-white p-8 shadow-sm">
              <div className="flex items-center gap-3 text-slate-600">
                <Loader2 className="animate-spin" size={22} />
                Chargement incident...
              </div>
            </div>
          ) : !incident ? (
            <div className="rounded-3xl border bg-white p-8 text-red-600 shadow-sm">
              Incident introuvable
            </div>
          ) : (
            <>
              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="bg-gradient-to-r from-red-600 to-orange-500 p-6 text-white">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="mb-3 inline-flex rounded-full bg-white/20 px-4 py-1 text-xs font-black">
                        Détail incident
                      </div>

                      <h1 className="text-3xl font-black">{incident.title}</h1>

                      <p className="mt-2 text-sm text-white/90">
                        {incident.description || "Aucune description fournie."}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <span className="rounded-full bg-white px-4 py-2 text-xs font-black text-orange-700">
                        {incident.severity}
                      </span>

                      <span
                        className={`rounded-full border px-4 py-2 text-xs font-black ${statusBadgeClass(
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
                    <div className="mb-3 flex items-center gap-2 font-black text-slate-900">
                      Véhicule
                    </div>

                    <p className="text-sm text-slate-500">Matricule</p>
                    <p className="mt-1 text-lg font-black text-slate-950">
                      {incident.vehicleRegistrationNumber ?? "-"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                    <div className="mb-3 flex items-center gap-2 font-black text-slate-900">
                      Mission
                    </div>

                    <p className="text-sm text-slate-500">Mission liée</p>
                    <p className="mt-1 text-lg font-black text-slate-950">
                      {incident.missionTitle ?? "-"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-blue-100 bg-blue-50 p-6 shadow-sm">
                <div className="mb-3 flex items-center gap-2 font-black text-blue-800">
                  <MapPin size={20} />
                  Position de l’incident
                </div>

                {incident.locationName ? (
                  <p className="text-sm font-bold text-blue-900">
                    {incident.locationName}
                  </p>
                ) : hasCoordinates ? (
                  <div className="space-y-2 text-sm text-blue-900">
                    <p>
                      Latitude :{" "}
                      <span className="font-black">{incident.latitude}</span>
                    </p>

                    <p>
                      Longitude :{" "}
                      <span className="font-black">{incident.longitude}</span>
                    </p>

                    {googleMapsUrl && (
                      <a
                        href={googleMapsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-black text-white hover:bg-blue-700"
                      >
                        Ouvrir sur Google Maps
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                ) : (
                  <p className="text-sm font-bold text-blue-900">
                    Position inconnue
                  </p>
                )}
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-black text-slate-900">
                  Photos de l’incident
                </h2>

                {photos.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {photos.map((src, index) => (
                      <img
                        key={`${src}-${index}`}
                        src={src}
                        alt={`Photo incident ${index + 1}`}
                        className="h-64 w-full rounded-xl border object-cover"
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">
                    Aucune photo ajoutée pour cet incident.
                  </p>
                )}
              </div>

              {loadingMaintenance ? (
                <div className="rounded-3xl border bg-white p-6 text-sm text-slate-500 shadow-sm">
                  Chargement maintenance liée...
                </div>
              ) : linkedMaintenance ? (
                <div className="rounded-3xl border border-orange-200 bg-orange-50 p-6 shadow-sm">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="flex items-center gap-2 font-black text-orange-800">
                        <Wrench size={18} />
                        Maintenance liée
                      </div>

                      <p className="mt-1 text-sm font-semibold text-orange-700">
                        #{linkedMaintenance.id} - {linkedMaintenance.title}
                      </p>

                      <p className="mt-1 text-xs text-orange-600">
                        Statut maintenance : {linkedMaintenance.status}
                      </p>
                    </div>

                    <Link
                      href={`/owner/maintenances/${linkedMaintenance.id}`}
                      className="rounded-xl bg-orange-600 px-4 py-2 text-xs font-black text-white hover:bg-orange-700"
                    >
                      Voir maintenance
                    </Link>
                  </div>
                </div>
              ) : incident.status === "OPEN" ? (
                <div className="rounded-3xl border border-orange-200 bg-orange-50 p-6 shadow-sm">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="flex items-center gap-2 font-black text-orange-800">
                        <Wrench size={18} />
                        Action recommandée
                      </div>

                      <p className="mt-1 text-sm text-orange-700">
                        Créer une maintenance pour traiter cet incident.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={createMaintenance}
                      disabled={creatingMaintenance || !!linkedMaintenance}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-2 text-xs font-black text-white hover:bg-orange-700 disabled:opacity-50"
                    >
                      {creatingMaintenance ? "Création..." : "Créer maintenance"}
                    </button>
                  </div>
                </div>
              ) : null}

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <Clock3 className="text-blue-600" size={20} />
                  <h2 className="text-lg font-black text-slate-900">
                    Historique de l’incident
                  </h2>
                </div>

                {loadingHistory ? (
                  <p className="text-sm text-slate-500">
                    Chargement historique...
                  </p>
                ) : history.length > 0 ? (
                  <div className="space-y-4">
                    {history.map((h, index) => (
                      <div key={h.id} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="h-3 w-3 rounded-full bg-blue-600" />
                          {index !== history.length - 1 && (
                            <div className="h-full min-h-10 w-px bg-slate-300" />
                          )}
                        </div>

                        <div className="flex-1 pb-2">
                          <p className="text-sm font-bold text-slate-800">
                            {historyLabel(h)}
                          </p>

                          {h.comment && (
                            <p className="mt-1 text-xs text-slate-500">
                              {h.comment}
                            </p>
                          )}

                          {h.oldStatus && h.newStatus && (
                            <p className="mt-1 text-xs font-semibold text-slate-600">
                              {h.oldStatus} → {h.newStatus}
                            </p>
                          )}

                          <p className="mt-1 text-xs text-slate-400">
                            {h.userEmail ?? "Système"} •{" "}
                            {formatDate(h.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">
                    Aucun historique disponible.
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                {incident.status === "RESOLVED" && (
                  <button
                    type="button"
                    onClick={closeIncident}
                    disabled={updatingStatus}
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-700 px-4 py-2 text-sm font-black text-white hover:bg-slate-800 disabled:opacity-50"
                  >
                    {updatingStatus ? (
                      <Loader2 className="animate-spin" size={15} />
                    ) : (
                      <CheckCircle2 size={15} />
                    )}
                    CLOSED
                  </button>
                )}

                {incident.status === "IN_PROGRESS" && (
                  <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-semibold text-orange-700">
                    Incident en cours : terminez la maintenance liée pour le
                    résoudre automatiquement.
                  </div>
                )}

                {incident.status === "CLOSED" && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">
                    Incident clôturé.
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}