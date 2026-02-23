// src/lib/services/vehicleService.ts
import { api } from "@/lib/api";
import type { Vehicle, VehicleDTO } from "@/types/vehicle";

function toLocalDateTime(v?: string | null) {
  if (!v) return v;
  return v.includes("T") ? v : `${v}T00:00:00`;
}

export const vehicleService = {
  async getAll(): Promise<Vehicle[]> {
    const res = await api.get<Vehicle[]>("/api/vehicles");
    return res.data;
  },

  async getById(id: number): Promise<Vehicle> {
    const res = await api.get<Vehicle>(`/api/vehicles/${id}`);
    return res.data;
  },

  async create(payload: VehicleDTO): Promise<Vehicle> {
    const fixed: any = { ...payload };
    fixed.lastMaintenanceDate = toLocalDateTime(fixed.lastMaintenanceDate);
    fixed.nextMaintenanceDate = toLocalDateTime(fixed.nextMaintenanceDate);

    const res = await api.post<Vehicle>("/api/vehicles", fixed);
    return res.data;
  },

  async update(id: number, payload: VehicleDTO): Promise<Vehicle> {
    const fixed: any = { ...payload };
    fixed.lastMaintenanceDate = toLocalDateTime(fixed.lastMaintenanceDate);
    fixed.nextMaintenanceDate = toLocalDateTime(fixed.nextMaintenanceDate);

    const res = await api.put<Vehicle>(`/api/vehicles/${id}`, fixed);
    return res.data;
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/api/vehicles/${id}`);
  },

  // ✅ Affecter
  async assignDriver(vehicleId: number, driverId: number): Promise<Vehicle> {
    const res = await api.post<Vehicle>(
      `/api/vehicles/${vehicleId}/assign-driver/${driverId}`
    );
    return res.data;
  },

  // ✅ Désaffecter (مهم: route الصحيح حسب backend متاعك)
  async unassignDriver(vehicleId: number): Promise<Vehicle> {
    // ✅ backend: removeDriver(...) -> vehicleService.removeDriverFromVehicleSecured(...)
    const res = await api.post<Vehicle>(`/api/vehicles/${vehicleId}/remove-driver`);
    return res.data;
  },
  // ⚠️ getMine حاليا نفس getAll (كان عندك endpoint خاص بالـ owner بدلو هنا)
  async getMine(): Promise<Vehicle[]> {
    const res = await api.get<Vehicle[]>("/api/vehicles");
    return res.data;
  },
};