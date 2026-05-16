"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Loader2, MapPin, ParkingCircle, Pencil, PowerOff } from "lucide-react";

import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { ownerDepotService } from "@/lib/services/ownerDepotService";
import type {
  CreateDepotRequest,
  DepotVehicleDTO,
  OwnerDepot,
} from "@/types/depot";

const DepotMap = dynamic(() => import("@/components/depot/DepotMap"), {
  ssr: false,
});

export default function OwnerDepotPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [depot, setDepot] = useState<OwnerDepot | null>(null);
  const [vehicles, setVehicles] = useState<DepotVehicleDTO[]>([]);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState<CreateDepotRequest>({
    name: "",
    city: "",
    address: "",
    latitude: 35.8256,
    longitude: 10.6369,
    radiusMeters: 100,
  });

  async function loadData() {
    try {
      const depotData = await ownerDepotService.getDepot();
      setDepot(depotData);

      if (depotData && depotData.enabled) {
        setForm({
          name: depotData.name || "",
          city: depotData.city || "",
          address: depotData.address || "",
          latitude: depotData.latitude,
          longitude: depotData.longitude,
          radiusMeters: depotData.radiusMeters || 100,
        });

        const vehicleData = await ownerDepotService.getDepotVehicles();
        setVehicles(vehicleData);
      } else {
        setVehicles([]);
      }
    } catch {
      toast.error("Erreur lors du chargement du dépôt");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();

    const interval = setInterval(() => {
      ownerDepotService
        .getDepotVehicles()
        .then(setVehicles)
        .catch(() => {});
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      setSaving(true);
      const saved = await ownerDepotService.createOrUpdateDepot(form);
      setDepot(saved);
      setShowForm(false);
      toast.success("Dépôt enregistré avec succès");

      const vehicleData = await ownerDepotService.getDepotVehicles();
      setVehicles(vehicleData);
    } catch {
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  }

  async function handleDisableDepot() {
    try {
      await ownerDepotService.disableDepot();
      setDepot(null);
      setVehicles([]);
      setShowForm(false);
      toast.success("Dépôt désactivé");
    } catch {
      toast.error("Erreur lors de la désactivation");
    }
  }

  const hasActiveDepot = depot && depot.enabled;

  const parked = vehicles.filter((v) => v.status === "PARKED").length;
  const outside = vehicles.filter((v) => v.status === "OUTSIDE_DEPOT").length;
  const onMission = vehicles.filter((v) => v.status === "ON_MISSION").length;
  const noGps = vehicles.filter((v) => v.status === "NO_GPS").length;

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["ROLE_OWNER"]}>
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["ROLE_OWNER"]}>
      <div className="p-6 space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ParkingCircle className="h-7 w-7" />
              Dépôt / Parking
            </h1>
            <p className="text-sm text-gray-500">
              Gestion du dépôt propriétaire et suivi temps réel des véhicules.
            </p>
          </div>

          {hasActiveDepot && (
            <div className="flex gap-2">
              <button
                onClick={() => setShowForm(true)}
                className="rounded-lg border px-4 py-2 flex items-center gap-2 hover:bg-gray-50"
              >
                <Pencil className="h-4 w-4" />
                Modifier dépôt
              </button>

              <button
                onClick={handleDisableDepot}
                className="rounded-lg bg-red-600 px-4 py-2 text-white flex items-center gap-2 hover:bg-red-700"
              >
                <PowerOff className="h-4 w-4" />
                Désactiver dépôt
              </button>
            </div>
          )}
        </div>

        {!hasActiveDepot && !showForm && (
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-2">
              Aucun dépôt configuré
            </h2>
            <p className="text-gray-500 mb-5">
              Vous pouvez créer un dépôt ou choisir de ne pas utiliser cette
              fonctionnalité.
            </p>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setShowForm(true)}
                className="rounded-lg bg-blue-600 px-5 py-2 text-white hover:bg-blue-700"
              >
                Créer un dépôt
              </button>

              <button
                onClick={() => toast.info("Le dépôt ne sera pas pris en compte")}
                className="rounded-lg border px-5 py-2 hover:bg-gray-50"
              >
                Je n’ai pas de dépôt
              </button>
            </div>
          </div>
        )}

        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="grid gap-4 rounded-2xl border bg-white p-6 shadow-sm"
          >
            <h2 className="text-xl font-semibold">
              {hasActiveDepot ? "Modifier dépôt" : "Créer un dépôt"}
            </h2>

            <div className="grid gap-4 md:grid-cols-2">
              <input
                className="rounded-lg border px-3 py-2"
                placeholder="Nom dépôt"
                value={form.name}
                onChange={(e) =>
                  setForm({ ...form, name: e.target.value })
                }
                required
              />

              <input
                className="rounded-lg border px-3 py-2"
                placeholder="Ville"
                value={form.city}
                onChange={(e) =>
                  setForm({ ...form, city: e.target.value })
                }
                required
              />

              <input
                className="rounded-lg border px-3 py-2 md:col-span-2"
                placeholder="Adresse"
                value={form.address}
                onChange={(e) =>
                  setForm({ ...form, address: e.target.value })
                }
              />

              <input
                type="number"
                step="any"
                className="rounded-lg border px-3 py-2"
                placeholder="Latitude"
                value={form.latitude}
                onChange={(e) =>
                  setForm({ ...form, latitude: Number(e.target.value) })
                }
                required
              />

              <input
                type="number"
                step="any"
                className="rounded-lg border px-3 py-2"
                placeholder="Longitude"
                value={form.longitude}
                onChange={(e) =>
                  setForm({ ...form, longitude: Number(e.target.value) })
                }
                required
              />

              <input
                type="number"
                className="rounded-lg border px-3 py-2"
                placeholder="Radius meters"
                value={form.radiusMeters}
                onChange={(e) =>
                  setForm({ ...form, radiusMeters: Number(e.target.value) })
                }
              />
            </div>

            <div className="h-[350px] overflow-hidden rounded-xl border">
              <DepotMap
                depot={{
                  id: depot?.id || 0,
                  enabled: true,
                  name: form.name || "Dépôt",
                  city: form.city,
                  address: form.address,
                  latitude: form.latitude,
                  longitude: form.longitude,
                  radiusMeters: form.radiusMeters,
                }}
                vehicles={[]}
                editable
                onDepotPositionChange={(lat, lng) =>
                  setForm({ ...form, latitude: lat, longitude: lng })
                }
              />
            </div>

            <div className="flex gap-3">
              <button
                disabled={saving}
                className="rounded-lg bg-blue-600 px-5 py-2 text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {saving ? "Enregistrement..." : "Enregistrer"}
              </button>

              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg border px-5 py-2 hover:bg-gray-50"
              >
                Annuler
              </button>
            </div>
          </form>
        )}

        {hasActiveDepot && !showForm && depot && (
          <>
            <div className="grid gap-4 md:grid-cols-4">
              <StatCard label="Parked" value={parked} />
              <StatCard label="Outside depot" value={outside} />
              <StatCard label="On mission" value={onMission} />
              <StatCard label="No GPS" value={noGps} />
            </div>

            <div className="h-[520px] overflow-hidden rounded-2xl border bg-white shadow-sm">
              <DepotMap depot={depot} vehicles={vehicles} />
            </div>

            <div className="rounded-2xl border bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold">
                Véhicules du dépôt
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="py-2">Véhicule</th>
                      <th className="py-2">Statut</th>
                      <th className="py-2">Distance</th>
                      <th className="py-2">Position</th>
                    </tr>
                  </thead>

                  <tbody>
                    {vehicles.map((v) => (
                      <tr key={v.vehicleId} className="border-b">
                        <td className="py-3 font-medium">{v.plateNumber}</td>
                        <td className="py-3">
                          <StatusBadge status={v.status} />
                        </td>
                        <td className="py-3">
                          {v.distanceFromDepotKm != null
                            ? `${v.distanceFromDepotKm.toFixed(2)} km`
                            : "-"}
                        </td>
                        <td className="py-3">
                          {v.latitude && v.longitude
                            ? `${v.latitude.toFixed(5)}, ${v.longitude.toFixed(
                                5
                              )}`
                            : "-"}
                        </td>
                      </tr>
                    ))}

                    {vehicles.length === 0 && (
                      <tr>
                        <td
                          colSpan={4}
                          className="py-6 text-center text-gray-500"
                        >
                          Aucun véhicule trouvé.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </ProtectedRoute>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const classes =
    status === "PARKED"
      ? "bg-green-100 text-green-700"
      : status === "ON_MISSION"
      ? "bg-blue-100 text-blue-700"
      : status === "OUTSIDE_DEPOT"
      ? "bg-orange-100 text-orange-700"
      : "bg-gray-100 text-gray-700";

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${classes}`}>
      {status}
    </span>
  );
}