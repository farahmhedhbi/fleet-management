import { api } from "@/lib/api";
import type { ObdHistoryItem, VehicleObdLiveDTO } from "@/types/obd";

export const obdService = {
  async getVehicleLive(vehicleId: number): Promise<VehicleObdLiveDTO> {
    const res = await api.get<VehicleObdLiveDTO>(`/api/obd/vehicle/${vehicleId}/live`);
    return res.data;
  },
  async getVehicleHistory(
    vehicleId: number,
    from?: string,
    to?: string
  ): Promise<ObdHistoryItem[]> {
    const params: Record<string, string> = {};

    if (from) params.from = from;
    if (to) params.to = to;

    const res = await api.get<ObdHistoryItem[]>(
      `/api/obd/vehicle/${vehicleId}/history`,
      { params }
    );

    return res.data;
  },
};