import { api } from "@/lib/api";
import type { Mission, MissionDTO, MissionStatus } from "@/types/mission";

function toLocalDateTime(v?: string | null) {
  if (!v) return v;
  return v.includes("T") ? v : `${v}T00:00:00`;
}

export const missionService = {
  async getAll(): Promise<Mission[]> {
    const res = await api.get<Mission[]>("/api/missions");
    return res.data;
  },

  async create(payload: MissionDTO): Promise<Mission> {
    const fixed: any = { ...payload };
    fixed.startDate = toLocalDateTime(fixed.startDate);
    fixed.endDate = toLocalDateTime(fixed.endDate);
    const res = await api.post<Mission>("/api/missions", fixed);
    return res.data;
  },

  async updateStatus(id: number, status: MissionStatus): Promise<Mission> {
    const res = await api.put<Mission>(`/api/missions/${id}/status?status=${status}`);
    return res.data;
  },

  async start(id: number): Promise<Mission> {
    const res = await api.put<Mission>(`/api/missions/${id}/start`);
    return res.data;
  },

  async finish(id: number): Promise<Mission> {
    const res = await api.put<Mission>(`/api/missions/${id}/finish`);
    return res.data;
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/api/missions/${id}`);
  },
  
};