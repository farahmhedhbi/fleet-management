import { api } from "@/lib/api";
import type { DashboardKpiDTO } from "@/types/dashboard";

export const dashboardService = {
  async getOwnerKpi(): Promise<DashboardKpiDTO> {
    const res = await api.get<DashboardKpiDTO>("/api/owner/dashboard/kpi");
    return res.data;
  },

  async publishOwnerKpi(): Promise<void> {
    await api.post("/api/owner/dashboard/kpi/publish");
  },
};