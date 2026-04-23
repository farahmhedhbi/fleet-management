"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import ObdHistoryCharts from "@/components/obd/ObdHistoryCharts";
import ObdHistoryTable from "@/components/obd/ObdHistoryTable";
import { obdService } from "@/lib/services/obdService";
import type { ObdHistoryItem } from "@/types/obd";

function toApiDateTime(value: string): string | undefined {
  if (!value) return undefined;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}T${hh}:${mi}:${ss}`;
}

export default function VehicleObdHistoryPage() {
  const params = useParams();
  const vehicleId = Number(params.id);

  const [data, setData] = useState<ObdHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  async function loadHistory(customFrom?: string, customTo?: string) {
    try {
      setLoading(true);
      setError(null);

      const result = await obdService.getVehicleHistory(
        vehicleId,
        customFrom,
        customTo
      );

      setData(result);
    } catch (e) {
      console.error(e);
      setError("Impossible de charger l'historique OBD.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!Number.isNaN(vehicleId)) {
      loadHistory();
    }
  }, [vehicleId]);

  const stats = useMemo(() => {
    if (data.length === 0) {
      return {
        avgRpm: 0,
        avgTemp: 0,
        avgFuel: 0,
      };
    }

    const avg = (arr: number[]) =>
      arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

    return {
      avgRpm: avg(data.map((x) => x.engineRpm ?? 0)),
      avgTemp: avg(data.map((x) => x.engineTemperature ?? 0)),
      avgFuel: avg(data.map((x) => x.fuelLevel ?? 0)),
    };
  }, [data]);

  const handleFilter = () => {
    loadHistory(toApiDateTime(from), toApiDateTime(to));
  };

  const handleReset = () => {
    setFrom("");
    setTo("");
    loadHistory();
  };

  return (
    <div className="space-y-6 p-6">
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 to-slate-700 p-6 text-white shadow-lg">
        <h1 className="text-2xl font-bold">
          Historique OBD du véhicule #{vehicleId}
        </h1>
        <p className="mt-2 text-sm text-slate-200">
          Analyse des données moteur, carburant, température, batterie et charge
          moteur.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">RPM moyen</p>
          <p className="mt-2 text-2xl font-bold">{stats.avgRpm.toFixed(0)}</p>
        </div>

        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Température moyenne</p>
          <p className="mt-2 text-2xl font-bold">{stats.avgTemp.toFixed(1)}°C</p>
        </div>

        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Carburant moyen</p>
          <p className="mt-2 text-2xl font-bold">{stats.avgFuel.toFixed(1)}%</p>
        </div>
      </div>

      <div className="rounded-3xl border bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              De
            </label>
            <input
              type="datetime-local"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              À
            </label>
            <input
              type="datetime-local"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleFilter}
              className="w-full rounded-xl bg-slate-900 px-4 py-2 text-white transition hover:bg-slate-800"
            >
              Filtrer
            </button>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleReset}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-slate-700 transition hover:bg-slate-50"
            >
              Réinitialiser
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border bg-white p-6 text-sm text-slate-500 shadow-sm">
          Chargement de l&apos;historique OBD...
        </div>
      ) : error ? (
        <div className="rounded-2xl border bg-white p-6 text-sm text-red-600 shadow-sm">
          {error}
        </div>
      ) : (
        <>
          <ObdHistoryCharts data={data} />
          <ObdHistoryTable data={data} />
        </>
      )}
    </div>
  );
}