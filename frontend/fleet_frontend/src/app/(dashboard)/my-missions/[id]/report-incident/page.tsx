"use client";

import { FormEvent, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { Camera, MapPin, X } from "lucide-react";

import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { incidentService } from "@/lib/services/incidentService";
import type { IncidentSeverity, IncidentType } from "@/types/incident";

const MAX_PHOTOS = 5;
const MAX_PHOTO_SIZE = 5 * 1024 * 1024;

export default function DriverReportIncidentPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const missionId = Number(params.id);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<IncidentType>("ACCIDENT");
  const [severity, setSeverity] = useState<IncidentSeverity>("MEDIUM");
  const [emergency, setEmergency] = useState(false);

  const [photos, setPhotos] = useState<File[]>([]);

  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationName, setLocationName] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  const [loading, setLoading] = useState(false);

  const photoPreviews = useMemo(() => {
    return photos.map((file) => URL.createObjectURL(file));
  }, [photos]);

  async function getAddressFromCoords(lat: number, lng: number) {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=fr`
      );

      if (!res.ok) return "Position véhicule récupérée";

      const data = await res.json();
      const address = data.address ?? {};

      return (
        address.village ||
        address.town ||
        address.suburb ||
        address.neighbourhood ||
        address.hamlet ||
        address.municipality ||
        address.city ||
        address.county ||
        address.state ||
        data.display_name ||
        "Position véhicule récupérée"
      );
    } catch {
      return "Position véhicule récupérée";
    }
  }

  async function getVehicleCurrentLocation() {
    if (!missionId || Number.isNaN(missionId)) {
      toast.error("Mission invalide");
      return;
    }

    try {
      setLocating(true);

      const position = await incidentService.getMissionVehiclePosition(missionId);

      if (!position.latitude || !position.longitude) {
        toast.error("Aucune position GPS véhicule disponible");
        return;
      }

      setLatitude(position.latitude);
      setLongitude(position.longitude);

      const name =
        position.locationName ||
        (await getAddressFromCoords(position.latitude, position.longitude));

      setLocationName(name);

      toast.success("Position réelle du véhicule récupérée");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Impossible de récupérer la position GPS du véhicule"
      );
    } finally {
      setLocating(false);
    }
  }

  function handlePhotosChange(files?: FileList | null) {
    if (!files) return;

    const selected = Array.from(files);
    const remainingSlots = MAX_PHOTOS - photos.length;

    if (remainingSlots <= 0) {
      toast.error(`Maximum ${MAX_PHOTOS} photos`);
      return;
    }

    const validPhotos: File[] = [];

    for (const file of selected) {
      if (validPhotos.length >= remainingSlots) break;

      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} n'est pas une image`);
        continue;
      }

      if (file.size > MAX_PHOTO_SIZE) {
        toast.error(`${file.name} dépasse 5MB`);
        continue;
      }

      validPhotos.push(file);
    }

    setPhotos((prev) => [...prev, ...validPhotos]);
  }

  function removePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();

    if (!missionId || Number.isNaN(missionId)) {
      toast.error("Mission invalide");
      return;
    }

    if (!title.trim()) {
      toast.error("Le titre est obligatoire");
      return;
    }

    if (!latitude || !longitude) {
      toast.error("Récupère d’abord la position réelle du véhicule");
      return;
    }

    try {
      setLoading(true);

      await incidentService.createWithPhotos(
        {
          title: title.trim(),
          description: description.trim(),
          type,
          severity,
          missionId,
          emergency,
          latitude,
          longitude,
          locationName: locationName ?? undefined,
        },
        photos
      );

      toast.success("Incident déclaré avec succès");
      router.push("/driver/incidents");
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la déclaration de l'incident");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ProtectedRoute allowedRoles={["ROLE_DRIVER"]}>
      <div className="mx-auto max-w-2xl p-6">
        <div className="mb-6 rounded-2xl bg-gradient-to-r from-slate-950 to-red-900 p-6 text-white shadow">
          <h1 className="text-2xl font-bold">Déclarer un incident</h1>
          <p className="mt-2 text-sm text-white/80">
            Mission #{missionId} — l’owner sera notifié en temps réel.
          </p>
        </div>

        <form
          onSubmit={submit}
          className="space-y-4 rounded-2xl border bg-white p-6 shadow-sm"
        >
          <label className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
            <input
              type="checkbox"
              checked={emergency}
              onChange={(e) => setEmergency(e.target.checked)}
            />
            <div>
              <div className="font-semibold text-red-700">Mode urgence</div>
              <div className="text-sm text-red-600">
                Accident grave, véhicule bloqué ou danger immédiat.
              </div>
            </div>
          </label>

          <div>
            <label className="mb-1 block text-sm font-semibold">
              Type incident
            </label>
            <select
              className="w-full rounded-xl border p-3"
              value={type}
              onChange={(e) => setType(e.target.value as IncidentType)}
            >
              <option value="ACCIDENT">Accident</option>
              <option value="VEHICLE_BREAKDOWN">Panne véhicule</option>
              <option value="ROAD_ISSUE">Problème route</option>
              <option value="DANGER">Danger / agression</option>
              <option value="MISSION_PROBLEM">Problème mission</option>
              <option value="OTHER">Autre</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold">Gravité</label>
            <select
              className="w-full rounded-xl border p-3"
              value={severity}
              onChange={(e) => setSeverity(e.target.value as IncidentSeverity)}
            >
              <option value="LOW">Faible</option>
              <option value="MEDIUM">Moyenne</option>
              <option value="HIGH">Élevée</option>
              <option value="CRITICAL">Critique</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold">Titre</label>
            <input
              className="w-full rounded-xl border p-3"
              placeholder="Ex: Accident sur la route"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold">
              Description
            </label>
            <textarea
              className="min-h-32 w-full rounded-xl border p-3"
              placeholder="Décrivez ce qui s'est passé..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="rounded-xl border bg-slate-50 p-4">
            <label className="mb-2 block text-sm font-semibold">
              Position réelle du véhicule
            </label>

            <button
              type="button"
              onClick={getVehicleCurrentLocation}
              disabled={locating}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 p-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <MapPin size={18} />
              {locating
                ? "Récupération GPS véhicule..."
                : "Récupérer position réelle du véhicule"}
            </button>

            {latitude && longitude && (
              <div className="mt-3 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                📍 Position véhicule :{" "}
                <span className="font-semibold">
                  {locationName ?? "Position récupérée"}
                </span>
                <div className="mt-1 text-xs text-green-600">
                  Lat: {latitude.toFixed(6)} / Lng: {longitude.toFixed(6)}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Photos de l’incident ({photos.length}/{MAX_PHOTOS})
            </label>

            <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center hover:bg-slate-100">
              <Camera className="mb-2 text-slate-500" size={32} />
              <span className="font-semibold text-slate-700">
                Ajouter une ou plusieurs photos
              </span>
              <span className="mt-1 text-xs text-slate-500">
                JPG, PNG, WEBP — max 5MB/photo — maximum {MAX_PHOTOS}
              </span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  handlePhotosChange(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>

            {photoPreviews.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-3">
                {photoPreviews.map((src, index) => (
                  <div
                    key={src}
                    className="relative overflow-hidden rounded-xl border"
                  >
                    <img
                      src={src}
                      alt={`Prévisualisation ${index + 1}`}
                      className="h-36 w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute right-2 top-2 rounded-full bg-black/60 p-2 text-white hover:bg-black"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            disabled={loading}
            className="w-full rounded-xl bg-red-600 p-3 font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? "Envoi..." : "Déclarer incident"}
          </button>
        </form>
      </div>
    </ProtectedRoute>
  );
}