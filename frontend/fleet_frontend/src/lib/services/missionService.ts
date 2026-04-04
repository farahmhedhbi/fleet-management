import { api } from "@/lib/api";
import type { Mission, MissionDTO } from "@/types/mission";
import type { GpsData, VehicleLiveStatusDTO } from "@/types/gps";

function toLocalDateTime(v?: string | null) {
  if (!v) return undefined;
  return v.includes("T") ? v : `${v}T00:00:00`;
}

export const missionService = {
  async getAll(): Promise<Mission[]> {
    const res = await api.get<Mission[]>("/api/missions");
    return res.data;
  },

  async getById(id: number): Promise<Mission> {
    const res = await api.get<Mission>(`/api/missions/${id}`);
    return res.data;
  },

  async getLive(id: number): Promise<VehicleLiveStatusDTO> {
    const res = await api.get<VehicleLiveStatusDTO>(`/api/missions/${id}/live`);
    return res.data;
  },

  async getHistory(id: number, from?: string, to?: string): Promise<GpsData[]> {
    const params: Record<string, string> = {};
    if (from) params.from = from;
    if (to) params.to = to;

    const res = await api.get<GpsData[]>(`/api/missions/${id}/history`, { params });
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


   async update(id: number, payload: MissionDTO): Promise<Mission> {
  const fixed: MissionDTO = {
    ...payload,
    startDate: toLocalDateTime(payload.startDate),
    endDate: undefined,
    routeJson: undefined,
  };

  const res = await api.put<Mission>(`/api/missions/${id}`, fixed);
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