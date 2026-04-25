import { api } from "@/lib/api";
import type { ObdAlertDTO, VehicleHealthSummaryDTO } from "@/types/obd-alert";

export const obdAnalysisService = {
  async getVehicleSummary(vehicleId: number): Promise<VehicleHealthSummaryDTO> {
    const res = await api.get<VehicleHealthSummaryDTO>(
      `/api/obd/vehicle/${vehicleId}/summary`
    );
    return res.data;
  },

  async getVehicleAlerts(vehicleId: number): Promise<ObdAlertDTO[]> {
    const res = await api.get<ObdAlertDTO[]>(
      `/api/obd/vehicle/${vehicleId}/alerts`
    );
    return Array.isArray(res.data) ? res.data : [];
  },
};