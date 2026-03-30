"use client";

import type { GpsFilterStatus, VehicleLiveStatusDTO } from "@/types/gps";
import { countByStatus } from "@/lib/utils/gps";

interface GpsFilterBarProps {
  vehicles: VehicleLiveStatusDTO[];
  filter: GpsFilterStatus;
  setFilter: (value: GpsFilterStatus) => void;
  search: string;
  setSearch: (value: string) => void;
}

export default function GpsFilterBar({
  vehicles,
  filter,
  setFilter,
  search,
  setSearch,
}: GpsFilterBarProps) {
  const filterOptions: { label: string; value: GpsFilterStatus; count: number }[] = [
    { label: "Tous", value: "ALL", count: countByStatus(vehicles, "ALL") },
    { label: "En mouvement", value: "MOVING", count: countByStatus(vehicles, "MOVING") },
    { label: "Offline", value: "OFFLINE", count: countByStatus(vehicles, "OFFLINE") },
    { label: "Mission active", value: "MISSION", count: countByStatus(vehicles, "MISSION") },
    { label: "Alerte", value: "ALERT", count: countByStatus(vehicles, "ALERT") },
  ];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
        <div>
          <input
            type="text"
            placeholder="Rechercher véhicule, driver, route..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-gray-300 px-4 py-2 outline-none transition focus:border-blue-500"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {filterOptions.map((option) => {
            const active = filter === option.value;

            return (
              <button
                key={option.value}
                onClick={() => setFilter(option.value)}
                className={`rounded-full border px-3 py-2 text-sm font-medium transition ${
                  active
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                {option.label} ({option.count})
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}