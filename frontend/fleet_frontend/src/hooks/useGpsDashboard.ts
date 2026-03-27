"use client";

import { useEffect, useMemo, useState } from "react";
import { gpsService } from "@/lib/services/gpsService";
import { filterVehicles } from "@/lib/utils/gps";
import { GpsData, GpsFilterStatus, VehicleLiveStatusDTO } from "@/types/gps";

interface UseGpsDashboardOptions {
  role: "owner" | "admin" | "driver";
}

export function useGpsDashboard({ role }: UseGpsDashboardOptions) {
  const [vehicles, setVehicles] = useState<VehicleLiveStatusDTO[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [history, setHistory] = useState<GpsData[]>([]);
  const [loadingFleet, setLoadingFleet] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<GpsFilterStatus>("ALL");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadFleet = async () => {
      try {
        const data = await gpsService.getLiveFleet();
        if (!mounted) return;

        let finalData = data;

        // Adaptation simple par rôle.
        // Tu peux remplacer cette logique par un vrai filtrage backend plus tard.
        if (role === "driver") {
          finalData = data.slice(0, 1);
        }

        setVehicles(finalData);

        if (finalData.length > 0) {
          const stillExists = finalData.some((v) => v.vehicleId === selectedVehicleId);
          if (!selectedVehicleId || !stillExists) {
            setSelectedVehicleId(finalData[0].vehicleId);
          }
        } else {
          setSelectedVehicleId(null);
        }

        setError(null);
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Erreur chargement GPS");
      } finally {
        if (mounted) setLoadingFleet(false);
      }
    };

    loadFleet();
    const interval = setInterval(loadFleet, 3000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [role, selectedVehicleId]);

  useEffect(() => {
    let mounted = true;

    const loadHistory = async () => {
      if (!selectedVehicleId) {
        setHistory([]);
        return;
      }

      setLoadingHistory(true);

      try {
        const data = await gpsService.getVehicleHistory(selectedVehicleId);
        if (!mounted) return;
        setHistory(data);
      } catch {
        if (!mounted) return;
        setHistory([]);
      } finally {
        if (mounted) setLoadingHistory(false);
      }
    };

    loadHistory();

    return () => {
      mounted = false;
    };
  }, [selectedVehicleId]);

  const filteredVehicles = useMemo(() => {
    return filterVehicles(vehicles, filter, search);
  }, [vehicles, filter, search]);

  const selectedVehicle = useMemo(() => {
    return vehicles.find((vehicle) => vehicle.vehicleId === selectedVehicleId) || null;
  }, [vehicles, selectedVehicleId]);

  return {
    vehicles,
    filteredVehicles,
    selectedVehicle,
    selectedVehicleId,
    setSelectedVehicleId,
    history,
    loadingFleet,
    loadingHistory,
    error,
    filter,
    setFilter,
    search,
    setSearch,
  };
}