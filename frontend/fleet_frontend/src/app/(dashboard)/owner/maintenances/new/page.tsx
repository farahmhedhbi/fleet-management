"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Plus, Wrench } from "lucide-react";

import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { maintenanceService } from "@/lib/services/maintenanceService";
import { vehicleService } from "@/lib/services/vehicleService";
import type { MaintenanceStatus, MaintenanceType } from "@/types/maintenance";

type VehicleOption = {
  id: number;
  registrationNumber?: string | null;
  brand?: string | null;
  model?: string | null;
};

function toLocalDateTime(value: string) {
  if (!value) return undefined;
  return value.length === 16 ? `${value}:00` : value;
}

function vehicleLabel(v: VehicleOption) {
  const plate = v.registrationNumber ?? `Véhicule #${v.id}`;
  const info = [v.brand, v.model].filter(Boolean).join(" ");
  return info ? `${plate} - ${info}` : plate;
}

export default function NewMaintenancePage() {
  const router = useRouter();

  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);

  const [vehicleId, setVehicleId] = useState("");
  const [type, setType] = useState<MaintenanceType>("OIL_CHANGE");
  const [status, setStatus] = useState<MaintenanceStatus>("PLANNED");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [plannedDate, setPlannedDate] = useState("");
  const [maintenanceDate, setMaintenanceDate] = useState("");
  const [mileage, setMileage] = useState("");
  const [cost, setCost] = useState("");
  const [loading, setLoading] = useState(false);

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

  const selectedVehicle = useMemo(() => {
    return vehicles.find((v) => String(v.id) === vehicleId);
  }, [vehicles, vehicleId]);

  async function submit(e: FormEvent) {
    e.preventDefault();

    if (!vehicleId) {
      toast.error("Sélectionne un véhicule");
      return;
    }

    if (!title.trim()) {
      toast.error("Titre obligatoire");
      return;
    }

    try {
      setLoading(true);

      await maintenanceService.create({
        vehicleId: Number(vehicleId),
        type,
        status,
        title: title.trim(),
        description: description.trim() || undefined,
        plannedDate: toLocalDateTime(plannedDate),
        maintenanceDate: toLocalDateTime(maintenanceDate),
        mileage: mileage ? Number(mileage) : undefined,
        cost: cost ? Number(cost) : undefined,
      });

      toast.success("Maintenance créée");
      router.push("/owner/maintenances");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Erreur création maintenance"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <ProtectedRoute allowedRoles={["ROLE_OWNER", "ROLE_ADMIN"]}>
      <div className="min-h-screen bg-slate-50 px-4 py-6 md:px-8">
        <div className="mx-auto max-w-4xl space-y-6">
          <Link
            href="/owner/maintenances"
            className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:underline"
          >
            <ArrowLeft size={16} />
            Retour maintenances
          </Link>

          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="bg-gradient-to-r from-blue-700 via-cyan-600 to-emerald-500 p-6 text-white">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-sm font-bold">
                <Wrench size={16} />
                Nouvelle maintenance
              </div>

              <h1 className="text-2xl font-black md:text-3xl">
                Ajouter une maintenance
              </h1>

              <p className="mt-2 max-w-2xl text-sm text-white/90">
                Choisis le véhicule concerné, le type d’intervention, la date et
                les informations techniques.
              </p>
            </div>

            <form onSubmit={submit} className="space-y-5 p-6">
              <div>
                <label className="mb-1 block text-sm font-bold text-slate-600">
                  Véhicule concerné
                </label>

                <select
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value)}
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

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-bold text-slate-600">
                    Type
                  </label>
                  <select
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-blue-400 focus:bg-white"
                    value={type}
                    onChange={(e) => setType(e.target.value as MaintenanceType)}
                  >
                    <option value="OIL_CHANGE">Vidange</option>
                    <option value="ENGINE_CHECK">Contrôle moteur</option>
                    <option value="BRAKE_CHECK">Contrôle freins</option>
                    <option value="BATTERY_CHECK">Batterie</option>
                    <option value="TIRE_CHANGE">Pneus</option>
                    <option value="TECHNICAL_INSPECTION">
                      Visite technique
                    </option>
                    <option value="REPAIR">Réparation</option>
                    <option value="OTHER">Autre</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-bold text-slate-600">
                    Statut
                  </label>
                  <select
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-blue-400 focus:bg-white"
                    value={status}
                    onChange={(e) =>
                      setStatus(e.target.value as MaintenanceStatus)
                    }
                  >
                    <option value="PLANNED">Planifiée</option>
                    <option value="DONE">Effectuée</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-slate-600">
                  Titre
                </label>
                <input
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-blue-400 focus:bg-white"
                  placeholder="Ex: Vidange moteur"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-slate-600">
                  Description
                </label>
                <textarea
                  className="min-h-[110px] w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-blue-400 focus:bg-white"
                  placeholder="Détails, pièces à vérifier, remarques..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-bold text-slate-600">
                    Date prévue
                  </label>
                  <input
                    type="datetime-local"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-blue-400 focus:bg-white"
                    value={plannedDate}
                    onChange={(e) => setPlannedDate(e.target.value)}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-bold text-slate-600">
                    Date maintenance
                  </label>
                  <input
                    type="datetime-local"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-blue-400 focus:bg-white"
                    value={maintenanceDate}
                    onChange={(e) => setMaintenanceDate(e.target.value)}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-bold text-slate-600">
                    Kilométrage
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-blue-400 focus:bg-white"
                    placeholder="Ex: 120000"
                    value={mileage}
                    onChange={(e) => setMileage(e.target.value)}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-bold text-slate-600">
                    Coût
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-blue-400 focus:bg-white"
                    placeholder="Ex: 250"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                  />
                </div>
              </div>

              <button
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 p-3 text-sm font-black text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Création...
                  </>
                ) : (
                  <>
                    <Plus size={18} />
                    Créer maintenance
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}