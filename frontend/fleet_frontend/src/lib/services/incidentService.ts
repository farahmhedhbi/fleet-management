import { api } from "@/lib/api";
import type {
  IncidentCreateRequest,
  IncidentDTO,
  IncidentFromEventRequest,
  IncidentStatus,
} from "@/types/incident";

export const incidentService = {
  async getAll(): Promise<IncidentDTO[]> {
    const res = await api.get("/api/incidents");
    return res.data;
  },

  async getById(id: number): Promise<IncidentDTO> {
    const res = await api.get(`/api/incidents/${id}`);
    return res.data;
  },

  async getMine(): Promise<IncidentDTO[]> {
    const res = await api.get("/api/incidents/me");
    return res.data;
  },

  async create(payload: IncidentCreateRequest): Promise<IncidentDTO> {
    const res = await api.post("/api/incidents", payload);
    return res.data;
  },

  async fromEvent(payload: IncidentFromEventRequest): Promise<IncidentDTO> {
    const res = await api.post("/api/incidents/from-event", payload);
    return res.data;
  },

  async updateStatus(id: number, status: IncidentStatus): Promise<IncidentDTO> {
    const res = await api.put(`/api/incidents/${id}/status`, { status });
    return res.data;
  },
};