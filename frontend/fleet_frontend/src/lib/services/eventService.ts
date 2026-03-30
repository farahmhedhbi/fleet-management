import { api } from "@/lib/api";
import type { VehicleEventDTO } from "@/types/gps";

export const eventService = {
  async getLatest(): Promise<VehicleEventDTO[]> {
    const res = await api.get<VehicleEventDTO[]>("/api/events/live");
    return res.data;
  },

  async getVehicleEvents(vehicleId: number): Promise<VehicleEventDTO[]> {
    const res = await api.get<VehicleEventDTO[]>(`/api/events/vehicle/${vehicleId}`);
    return res.data;
  },
};