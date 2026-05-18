"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Banknote,
  CheckCircle2,
  Loader2,
  Plus,
  Search,
  Wrench,
} from "lucide-react";
import { toast } from "react-toastify";

import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { maintenanceService } from "@/lib/services/maintenanceService";
import { maintenanceWorkOrderService } from "@/lib/services/maintenanceWorkOrderService";
import { vehicleService } from "@/lib/services/vehicleService";
import type { MaintenanceDTO } from "@/types/maintenance";

type VehicleOption = {
  id: number;
  registrationNumber?: string | null;
  brand?: string | null;
  model?: string | null;
  status?: string | null;
};

function toLocalDateTime(value: string) {
  if (!value) return undefined;
  return value.length === 16 ? `${value}:00` : value;
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("fr-FR");
}

function vehicleLabel(v: VehicleOption) {
  const plate = v.registrationNumber ?? `Véhicule #${v.id}`;
  const info = [v.brand, v.model].filter(Boolean).join(" ");
  return info ? `${plate} - ${info}` : plate;
}

function priorityClass(priority: string) {
  switch (priority) {
    case "CRITICAL":
      return "border-l-red-500 bg-red-50";
    case "HIGH":
      return "border-l-orange-500 bg-orange-50";
    case "MEDIUM":
      return "border-l-yellow-500 bg-yellow-50";
    case "LOW":
    default:
      return "border-l-emerald-500 bg-emerald-50";
  }
}

function statusBadgeClass(status: string) {
  switch (status) {
    case "IN_PROGRESS":
      return "bg-yellow-100 text-yellow-700";
    case "OVERDUE":
      return "bg-orange-100 text-orange-700";
    case "DONE":
      return "bg-emerald-100 text-emerald-700";
    case "CANCELED":
      return "bg-red-100 text-red-700";
    case "PLANNED":
    default:
      return "bg-blue-100 text-blue-700";
  }
}

export default function NewMaintenanceWorkOrderPage() {
  const router = useRouter();

  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);

  const [vehicleId, setVehicleId] = useState("");
  const [title, setTitle] = useState("");
  const [garageName, setGarageName] = useState("");
  const [notes, setNotes] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [estimatedDurationDays, setEstimatedDurationDays] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("");
  const [selectedMaintenanceIds, setSelectedMaintenanceIds] = useState<number[]>(
    []
  );

  const [maintenances, setMaintenances] = useState<MaintenanceDTO[]>([]);
  const [loadingMaintenances, setLoadingMaintenances] = useState(false);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadVehicles() {
      try {
        setLoadingVehicles(true);
        const data = await vehicleService.getAll();
        setVehicles(data ?? []);
      } catch (error: any) {
        toast.error(
          error?.response?.data?.message ||
            error?.response?.data?.error ||
            "Erreur chargement véhicules"
        );
      } finally {
        setLoadingVehicles(false);
      }
    }

    loadVehicles();
  }, []);

  async function loadMaintenancesByVehicle(id: string) {
    const parsedVehicleId = Number(id);

    if (!parsedVehicleId || parsedVehicleId <= 0) {
      setMaintenances([]);
      setSelectedMaintenanceIds([]);
      return;
    }

    try {
      setLoadingMaintenances(true);

      const data = await maintenanceService.getByVehicle(parsedVehicleId);

      const available = data.filter(
        (m) => m.status !== "DONE" && m.status !== "CANCELED" && !m.workOrderId
      );

      setMaintenances(available);
      setSelectedMaintenanceIds([]);

      if (available.length === 0) {
        toast.info("Aucune maintenance disponible pour ce véhicule");
      } else {
        toast.success(`${available.length} maintenance(s) disponible(s)`);
      }
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Erreur chargement maintenances véhicule"
      );
    } finally {
      setLoadingMaintenances(false);
    }
  }

  function handleVehicleChange(value: string) {
    setVehicleId(value);
    loadMaintenancesByVehicle(value);
  }

  function toggleMaintenance(id: number) {
    setSelectedMaintenanceIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function submit(e: FormEvent) {
    e.preventDefault();

    const parsedVehicleId = Number(vehicleId);

    if (!parsedVehicleId || parsedVehicleId <= 0) {
      toast.error("Sélectionne un véhicule");
      return;
    }

    if (!title.trim()) {
      toast.error("Titre WorkOrder obligatoire");
      return;
    }

    if (selectedMaintenanceIds.length === 0) {
      toast.error("Sélectionne au moins une maintenance");
      return;
    }

    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      toast.error("La date de fin doit être après la date de début");
      return;
    }

    try {
      setCreating(true);

      await maintenanceWorkOrderService.create({
        vehicleId: parsedVehicleId,
        title: title.trim(),
        garageName: garageName.trim() || undefined,
        notes: notes.trim() || undefined,
        startDate: toLocalDateTime(startDate),
        endDate: toLocalDateTime(endDate),
        estimatedDurationDays: estimatedDurationDays
          ? Number(estimatedDurationDays)
          : undefined,
        estimatedCost: estimatedCost ? Number(estimatedCost) : undefined,
        maintenanceIds: selectedMaintenanceIds,
      });

      toast.success("WorkOrder créé");
      router.push("/owner/maintenance-work-orders");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Erreur création WorkOrder"
      );
    } finally {
      setCreating(false);
    }
  }

  const selectedVehicle = useMemo(() => {
    return vehicles.find((v) => String(v.id) === vehicleId);
  }, [vehicles, vehicleId]);

  const filteredMaintenances = useMemo(() => {
    const q = search.trim().toLowerCase();

    return maintenances.filter((m) => {
      if (!q) return true;

      return (
        m.title.toLowerCase().includes(q) ||
        m.type.toLowerCase().includes(q) ||
        m.priority.toLowerCase().includes(q) ||
        m.status.toLowerCase().includes(q) ||
        (m.incidentTitle ?? "").toLowerCase().includes(q)
      );
    });
  }, [maintenances, search]);

  const selectedMaintenances = useMemo(() => {
    return maintenances.filter((m) => selectedMaintenanceIds.includes(m.id));
  }, [maintenances, selectedMaintenanceIds]);

  const selectedCount = selectedMaintenanceIds.length;

  const totalEstimatedCost = useMemo(() => {
    return selectedMaintenances.reduce((sum, m) => sum + (m.cost ?? 0), 0);
  }, [selectedMaintenances]);

  const criticalCount = useMemo(() => {
    return selectedMaintenances.filter((m) => m.priority === "CRITICAL").length;
  }, [selectedMaintenances]);

  return (
    <ProtectedRoute allowedRoles={["ROLE_OWNER", "ROLE_ADMIN"]}>
      <div className="min-h-screen bg-slate-50 px-4 py-6 md:px-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <Link
            href="/owner/maintenance-work-orders"
            className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:underline"
          >
            <ArrowLeft size={16} />
            Retour WorkOrders
          </Link>

          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="bg-gradient-to-r from-blue-700 via-cyan-600 to-emerald-500 p-6 text-white">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-sm font-bold">
                    <Wrench size={16} />
                    Nouveau WorkOrder
                  </div>

                  <h1 className="text-2xl font-black md:text-3xl">
                    Créer une intervention garage
                  </h1>

                  <p className="mt-2 max-w-2xl text-sm text-white/90">
                    Choisis un véhicule, sélectionne ses maintenances disponibles
                    puis crée une intervention garage.
                  </p>
                </div>

                <div className="rounded-2xl bg-white/20 px-5 py-4 text-sm font-bold ring-1 ring-white/30">
                  {selectedCount} tâche(s) sélectionnée(s)
                </div>
              </div>
            </div>

            <div className="grid gap-4 p-6 md:grid-cols-3">
              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
                <p className="text-sm font-semibold text-blue-600">
                  Sélectionnées
                </p>
                <p className="mt-2 text-3xl font-black text-blue-700">
                  {selectedCount}
                </p>
              </div>

              <div className="rounded-2xl border border-red-100 bg-red-50 p-5">
                <p className="text-sm font-semibold text-red-600">Critiques</p>
                <p className="mt-2 text-3xl font-black text-red-700">
                  {criticalCount}
                </p>
              </div>

              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
                <p className="text-sm font-semibold text-emerald-600">
                  Coût tâches
                </p>
                <p className="mt-2 text-3xl font-black text-emerald-700">
                  {totalEstimatedCost > 0 ? `${totalEstimatedCost} DT` : "-"}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_380px]">
            <div className="space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 flex items-center gap-2 font-black text-slate-900">
                  <Plus size={18} />
                  Informations WorkOrder
                </h2>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-sm font-bold text-slate-600">
                      Véhicule concerné
                    </label>

                    <select
                      value={vehicleId}
                      onChange={(e) => handleVehicleChange(e.target.value)}
                      disabled={loadingVehicles}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-blue-400 focus:bg-white disabled:opacity-60"
                    >
                      <option value="">
                        {loadingVehicles
                          ? "Chargement des véhicules..."
                          : "Sélectionner un véhicule"}
                      </option>

                      {vehicles.map((v) => (
                        <option key={v.id} value={v.id}>
                          {vehicleLabel(v)}
                        </option>
                      ))}
                    </select>

                    {selectedVehicle && (
                      <p className="mt-2 text-xs font-semibold text-slate-500">
                        Véhicule sélectionné :{" "}
                        <span className="text-blue-700">
                          {vehicleLabel(selectedVehicle)}
                        </span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-bold text-slate-600">
                      Titre
                    </label>
                    <input
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-blue-400 focus:bg-white"
                      placeholder="Ex: Intervention garage moteur"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-bold text-slate-600">
                      Garage
                    </label>
                    <input
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-blue-400 focus:bg-white"
                      placeholder="Nom du garage"
                      value={garageName}
                      onChange={(e) => setGarageName(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-bold text-slate-600">
                      Coût estimé
                    </label>
                    <input
                      type="number"
                      min="0"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-blue-400 focus:bg-white"
                      placeholder="Ex: 250"
                      value={estimatedCost}
                      onChange={(e) => setEstimatedCost(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-bold text-slate-600">
                      Durée estimée en jours
                    </label>
                    <input
                      type="number"
                      min="1"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-blue-400 focus:bg-white"
                      placeholder="Ex: 2"
                      value={estimatedDurationDays}
                      onChange={(e) => setEstimatedDurationDays(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-bold text-slate-600">
                      Début intervention
                    </label>
                    <input
                      type="datetime-local"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-blue-400 focus:bg-white"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-bold text-slate-600">
                      Fin intervention
                    </label>
                    <input
                      type="datetime-local"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-blue-400 focus:bg-white"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-1 block text-sm font-bold text-slate-600">
                      Notes
                    </label>
                    <textarea
                      className="min-h-[110px] w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-blue-400 focus:bg-white"
                      placeholder="Notes, instructions garage, pièces à vérifier..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <h2 className="flex items-center gap-2 font-black text-slate-900">
                    <Wrench size={18} />
                    Maintenances disponibles
                  </h2>

                  <div className="relative w-full md:max-w-xs">
                    <Search
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Rechercher tâche..."
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-400 focus:bg-white"
                    />
                  </div>
                </div>

                {!vehicleId ? (
                  <div className="rounded-2xl border bg-slate-50 p-8 text-center text-sm text-slate-500">
                    Sélectionne d’abord un véhicule pour afficher ses maintenances
                    disponibles.
                  </div>
                ) : loadingMaintenances ? (
                  <div className="rounded-2xl border bg-slate-50 p-6">
                    <div className="flex items-center gap-3 text-slate-600">
                      <Loader2 className="animate-spin" size={20} />
                      Chargement maintenances...
                    </div>
                  </div>
                ) : filteredMaintenances.length === 0 ? (
                  <div className="rounded-2xl border bg-slate-50 p-8 text-center text-sm text-slate-500">
                    Aucune maintenance disponible pour ce véhicule.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredMaintenances.map((m) => {
                      const checked = selectedMaintenanceIds.includes(m.id);

                      return (
                        <label
                          key={m.id}
                          className={`flex cursor-pointer flex-col gap-3 rounded-2xl border border-l-4 p-4 transition hover:shadow-sm md:flex-row md:items-center md:justify-between ${priorityClass(
                            m.priority
                          )} ${checked ? "ring-2 ring-blue-400" : ""}`}
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              className="mt-1 h-4 w-4"
                              checked={checked}
                              onChange={() => toggleMaintenance(m.id)}
                            />

                            <div>
                              <p className="font-black text-slate-900">
                                #{m.id} - {m.title}
                              </p>

                              <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold">
                                <span className="rounded-full bg-white px-2 py-1 text-slate-600">
                                  {m.type}
                                </span>

                                <span className="rounded-full bg-white px-2 py-1 text-slate-600">
                                  {m.priority}
                                </span>

                                <span
                                  className={`rounded-full px-2 py-1 ${statusBadgeClass(
                                    m.status
                                  )}`}
                                >
                                  {m.status}
                                </span>

                                {m.incidentId && (
                                  <span className="rounded-full bg-orange-100 px-2 py-1 text-orange-700">
                                    Incident #{m.incidentId}
                                  </span>
                                )}
                              </div>

                              <p className="mt-2 text-xs text-slate-500">
                                Planifiée : {formatDate(m.plannedDate)}
                              </p>
                            </div>
                          </div>

                          <div className="text-sm font-black text-slate-700">
                            {m.cost != null ? `${m.cost} DT` : "-"}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="sticky top-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 flex items-center gap-2 font-black text-slate-900">
                  <CheckCircle2 size={18} />
                  Résumé
                </h2>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-500">Véhicule</span>
                    <b className="text-right">
                      {selectedVehicle ? vehicleLabel(selectedVehicle) : "-"}
                    </b>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-500">Tâches</span>
                    <b>{selectedCount}</b>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-500">Critiques</span>
                    <b className={criticalCount > 0 ? "text-red-600" : ""}>
                      {criticalCount}
                    </b>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-500">Coût tâches</span>
                    <b>
                      {totalEstimatedCost > 0
                        ? `${totalEstimatedCost} DT`
                        : "-"}
                    </b>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-500">Coût WorkOrder</span>
                    <b>{estimatedCost ? `${estimatedCost} DT` : "-"}</b>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-500">Début</span>
                    <b className="text-right">{startDate || "-"}</b>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-500">Fin</span>
                    <b className="text-right">{endDate || "-"}</b>
                  </div>
                </div>

                <div className="mt-6 rounded-2xl bg-slate-50 p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-black text-slate-800">
                    <Banknote size={16} />
                    Conseil
                  </div>
                  <p className="text-xs leading-5 text-slate-500">
                    Un WorkOrder regroupe seulement les maintenances non terminées
                    du véhicule sélectionné.
                  </p>
                </div>

                <button
                  disabled={creating}
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 p-3 text-sm font-black text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {creating ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Création...
                    </>
                  ) : (
                    <>
                      <Plus size={18} />
                      Créer WorkOrder
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
}