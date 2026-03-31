import { api } from "@/lib/api";
import type { Mission, MissionDTO } from "@/types/mission";

function toLocalDateTime(v?: string | null) {
  if (!v) return undefined;
  return v.includes("T") ? v : `${v}T00:00:00`;
}

export const missionService = {
  async getAll(): Promise<Mission[]> {
    const res = await api.get<Mission[]>("/api/missions");
    return res.data;
  },

  async create(payload: MissionDTO): Promise<Mission> {
    const fixed: MissionDTO = {
      ...payload,
      startDate: toLocalDateTime(payload.startDate),
      endDate: undefined,
      routeJson: undefined,
    };

    const res = await api.post<Mission>("/api/missions", fixed);
    return res.data;
  },

  async start(id: number): Promise<Mission> {
    const res = await api.post<Mission>(`/api/missions/${id}/start`);
    return res.data;
  },

  async finish(id: number): Promise<Mission> {
    const res = await api.post<Mission>(`/api/missions/${id}/finish`);
    return res.data;
  },

  async cancel(id: number): Promise<void> {
    await api.post(`/api/missions/${id}/cancel`);
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/api/missions/${id}`);
  },
};