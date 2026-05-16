"use client";

import { useEffect, useMemo, useState } from "react";
import { smartDailyPlanning } from "@/lib/services/dispatchService";
import { placeService, type PlaceSuggestion } from "@/lib/services/placeService";
import {
  DispatchMissionRequest,
  DispatchSuggestionDTO,
  SmartDailyPlanningRequest,
} from "@/types/dispatch";

interface Props {
  onResult: (
    result: DispatchSuggestionDTO,
    formData: SmartDailyPlanningRequest
  ) => void;
}

type DailyMissionUi = {
  startCity: string;
  destinationCity: string;
  startLatitude: number | null;
  startLongitude: number | null;
  destinationLatitude: number | null;
  destinationLongitude: number | null;
  startTime: string;
};

type DailyPlanningUiForm = {
  date: string;
  depotCity: string;
  depotLatitude: number | null;
  depotLongitude: number | null;
  missions: DailyMissionUi[];
};

function todayLocalDate() {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 10);
}

function estimateEndTime(startTime: string) {
  const d = new Date(startTime);
  if (Number.isNaN(d.getTime())) return "";

  d.setHours(d.getHours() + 2);

  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

function minDateTimeForDate(date: string) {
  const today = todayLocalDate();

  if (date === today) {
    const d = new Date();
    d.setSeconds(0, 0);
    const offset = d.getTimezoneOffset();
    const local = new Date(d.getTime() - offset * 60000);
    return local.toISOString().slice(0, 16);
  }

  return `${date}T00:00`;
}

function getSuggestionLat(item: PlaceSuggestion): number | null {
  const anyItem = item as any;
  return anyItem.latitude ?? anyItem.lat ?? null;
}

function getSuggestionLng(item: PlaceSuggestion): number | null {
  const anyItem = item as any;
  return anyItem.longitude ?? anyItem.lng ?? anyItem.lon ?? null;
}

function emptyMission(date: string): DailyMissionUi {
  return {
    startCity: "",
    destinationCity: "",
    startLatitude: null,
    startLongitude: null,
    destinationLatitude: null,
    destinationLongitude: null,
    startTime: `${date}T08:00`,
  };
}

export default function SmartDailyPlanningForm({ onResult }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const today = todayLocalDate();

  const [form, setForm] = useState<DailyPlanningUiForm>({
    date: today,
    depotCity: "",
    depotLatitude: null,
    depotLongitude: null,
    missions: [emptyMission(today)],
  });

  const [depotSuggestions, setDepotSuggestions] = useState<PlaceSuggestion[]>(
    []
  );
  const [loadingDepotSuggestions, setLoadingDepotSuggestions] = useState(false);

  const [departureSuggestions, setDepartureSuggestions] = useState<
    Record<number, PlaceSuggestion[]>
  >({});
  const [destinationSuggestions, setDestinationSuggestions] = useState<
    Record<number, PlaceSuggestion[]>
  >({});

  const [loadingDepartureIndex, setLoadingDepartureIndex] =
    useState<number | null>(null);
  const [loadingDestinationIndex, setLoadingDestinationIndex] =
    useState<number | null>(null);

  const minDateTime = useMemo(() => minDateTimeForDate(form.date), [form.date]);

  useEffect(() => {
    const query = form.depotCity.trim();

    if (!query || query.length < 2) {
      setDepotSuggestions([]);
      return;
    }

    const timer = window.setTimeout(async () => {
      try {
        setLoadingDepotSuggestions(true);
        const results = await placeService.search(query);
        setDepotSuggestions(results);
      } catch (e) {
        console.error(e);
        setDepotSuggestions([]);
      } finally {
        setLoadingDepotSuggestions(false);
      }
    }, 350);

    return () => window.clearTimeout(timer);
  }, [form.depotCity]);

  function updateDate(value: string) {
    setForm((prev) => ({
      ...prev,
      date: value,
      missions: prev.missions.map((m) => {
        const time = m.startTime?.split("T")[1] || "08:00";
        return {
          ...m,
          startTime: `${value}T${time}`,
        };
      }),
    }));
  }

  function updateMission(index: number, patch: Partial<DailyMissionUi>) {
    setForm((prev) => {
      const missions = [...prev.missions];
      missions[index] = {
        ...missions[index],
        ...patch,
      };
      return { ...prev, missions };
    });
  }

  function addMission() {
    setForm((prev) => ({
      ...prev,
      missions: [...prev.missions, emptyMission(prev.date)],
    }));
  }

  function removeMission(index: number) {
    setForm((prev) => ({
      ...prev,
      missions: prev.missions.filter((_, i) => i !== index),
    }));
  }

  function pickDepot(item: PlaceSuggestion) {
    setForm((prev) => ({
      ...prev,
      depotCity: item.value,
      depotLatitude: getSuggestionLat(item),
      depotLongitude: getSuggestionLng(item),
    }));

    setDepotSuggestions([]);
  }

  async function searchDeparture(index: number, value: string) {
    updateMission(index, {
      startCity: value,
      startLatitude: null,
      startLongitude: null,
    });

    if (!value.trim() || value.trim().length < 2) {
      setDepartureSuggestions((prev) => ({ ...prev, [index]: [] }));
      return;
    }

    try {
      setLoadingDepartureIndex(index);
      const results = await placeService.search(value.trim());
      setDepartureSuggestions((prev) => ({ ...prev, [index]: results }));
    } catch (e) {
      console.error(e);
      setDepartureSuggestions((prev) => ({ ...prev, [index]: [] }));
    } finally {
      setLoadingDepartureIndex(null);
    }
  }

  async function searchDestination(index: number, value: string) {
    updateMission(index, {
      destinationCity: value,
      destinationLatitude: null,
      destinationLongitude: null,
    });

    if (!value.trim() || value.trim().length < 2) {
      setDestinationSuggestions((prev) => ({ ...prev, [index]: [] }));
      return;
    }

    try {
      setLoadingDestinationIndex(index);
      const results = await placeService.search(value.trim());
      setDestinationSuggestions((prev) => ({ ...prev, [index]: results }));
    } catch (e) {
      console.error(e);
      setDestinationSuggestions((prev) => ({ ...prev, [index]: [] }));
    } finally {
      setLoadingDestinationIndex(null);
    }
  }

  function pickDeparture(index: number, item: PlaceSuggestion) {
    updateMission(index, {
      startCity: item.value,
      startLatitude: getSuggestionLat(item),
      startLongitude: getSuggestionLng(item),
    });

    setDepartureSuggestions((prev) => ({ ...prev, [index]: [] }));
  }

  function pickDestination(index: number, item: PlaceSuggestion) {
    updateMission(index, {
      destinationCity: item.value,
      destinationLatitude: getSuggestionLat(item),
      destinationLongitude: getSuggestionLng(item),
    });

    setDestinationSuggestions((prev) => ({ ...prev, [index]: [] }));
  }

  function buildPayload(): SmartDailyPlanningRequest {
    if (!form.date) {
      throw new Error("Date est obligatoire.");
    }

    if (!form.depotCity.trim()) {
      throw new Error("Dépôt est obligatoire.");
    }

    if (form.depotLatitude == null || form.depotLongitude == null) {
      throw new Error("Choisis le dépôt depuis la liste de recherche.");
    }

    if (form.missions.length === 0) {
      throw new Error("Ajoute au moins une mission.");
    }

    const missions: DispatchMissionRequest[] = form.missions.map(
      (mission, index) => {
        if (!mission.startCity.trim()) {
          throw new Error(`Ville départ obligatoire pour mission ${index + 1}.`);
        }

        if (!mission.destinationCity.trim()) {
          throw new Error(
            `Ville destination obligatoire pour mission ${index + 1}.`
          );
        }

        if (!mission.startTime) {
          throw new Error(`Date début obligatoire pour mission ${index + 1}.`);
        }

        if (
          mission.startLatitude == null ||
          mission.startLongitude == null ||
          mission.destinationLatitude == null ||
          mission.destinationLongitude == null
        ) {
          throw new Error(
            `Choisis départ et destination depuis la liste de recherche pour mission ${
              index + 1
            }.`
          );
        }

        return {
          startCity: mission.startCity.trim(),
          destinationCity: mission.destinationCity.trim(),
          startLatitude: mission.startLatitude,
          startLongitude: mission.startLongitude,
          destinationLatitude: mission.destinationLatitude,
          destinationLongitude: mission.destinationLongitude,
          startTime: mission.startTime,
          expectedEndTime: estimateEndTime(mission.startTime),
        };
      }
    );

    return {
      date: form.date,
      depotCity: form.depotCity.trim(),
      depotLatitude: form.depotLatitude,
      depotLongitude: form.depotLongitude,
      missions,
    };
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload = buildPayload();
      const result = await smartDailyPlanning(payload);
      onResult(result, payload);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Erreur lors du planning."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl bg-white p-5 shadow-sm border space-y-5"
    >
      <div>
        <h2 className="text-xl font-bold text-gray-900">
          Smart Daily Planning
        </h2>
        <p className="text-sm text-gray-500">
          Choisis la date, le dépôt et les missions. Le système estime les dates
          de fin automatiquement.
        </p>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="space-y-1">
          <span className="text-sm font-medium text-gray-700">Date</span>
          <input
            type="date"
            value={form.date}
            onChange={(e) => updateDate(e.target.value)}
            className="w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </label>

        <PlaceInput
          label="Dépôt"
          value={form.depotCity}
          onChange={(value) =>
            setForm((prev) => ({
              ...prev,
              depotCity: value,
              depotLatitude: null,
              depotLongitude: null,
            }))
          }
          suggestions={depotSuggestions}
          loading={loadingDepotSuggestions}
          onPick={pickDepot}
        />
      </div>

      <div className="space-y-4">
        {form.missions.map((mission, index) => (
          <div
            key={index}
            className="rounded-2xl border bg-gray-50 p-4 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-800">Mission {index + 1}</h3>

              {form.missions.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeMission(index)}
                  className="rounded-lg bg-red-100 px-3 py-1 text-sm text-red-700"
                >
                  Supprimer
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <PlaceInput
                label="Ville départ"
                value={mission.startCity}
                onChange={(value) => searchDeparture(index, value)}
                suggestions={departureSuggestions[index] || []}
                loading={loadingDepartureIndex === index}
                onPick={(item) => pickDeparture(index, item)}
              />

              <PlaceInput
                label="Ville destination"
                value={mission.destinationCity}
                onChange={(value) => searchDestination(index, value)}
                suggestions={destinationSuggestions[index] || []}
                loading={loadingDestinationIndex === index}
                onPick={(item) => pickDestination(index, item)}
              />

              <label className="space-y-1">
                <span className="text-sm font-medium text-gray-700">
                  Date début
                </span>
                <input
                  type="datetime-local"
                  min={minDateTime}
                  value={mission.startTime}
                  onChange={(e) =>
                    updateMission(index, { startTime: e.target.value })
                  }
                  className="w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addMission}
        className="w-full rounded-xl border border-dashed border-gray-300 px-4 py-3 text-gray-700 hover:bg-gray-50"
      >
        + Ajouter une mission
      </button>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
      >
        {loading
          ? "Optimisation en cours..."
          : "Générer le planning intelligent"}
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