import { api } from "@/lib/api";
import type { PredictiveAlertDTO } from "@/types/predictive";

export const predictiveService = {

  async getAll(): Promise<PredictiveAlertDTO[]> {
    const res = await api.get("/api/predictive-alerts");
    return res.data;
  },

  async getActive(): Promise<PredictiveAlertDTO[]> {
    const res = await api.get("/api/predictive-alerts/active");
    return res.data;
  },

  async analyzeVehicle(vehicleId: number): Promise<PredictiveAlertDTO> {
    const res = await api.post(
      `/api/predictive-alerts/analyze/${vehicleId}`
    );

    return res.data;
  },

  async resolve(id: number): Promise<PredictiveAlertDTO> {
    const res = await api.put(
      `/api/predictive-alerts/${id}/resolve`
    );

    return res.data;
  },
};