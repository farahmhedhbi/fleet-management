"use client";

import { useEffect, useMemo, useState } from "react";
import { smartAssignment } from "@/lib/services/dispatchService";
import { placeService, type PlaceSuggestion } from "@/lib/services/placeService";
import {
  DispatchSuggestionDTO,
  SmartAssignmentRequest,
} from "@/types/dispatch";

interface Props {
  onResult: (
    result: DispatchSuggestionDTO,
    formData: SmartAssignmentRequest
  ) => void;
}

type SmartAssignmentUiForm = {
  startCity: string;
  destinationCity: string;
  startLatitude: number | null;
  startLongitude: number | null;
  destinationLatitude: number | null;
  destinationLongitude: number | null;
  startTime: string;
};

function minNowLocal() {
  const d = new Date();
  d.setSeconds(0, 0);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

function estimateEndTime(startTime: string) {
  const d = new Date(startTime);
  if (Number.isNaN(d.getTime())) return "";
  d.setHours(d.getHours() + 2);

  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

function getSuggestionLat(item: PlaceSuggestion): number | null {
  const anyItem = item as any;
  return anyItem.latitude ?? anyItem.lat ?? null;
}

function getSuggestionLng(item: PlaceSuggestion): number | null {
  const anyItem = item as any;
  return anyItem.longitude ?? anyItem.lng ?? anyItem.lon ?? null;
}

export default function SmartAssignmentForm({ onResult }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [departureSuggestions, setDepartureSuggestions] = useState<
    PlaceSuggestion[]
  >([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState<
    PlaceSuggestion[]
  >([]);

  const [loadingDepartureSuggestions, setLoadingDepartureSuggestions] =
    useState(false);
  const [loadingDestinationSuggestions, setLoadingDestinationSuggestions] =
    useState(false);

  const [form, setForm] = useState<SmartAssignmentUiForm>({
    startCity: "",
    destinationCity: "",
    startLatitude: null,
    startLongitude: null,
    destinationLatitude: null,
    destinationLongitude: null,
    startTime: minNowLocal(),
  });

  const expectedEndTime = useMemo(() => {
    return estimateEndTime(form.startTime);
  }, [form.startTime]);

  useEffect(() => {
    const query = form.startCity.trim();

    if (!query || query.length < 2) {
      setDepartureSuggestions([]);
      return;
    }

    const timer = window.setTimeout(async () => {
      try {
        setLoadingDepartureSuggestions(true);
        const results = await placeService.search(query);
        setDepartureSuggestions(results);
      } catch (e) {
        console.error(e);
        setDepartureSuggestions([]);
      } finally {
        setLoadingDepartureSuggestions(false);
      }
    }, 350);

    return () => window.clearTimeout(timer);
  }, [form.startCity]);

  useEffect(() => {
    const query = form.destinationCity.trim();

    if (!query || query.length < 2) {
      setDestinationSuggestions([]);
      return;
    }

    const timer = window.setTimeout(async () => {
      try {
        setLoadingDestinationSuggestions(true);
        const results = await placeService.search(query);
        setDestinationSuggestions(results);
      } catch (e) {
        console.error(e);
        setDestinationSuggestions([]);
      } finally {
        setLoadingDestinationSuggestions(false);
      }
    }, 350);

    return () => window.clearTimeout(timer);
  }, [form.destinationCity]);

  function pickDeparture(item: PlaceSuggestion) {
    const lat = getSuggestionLat(item);
    const lng = getSuggestionLng(item);

    setForm((prev) => ({
      ...prev,
      startCity: item.value,
      startLatitude: lat,
      startLongitude: lng,
    }));

    setDepartureSuggestions([]);
  }

  function pickDestination(item: PlaceSuggestion) {
    const lat = getSuggestionLat(item);
    const lng = getSuggestionLng(item);

    setForm((prev) => ({
      ...prev,
      destinationCity: item.value,
      destinationLatitude: lat,
      destinationLongitude: lng,
    }));

    setDestinationSuggestions([]);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!form.startCity.trim()) {
        throw new Error("Ville départ est obligatoire.");
      }

      if (!form.destinationCity.trim()) {
        throw new Error("Ville destination est obligatoire.");
      }

      if (!form.startTime) {
        throw new Error("Date début est obligatoire.");
      }

      if (
        form.startLatitude == null ||
        form.startLongitude == null ||
        form.destinationLatitude == null ||
        form.destinationLongitude == null
      ) {
        throw new Error(
          "Choisis la ville depuis la liste de recherche pour récupérer la position GPS."
        );
      }

      const payload: SmartAssignmentRequest = {
        startCity: form.startCity.trim(),
        destinationCity: form.destinationCity.trim(),
        startLatitude: form.startLatitude,
        startLongitude: form.startLongitude,
        destinationLatitude: form.destinationLatitude,
        destinationLongitude: form.destinationLongitude,
        startTime: form.startTime,
        expectedEndTime,
      };

      const result = await smartAssignment(payload);
      onResult(result, payload);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Erreur lors de la suggestion."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl bg-white p-5 shadow-sm border space-y-4"
    >
      <div>
        <h2 className="text-xl font-bold text-gray-900">Smart Assignment</h2>
        <p className="text-sm text-gray-500">
          Choisis le départ, la destination et la date début. Le système estime
          la fin automatiquement.
        </p>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <PlaceInput
          label="Ville départ"
          value={form.startCity}
          onChange={(value) =>
            setForm((prev) => ({
              ...prev,
              startCity: value,
              startLatitude: null,
              startLongitude: null,
            }))
          }
          suggestions={departureSuggestions}
          loading={loadingDepartureSuggestions}
          onPick={pickDeparture}
        />

        <PlaceInput
          label="Ville destination"
          value={form.destinationCity}
          onChange={(value) =>
            setForm((prev) => ({
              ...prev,
              destinationCity: value,
              destinationLatitude: null,
              destinationLongitude: null,
            }))
          }
          suggestions={destinationSuggestions}
          loading={loadingDestinationSuggestions}
          onPick={pickDestination}
        />

        <label className="space-y-1 md:col-span-1">
          <span className="text-sm font-medium text-gray-700">Date début</span>
          <input
            type="datetime-local"
            min={minNowLocal()}
            value={form.startTime}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, startTime: e.target.value }))
            }
            className="w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
      >
        {loading ? "Analyse en cours..." : "Proposer véhicule et driver"}
      </button>
    </form>
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
    <div className="relative space-y-1">
      <span className="text-sm font-medium text-gray-700">{label}</span>

      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Rechercher une ville..."
        autoComplete="off"
        className="w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
      />

      {(loading || suggestions.length > 0) && (
        <div className="absolute z-[1000] mt-1 max-h-56 w-full overflow-auto rounded-xl border border-gray-200 bg-white shadow-lg">
          {loading && (
            <div className="p-3 text-sm text-gray-500">Recherche...</div>
          )}

          {!loading &&
            suggestions.map((item) => (
              <button
                type="button"
                key={item.placeId}
                onClick={() => onPick(item)}
                className="block w-full border-b border-gray-100 px-3 py-2 text-left text-sm hover:bg-gray-50"
              >
                {item.label}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}