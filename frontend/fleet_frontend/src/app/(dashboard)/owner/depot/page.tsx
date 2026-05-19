"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  Loader2,
  ParkingCircle,
  Pencil,
  PowerOff,
  Search,
  MapPin,
} from "lucide-react";

import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { ownerDepotService } from "@/lib/services/ownerDepotService";
import { placeService, type PlaceSuggestion } from "@/lib/services/placeService";

import type {
  CreateDepotRequest,
  DepotVehicleDTO,
  OwnerDepot,
} from "@/types/depot";

const DepotMap = dynamic(() => import("@/components/depot/DepotMap"), {
  ssr: false,
});

type DepotVehicleWithReturnDecision = DepotVehicleDTO & {
  returnToDepotSuggested?: boolean;
  vehicleStaysWithDriver?: boolean;
  nextDayDecisionRequired?: boolean;
  returnDepotReason?: string | null;
  fuelLevel?: number | null;
};

export default function OwnerDepotPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [depot, setDepot] = useState<OwnerDepot | null>(null);
  const [vehicles, setVehicles] = useState<DepotVehicleWithReturnDecision[]>(
    []
  );
  const [showForm, setShowForm] = useState(false);

  const [placeQuery, setPlaceQuery] = useState("");
  const [placeLoading, setPlaceLoading] = useState(false);
  const [placeSuggestions, setPlaceSuggestions] = useState<PlaceSuggestion[]>(
    []
  );

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

        setPlaceQuery(
          depotData.address || depotData.city || depotData.name || ""
        );

        const vehicleData = await ownerDepotService.getDepotVehicles();
        setVehicles(vehicleData as DepotVehicleWithReturnDecision[]);
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
        .then((data) =>
          setVehicles(data as DepotVehicleWithReturnDecision[])
        )
        .catch(() => {});
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const query = placeQuery.trim();

    if (query.length < 3) {
      setPlaceSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setPlaceLoading(true);
        const results = await placeService.search(query);
        setPlaceSuggestions(results || []);
      } catch {
        setPlaceSuggestions([]);
      } finally {
        setPlaceLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [placeQuery]);

  function selectPlace(place: PlaceSuggestion) {
    const lat = Number(place.lat);
    const lng = Number(place.lon);

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      toast.error("Position invalide pour ce lieu");
      return;
    }

    setForm((prev) => ({
      ...prev,
      name: prev.name || place.label || "Dépôt",
      city: place.value || prev.city,
      address: place.displayName || place.label || prev.address,
      latitude: lat,
      longitude: lng,
    }));

    setPlaceQuery(place.displayName || place.label || "");
    setPlaceSuggestions([]);

    toast.success("Position du dépôt mise à jour");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      setSaving(true);

      const saved = await ownerDepotService.createOrUpdateDepot(form);

      setDepot(saved);
      setShowForm(false);
      toast.success("Dépôt enregistré avec succès");

      const vehicleData = await ownerDepotService.getDepotVehicles();
      setVehicles(vehicleData as DepotVehicleWithReturnDecision[]);
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
      <div className="space-y-6 p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold">
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
                type="button"
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 rounded-lg border px-4 py-2 hover:bg-gray-50"
              >
                <Pencil className="h-4 w-4" />
                Modifier dépôt
              </button>

              <button
                type="button"
                onClick={handleDisableDepot}
                className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
              >
                <PowerOff className="h-4 w-4" />
                Désactiver dépôt
              </button>
            </div>
          )}
        </div>

        {!hasActiveDepot && !showForm && (
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="mb-2 text-xl font-semibold">
              Aucun dépôt configuré
            </h2>

            <p className="mb-5 text-gray-500">
              Vous pouvez créer un dépôt ou choisir de ne pas utiliser cette
              fonctionnalité.
            </p>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="rounded-lg bg-blue-600 px-5 py-2 text-white hover:bg-blue-700"
              >
                Créer un dépôt
              </button>

              <button
                type="button"
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

            <div className="relative">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Rechercher l’emplacement du dépôt
              </label>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                <input
                  type="text"
                  className="w-full rounded-lg border px-10 py-2 outline-none focus:border-blue-500"
                  placeholder="Exemple : Sousse, Capgemini Sousse, Sahloul..."
                  value={placeQuery}
                  onChange={(e) => setPlaceQuery(e.target.value)}
                />

                {placeLoading && (
                  <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-gray-400" />
                )}
              </div>

              {placeSuggestions.length > 0 && (
                <div className="absolute z-[9999] mt-2 max-h-72 w-full overflow-y-auto rounded-xl border bg-white shadow-lg">
                  {placeSuggestions.map((place, index) => (
                    <button
                      type="button"
                      key={`${place.lat}-${place.lon}-${index}`}
                      onClick={() => selectPlace(place)}
                      className="flex w-full gap-3 border-b px-4 py-3 text-left hover:bg-blue-50"
                    >
                      <MapPin className="mt-1 h-4 w-4 shrink-0 text-blue-600" />

                      <div>
                        <p className="font-medium text-gray-900">
                          {place.label || "Lieu"}
                        </p>

                        <p className="text-sm text-gray-500">
                          {place.displayName || place.value}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <input
                className="rounded-lg border px-3 py-2"
                placeholder="Nom dépôt"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />

              <input
                className="rounded-lg border px-3 py-2"
                placeholder="Ville"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
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

            <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-sm text-blue-700">
              Latitude et longitude sont remplies automatiquement après le choix
              du lieu. Tu peux aussi déplacer le dépôt directement sur la map.
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
                  setForm((prev) => ({
                    ...prev,
                    latitude: lat,
                    longitude: lng,
                  }))
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
                      <th className="py-2">Décision retour</th>
                    </tr>
                  </thead>

                  <tbody>
                    {vehicles.map((v) => (
                      <tr key={v.vehicleId} className="border-b align-top">
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

                        <td className="py-3">
                          <ReturnDecisionBadge vehicle={v} />
                        </td>
                      </tr>
                    ))}

                    {vehicles.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
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

function ReturnDecisionBadge({
  vehicle,
}: {
  vehicle: DepotVehicleWithReturnDecision;
}) {
  if (vehicle.status === "PARKED") {
    return (
      <div className="space-y-1">
        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
          Déjà au dépôt
        </span>
        <p className="text-xs text-gray-500">Aucun retour nécessaire.</p>
      </div>
    );
  }

  if (vehicle.status === "NO_GPS") {
    return (
      <div className="space-y-1">
        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
          GPS indisponible
        </span>
        <p className="text-xs text-gray-500">
          Impossible d’analyser la distance.
        </p>
      </div>
    );
  }

  if (vehicle.status === "ON_MISSION") {
    return (
      <div className="space-y-1">
        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
          En mission
        </span>
        <p className="text-xs text-gray-500">
          Analyse retour après fin mission.
        </p>
      </div>
    );
  }

  if (vehicle.returnToDepotSuggested) {
    return (
      <div className="space-y-1">
        <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700">
          Retour dépôt possible
        </span>
        <p className="text-xs text-gray-500">
          {vehicle.returnDepotReason || "Véhicule proche du dépôt."}
        </p>
      </div>
    );
  }

  if (vehicle.vehicleStaysWithDriver) {
    return (
      <div className="space-y-1">
        <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
          Reste avec driver
        </span>
        <p className="text-xs text-gray-500">
          {vehicle.returnDepotReason || "Retour dépôt non recommandé."}
        </p>

        {vehicle.nextDayDecisionRequired && (
          <p className="text-xs font-semibold text-yellow-700">
            Décision requise demain.
          </p>
        )}
      </div>
    );
  }

  if (
    vehicle.distanceFromDepotKm != null &&
    vehicle.distanceFromDepotKm > 30
  ) {
    return (
      <div className="space-y-1">
        <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
          Trop loin du dépôt
        </span>
        <p className="text-xs text-gray-500">
          Distance supérieure à 30 km.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
        Non analysé
      </span>
      <p className="text-xs text-gray-500">
        Backend doit envoyer la décision retour.
      </p>
    </div>
  );
}