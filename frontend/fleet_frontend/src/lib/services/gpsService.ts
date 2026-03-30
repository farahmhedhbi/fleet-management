import { api } from "@/lib/api";
import type { GpsData, VehicleEventDTO, VehicleLiveStatusDTO } from "@/types/gps";

export const gpsService = {
  async getLiveFleet(): Promise<VehicleLiveStatusDTO[]> {
    const res = await api.get<VehicleLiveStatusDTO[]>("/api/gps/live");
    return res.data;
  },

  async getLastPosition(vehicleId: number): Promise<GpsData | null> {
    try {
      const res = await api.get<GpsData>(`/api/gps/vehicle/${vehicleId}/last`);
      return res.data;
    } catch {
      return null;
    }
  },

  async getHistory(vehicleId: number, from?: string, to?: string): Promise<GpsData[]> {
    const params: Record<string, string> = {};
    if (from && to) {
      params.from = from;
      params.to = to;
    }

    const res = await api.get<GpsData[]>(`/api/gps/vehicle/${vehicleId}/history`, {
      params,
    });
    return res.data;
  },

  async getLatestEvents(): Promise<VehicleEventDTO[]> {
    const res = await api.get<VehicleEventDTO[]>("/api/events/live");
    return res.data;
  },

  async getVehicleEvents(vehicleId: number): Promise<VehicleEventDTO[]> {
    const res = await api.get<VehicleEventDTO[]>(`/api/events/vehicle/${vehicleId}`);
    return res.data;
  },
};