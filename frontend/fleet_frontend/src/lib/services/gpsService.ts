import { api } from "@/lib/api";
import type { GpsData, VehicleEventDTO, VehicleLiveStatusDTO } from "@/types/gps";

export const gpsService = {
  async getLiveFleet(): Promise<VehicleLiveStatusDTO[]> {
    const res = await api.get<VehicleLiveStatusDTO[]>("/api/gps/live", {
      timeout: 30000,
    });
    return res.data;
  },

  async getLastPosition(vehicleId: number): Promise<GpsData | null> {
    try {
      const res = await api.get<GpsData>(`/api/gps/vehicle/${vehicleId}/last`, {
        timeout: 15000,
      });
      return res.data;
    } catch {
      return null;
    }
  },

  async getVehicleHistory(
    vehicleId: number,
    from?: string,
    to?: string
  ): Promise<GpsData[]> {
    const params: Record<string, string | number> = {
      limit: 300,
    };

    if (from) params.from = from;
    if (to) params.to = to;

    const res = await api.get<GpsData[]>(
      `/api/gps/vehicle/${vehicleId}/history`,
      {
        params,
        timeout: 30000,
      }
    );

    return res.data;
  },

  async getMissionHistory(
    missionId: number,
    from?: string,
    to?: string
  ): Promise<GpsData[]> {
    const params: Record<string, string | number> = {
      limit: 300,
    };

    if (from) params.from = from;
    if (to) params.to = to;

    const res = await api.get<GpsData[]>(
      `/api/missions/${missionId}/history`,
      {
        params,
        timeout: 30000,
      }
    );

    return res.data;
  },

  async getLatestEvents(): Promise<VehicleEventDTO[]> {
    const res = await api.get<VehicleEventDTO[]>("/api/events/live", {
      params: { limit: 50 },
      timeout: 30000,
    });

    return res.data;
  },

  async getVehicleEvents(vehicleId: number): Promise<VehicleEventDTO[]> {
    const res = await api.get<VehicleEventDTO[]>(
      `/api/events/vehicle/${vehicleId}`,
      {
        params: { limit: 50 },
        timeout: 30000,
      }
    );

    return res.data;
  },
};