import { api } from "@/lib/api";
import type { VehicleObdLiveDTO } from "@/types/obd";

export const obdService = {
  async getVehicleLive(vehicleId: number): Promise<VehicleObdLiveDTO> {
    const res = await api.get<VehicleObdLiveDTO>(`/api/obd/vehicle/${vehicleId}/live`);
    return res.data;
  },
};