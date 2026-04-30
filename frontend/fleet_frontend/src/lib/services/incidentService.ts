import { api } from "@/lib/api";
import type { IncidentDTO, IncidentStatus } from "@/types/incident";

export type CreateIncidentRequest = {
  title: string;
  description?: string;
  type: string;
  severity: string;
  vehicleId?: number;
  missionId?: number;
  latitude?: number;
  longitude?: number;
  emergency?: boolean;
};

export const incidentService = {
  async create(data: CreateIncidentRequest): Promise<IncidentDTO> {
    const res = await api.post<IncidentDTO>("/api/incidents", data);
    return res.data;
  },

  async getAll(): Promise<IncidentDTO[]> {
    const res = await api.get<IncidentDTO[]>("/api/incidents");
    return Array.isArray(res.data) ? res.data : [];
  },

  async getById(id: number): Promise<IncidentDTO> {
    const res = await api.get<IncidentDTO>(`/api/incidents/${id}`);
    return res.data;
  },

  async getByVehicle(vehicleId: number): Promise<IncidentDTO[]> {
    const res = await api.get<IncidentDTO[]>(`/api/incidents/vehicle/${vehicleId}`);
    return Array.isArray(res.data) ? res.data : [];
  },

  async getByMission(missionId: number): Promise<IncidentDTO[]> {
    const res = await api.get<IncidentDTO[]>(`/api/incidents/mission/${missionId}`);
    return Array.isArray(res.data) ? res.data : [];
  },

  async updateStatus(id: number, status: IncidentStatus): Promise<IncidentDTO> {
    const res = await api.put<IncidentDTO>(`/api/incidents/${id}/status`, {
      status,
    });

    return res.data;
  },
};