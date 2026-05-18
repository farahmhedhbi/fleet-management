"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  Car,
  CheckCircle2,
  ClipboardList,
  MapPin,
  Sparkles,
  User,
} from "lucide-react";

import { ProtectedRoute } from "@/components/layout/ProtectedRoute";

import SmartAssignmentForm from "@/components/dispatch/SmartAssignmentForm";
import DispatchResult from "@/components/dispatch/DispatchResult";

import { missionService } from "@/lib/services/missionService";
import { vehicleService } from "@/lib/services/vehicleService";
import { driverService } from "@/lib/services/driverService";
import { placeService, type PlaceSuggestion } from "@/lib/services/placeService";

import type {
  DispatchSuggestionDTO,
  SmartAssignmentRequest,
} from "@/types/dispatch";

import type { MissionDTO } from "@/types/mission";
import type { Vehicle } from "@/types/vehicle";
import type { Driver } from "@/types/driver";

type CreationMode = "NORMAL" | "SMART_ASSIGNMENT";

const emptyNormalForm: MissionDTO = {
  title: "",
  description: "",
  departure: "",
  destination: "",
  startDate: "",
  endDate: "",
  vehicleId: 0,
  driverId: 0,
};

function minNowLocal() {
  const d = new Date();
  d.setSeconds(0, 0);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

function estimateEndTime(startDate: string) {
  const d = new Date(startDate);
  if (Number.isNaN(d.getTime())) return "";

  d.setHours(d.getHours() + 2);

  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

export default function OwnerMissionCreatePage() {
  const [mode, setMode] = useState<CreationMode>("NORMAL");

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);

  const [normalForm, setNormalForm] = useState<MissionDTO>(emptyNormalForm);

  const [result, setResult] = useState<DispatchSuggestionDTO | null>(null);
  const [lastSmartForm, setLastSmartForm] =
    useState<SmartAssignmentRequest | null>(null);

  const [loadingData, setLoadingData] = useState(true);
  const [creating, setCreating] = useState(false);

  const [departureSuggestions, setDepartureSuggestions] = useState<
    PlaceSuggestion[]
  >([]);

  const [destinationSuggestions, setDestinationSuggestions] = useState<
    PlaceSuggestion[]
  >([]);

  const [loadingDeparture, setLoadingDeparture] = useState(false);
  const [loadingDestination, setLoadingDestination] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData() {
    try {
      setLoadingData(true);

      const [vehiclesData, driversData] = await Promise.all([
        vehicleService.getAll(),
        driverService.getAll(),
      ]);

      setVehicles(vehiclesData);
      setDrivers(driversData);
    } catch (e: any) {
      toast.error(
        e?.response?.data?.message ||
          e?.response?.data?.error ||
          e?.message ||
          "Erreur chargement données"
      );
    } finally {
      setLoadingData(false);
    }
  }

  function changeMode(newMode: CreationMode) {
    setMode(newMode);
    setResult(null);
    setLastSmartForm(null);
    setNormalForm(emptyNormalForm);
    setDepartureSuggestions([]);
    setDestinationSuggestions([]);
  }

  async function searchDeparture(value: string) {
    setNormalForm((p) => ({ ...p, departure: value }));

    if (!value.trim() || value.trim().length < 2) {
      setDepartureSuggestions([]);
      return;
    }

    try {
      setLoadingDeparture(true);
      const results = await placeService.search(value.trim());
      setDepartureSuggestions(results);
    } catch {
      setDepartureSuggestions([]);
    } finally {
      setLoadingDeparture(false);
    }
  }

  async function searchDestination(value: string) {
    setNormalForm((p) => ({ ...p, destination: value }));

    if (!value.trim() || value.trim().length < 2) {
      setDestinationSuggestions([]);
      return;
    }

    try {
      setLoadingDestination(true);
      const results = await placeService.search(value.trim());
      setDestinationSuggestions(results);
    } catch {
      setDestinationSuggestions([]);
    } finally {
      setLoadingDestination(false);
    }
  }

  function pickDeparture(item: PlaceSuggestion) {
    setNormalForm((p) => ({ ...p, departure: item.value }));
    setDepartureSuggestions([]);
  }

  function pickDestination(item: PlaceSuggestion) {
    setNormalForm((p) => ({ ...p, destination: item.value }));
    setDestinationSuggestions([]);
  }

  async function createNormalMission() {
    if (!normalForm.title.trim()) return toast.warn("Le titre est obligatoire.");

    if (!normalForm.departure.trim()) {
      return toast.warn("La ville de départ est obligatoire.");
    }

    if (!normalForm.destination.trim()) {
      return toast.warn("La destination est obligatoire.");
    }

    if (!normalForm.startDate) {
      return toast.warn("La date début est obligatoire.");
    }

    if (!normalForm.vehicleId) return toast.warn("Choisis un véhicule.");
    if (!normalForm.driverId) return toast.warn("Choisis un chauffeur.");

    setCreating(true);

    try {
      const payload: MissionDTO = {
        ...normalForm,
        endDate: normalForm.endDate || estimateEndTime(normalForm.startDate),
      };

      await missionService.create(payload);
      toast.success("Mission créée avec succès.");
      window.location.href = "/missions";
    } catch (e: any) {
      toast.error(
        e?.response?.data?.message ||
          e?.response?.data?.error ||
          e?.message ||
          "Erreur création mission"
      );
    } finally {
      setCreating(false);
    }
  }

  async function confirmSmartResult() {
    if (!result) return toast.warn("Génère d'abord une suggestion.");
    if (!lastSmartForm) return toast.warn("Données manquantes.");
    if (!result.vehicleId || !result.driverId) {
      return toast.warn("Véhicule ou chauffeur invalide.");
    }

    setCreating(true);

    try {
      const payload: MissionDTO = {
        title: `${lastSmartForm.startCity} → ${lastSmartForm.destinationCity}`,
        description: "Mission créée depuis Smart Assignment",
        departure: lastSmartForm.startCity,
        destination: lastSmartForm.destinationCity,
        startDate: lastSmartForm.startTime,
        endDate: lastSmartForm.expectedEndTime,
        vehicleId: result.vehicleId,
        driverId: result.driverId,
      };

      await missionService.create(payload);
      toast.success("Mission créée avec Smart Assignment.");
      window.location.href = "/missions";
    } catch (e: any) {
      toast.error(
        e?.response?.data?.message ||
          e?.response?.data?.error ||
          e?.message ||
          "Erreur confirmation"
      );
    } finally {
      setCreating(false);
    }
  }

  return (
    <ProtectedRoute allowedRoles={["ROLE_OWNER"]}>
      <div className="min-h-screen bg-slate-100 p-4 md:p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 p-6 text-white md:p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-200">
                Owner Mission Center
              </p>

              <h1 className="mt-3 text-3xl font-extrabold tracking-tight md:text-4xl">
                Création de mission
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-200">
                Cette page permet à l’owner de créer une mission normalement ou
                d’utiliser Smart Assignment pour proposer automatiquement le
                meilleur véhicule et chauffeur.
              </p>
            </div>

            <div className="grid gap-4 p-5 md:grid-cols-2">
              <ModeCard
                active={mode === "NORMAL"}
                icon={<ClipboardList className="h-5 w-5" />}
                title="Mode 1"
                subtitle="Création normale"
                description="L’owner choisit manuellement le véhicule et le chauffeur."
                onClick={() => changeMode("NORMAL")}
              />

              <ModeCard
                active={mode === "SMART_ASSIGNMENT"}
                icon={<Sparkles className="h-5 w-5" />}
                title="Mode 2"
                subtitle="Smart Assignment"
                description="Le système propose le meilleur véhicule selon disponibilité, maintenance, incidents et dernière position GPS."
                onClick={() => changeMode("SMART_ASSIGNMENT")}
              />
            </div>
          </section>

          {mode === "NORMAL" && (
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <SectionHeader
                title="Mode normal"
                description="L’owner garde le contrôle total sur la mission."
              />

              {loadingData ? (
                <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                  Chargement des véhicules et chauffeurs...
                </div>
              ) : (
                <div className="mt-6 space-y-5">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Titre mission">
                      <input
                        value={normalForm.title}
                        onChange={(e) =>
                          setNormalForm((p) => ({
                            ...p,
                            title: e.target.value,
                          }))
                        }
                        placeholder="Ex: Livraison Sousse vers Tunis"
                        className="input"
                      />
                    </Field>

                    <Field label="Date début">
                      <input
                        type="datetime-local"
                        min={minNowLocal()}
                        value={normalForm.startDate || ""}
                        onChange={(e) =>
                          setNormalForm((p) => ({
                            ...p,
                            startDate: e.target.value,
                            endDate: estimateEndTime(e.target.value),
                          }))
                        }
                        className="input"
                      />
                    </Field>
                  </div>

                  <Field label="Description">
                    <textarea
                      value={normalForm.description || ""}
                      onChange={(e) =>
                        setNormalForm((p) => ({
                          ...p,
                          description: e.target.value,
                        }))
                      }
                      placeholder="Détails de la mission..."
                      className="input min-h-[110px]"
                    />
                  </Field>

                  <div className="grid gap-4 md:grid-cols-2">
                    <PlaceInput
                      label="Ville départ"
                      value={normalForm.departure}
                      onChange={searchDeparture}
                      suggestions={departureSuggestions}
                      loading={loadingDeparture}
                      onPick={pickDeparture}
                    />

                    <PlaceInput
                      label="Ville destination"
                      value={normalForm.destination}
                      onChange={searchDestination}
                      suggestions={destinationSuggestions}
                      loading={loadingDestination}
                      onPick={pickDestination}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Véhicule">
                      <select
                        value={normalForm.vehicleId || ""}
                        onChange={(e) =>
                          setNormalForm((p) => ({
                            ...p,
                            vehicleId: Number(e.target.value),
                          }))
                        }
                        className="input"
                      >
                        <option value="">Choisir un véhicule</option>
                        {vehicles.map((vehicle) => (
                          <option key={vehicle.id} value={vehicle.id}>
                            {vehicle.registrationNumber}
                            {vehicle.status ? ` - ${vehicle.status}` : ""}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Chauffeur">
                      <select
                        value={normalForm.driverId || ""}
                        onChange={(e) =>
                          setNormalForm((p) => ({
                            ...p,
                            driverId: Number(e.target.value),
                          }))
                        }
                        className="input"
                      >
                        <option value="">Choisir un chauffeur</option>
                        {drivers.map((driver) => (
                          <option key={driver.id} value={driver.id}>
                            {driver.firstName} {driver.lastName}
                            {driver.status ? ` - ${driver.status}` : ""}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <InfoBox
                      icon={<MapPin className="h-5 w-5" />}
                      title="Villes avec suggestion"
                      text="Départ et destination utilisent la recherche de place."
                    />
                    <InfoBox
                      icon={<Car className="h-5 w-5" />}
                      title="Véhicule manuel"
                      text="L’owner choisit lui-même le véhicule."
                    />
                    <InfoBox
                      icon={<User className="h-5 w-5" />}
                      title="Chauffeur manuel"
                      text="L’owner choisit lui-même le chauffeur."
                    />
                  </div>

                  <button
                    type="button"
                    onClick={createNormalMission}
                    disabled={creating}
                    className="w-full rounded-2xl bg-slate-950 px-5 py-4 font-bold text-white transition hover:bg-slate-800 disabled:opacity-60"
                  >
                    {creating ? "Création..." : "Créer la mission"}
                  </button>
                </div>
              )}
            </section>
          )}

          {mode === "SMART_ASSIGNMENT" && (
            <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <div className="space-y-4">
                <SmartModeExplanation />

                <SmartAssignmentForm
                  onResult={(res, formData) => {
                    setResult(res);
                    setLastSmartForm(formData);
                  }}
                />
              </div>

              <div className="space-y-4">
                <DispatchResult result={result} />

                <button
                  type="button"
                  onClick={confirmSmartResult}
                  disabled={!result || creating}
                  className={`w-full rounded-2xl px-5 py-4 font-bold text-white transition ${
                    result
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "cursor-not-allowed bg-slate-400"
                  } disabled:opacity-70`}
                >
                  {creating ? "Création..." : "Confirmer et créer la mission"}
                </button>
              </div>
            </section>
          )}
        </div>
      </div>

      <style jsx global>{`
        .input {
          width: 100%;
          border-radius: 1rem;
          border: 1px solid rgb(226 232 240);
          background: white;
          padding: 0.85rem 1rem;
          font-size: 0.95rem;
          outline: none;
          transition: all 0.15s ease;
        }

        .input:focus {
          border-color: rgb(59 130 246);
          box-shadow: 0 0 0 3px rgb(59 130 246 / 0.15);
        }
      `}</style>
    </ProtectedRoute>
  );
}

function ModeCard({
  active,
  icon,
  title,
  subtitle,
  description,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group rounded-3xl border p-5 text-left transition ${
        active
          ? "border-blue-500 bg-blue-50 shadow-sm"
          : "border-slate-200 bg-white hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-sm"
      }`}
    >
      <div
        className={`mb-4 inline-flex rounded-2xl p-3 ${
          active
            ? "bg-blue-600 text-white"
            : "bg-slate-100 text-slate-600 group-hover:bg-slate-200"
        }`}
      >
        {icon}
      </div>

      <p
        className={`text-xs font-bold uppercase tracking-[0.2em] ${
          active ? "text-blue-700" : "text-slate-400"
        }`}
      >
        {title}
      </p>

      <h3 className="mt-1 text-lg font-extrabold text-slate-900">
        {subtitle}
      </h3>

      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>

      {active && (
        <div className="mt-4 flex items-center gap-2 text-sm font-bold text-blue-700">
          <CheckCircle2 className="h-4 w-4" />
          Mode sélectionné
        </div>
      )}
    </button>
  );
}

function SectionHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-600">
        Création
      </p>
      <h2 className="mt-1 text-2xl font-extrabold text-slate-900">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
    </div>
  );
}

function SmartModeExplanation() {
  return (
    <div className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm">
      <div className="flex gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white">
          <Sparkles className="h-5 w-5" />
        </div>

        <div>
          <h2 className="text-xl font-extrabold text-slate-900">
            Smart Assignment
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            L’owner donne le trajet et l’heure. Le système analyse les
            véhicules, chauffeurs, repos, incidents, maintenance, distance et
            dernière position GPS reçue en temps réel.
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-bold text-slate-700">{label}</span>
      {children}
    </label>
  );
}

function PlaceInput({
  label,
  value,
  onChange,
  suggestions,
  loading,
  onPick,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  suggestions: PlaceSuggestion[];
  loading: boolean;
  onPick: (item: PlaceSuggestion) => void;
}) {
  return (
    <div className="relative space-y-2">
      <span className="text-sm font-bold text-slate-700">{label}</span>

      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Rechercher une ville..."
        autoComplete="off"
        className="input"
      />

      {(loading || suggestions.length > 0) && (
        <div className="absolute z-[1000] mt-1 max-h-60 w-full overflow-auto rounded-2xl border border-slate-200 bg-white shadow-xl">
          {loading && (
            <div className="p-4 text-sm font-medium text-slate-500">
              Recherche...
            </div>
          )}

          {!loading &&
            suggestions.map((item) => (
              <button
                type="button"
                key={item.placeId}
                onClick={() => onPick(item)}
                className="block w-full border-b border-slate-100 px-4 py-3 text-left text-sm hover:bg-blue-50"
              >
                <span className="font-semibold text-slate-800">
                  {item.label}
                </span>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}

function InfoBox({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="mb-3 inline-flex rounded-xl bg-white p-2 text-blue-600 shadow-sm">
        {icon}
      </div>
      <p className="font-bold text-slate-900">{title}</p>
      <p className="mt-1 text-sm leading-5 text-slate-600">{text}</p>
    </div>
  );
}