import { api } from "@/lib/api";
import type {
  MaintenanceCreateRequest,
  MaintenanceDTO,
  MaintenanceStatus,
} from "@/types/maintenance";

export const maintenanceService = {
  async getAll(): Promise<MaintenanceDTO[]> {
    const res = await api.get("/api/maintenances");
    return res.data;
  },

  async getById(id: number): Promise<MaintenanceDTO> {
    const res = await api.get(`/api/maintenances/${id}`);
    return res.data;
  },

  async getByVehicle(vehicleId: number): Promise<MaintenanceDTO[]> {
    const res = await api.get(`/api/maintenances/vehicle/${vehicleId}`);
    return res.data;
  },

  async getUpcoming(): Promise<MaintenanceDTO[]> {
    const res = await api.get("/api/maintenances/upcoming");
    return res.data;
  },

  async getByStatus(status: MaintenanceStatus): Promise<MaintenanceDTO[]> {
    const res = await api.get(`/api/maintenances/status/${status}`);
    return res.data;
  },

  async getByIncident(incidentId: number): Promise<MaintenanceDTO | null> {
    try {
      const res = await api.get(`/api/maintenances/incident/${incidentId}`);
      return res.data ?? null;
    } catch (error: any) {
      if (error?.response?.status === 404) return null;
      throw error;
    }
  },

  async create(payload: MaintenanceCreateRequest): Promise<MaintenanceDTO> {
    const res = await api.post("/api/maintenances", payload);
    return res.data;
  },

  async createFromIncident(incidentId: number): Promise<MaintenanceDTO> {
    const res = await api.post(`/api/maintenances/from-incident/${incidentId}`);
    return res.data;
  },

  async updateStatus(
  id: number,
  status: MaintenanceStatus
): Promise<MaintenanceDTO> {

  const res = await api.put(
    `/api/maintenances/${id}/status`,
    { status }
  );

  return res.data;
},

  async cancel(id: number): Promise<MaintenanceDTO> {
    const res = await api.put(`/api/maintenances/${id}/cancel`);
    return res.data;
  },
};