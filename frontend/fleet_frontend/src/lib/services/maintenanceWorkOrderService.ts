import { api } from "@/lib/api";
import type {
  MaintenanceWorkOrderCreateRequest,
  MaintenanceWorkOrderDTO,
  MaintenanceWorkOrderStatusRequest,
} from "@/types/maintenance";

export const maintenanceWorkOrderService = {
  async getAll(): Promise<MaintenanceWorkOrderDTO[]> {
    const res = await api.get("/api/maintenance-work-orders");
    return res.data;
  },

  async getById(id: number): Promise<MaintenanceWorkOrderDTO> {
    const res = await api.get(`/api/maintenance-work-orders/${id}`);
    return res.data;
  },

  async getByVehicle(vehicleId: number): Promise<MaintenanceWorkOrderDTO[]> {
    const res = await api.get(`/api/maintenance-work-orders/vehicle/${vehicleId}`);
    return res.data;
  },

  async create(
    payload: MaintenanceWorkOrderCreateRequest
  ): Promise<MaintenanceWorkOrderDTO> {
    const res = await api.post("/api/maintenance-work-orders", payload);
    return res.data;
  },

  async updateStatus(
    id: number,
    payload: MaintenanceWorkOrderStatusRequest
  ): Promise<MaintenanceWorkOrderDTO> {
    const res = await api.put(
      `/api/maintenance-work-orders/${id}/status`,
      payload
    );
    return res.data;
  },
};