import { api } from "@/lib/api";
import type {
  IncidentCreateRequest,
  IncidentDTO,
  IncidentFromEventRequest,
  IncidentHistoryDTO,
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

  async createWithPhotos(
    payload: IncidentCreateRequest,
    photos?: File[]
  ): Promise<IncidentDTO> {
    const formData = new FormData();

    formData.append(
      "data",
      new Blob([JSON.stringify(payload)], {
        type: "application/json",
      })
    );

    photos?.forEach((photo) => {
      formData.append("photos", photo);
    });

    const res = await api.post("/api/incidents/with-photos", formData);
    return res.data;
  },

  async getHistory(id: number): Promise<IncidentHistoryDTO[]> {
    const res = await api.get(`/api/incidents/${id}/history`);
    return res.data;
  },

  async getAllHistory(): Promise<IncidentHistoryDTO[]> {
    const res = await api.get("/api/incidents/history");
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