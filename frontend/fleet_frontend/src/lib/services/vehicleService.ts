import { api } from "@/lib/api";
import { Vehicle, VehicleDTO } from "@/types/vehicle";

export const vehicleService = {
  // ✅ ADMIN/OWNER
  async getAll(): Promise<Vehicle[]> {
    const res = await api.get<Vehicle[]>("/api/vehicles");
    return res.data;
  },

  // ✅ DRIVER: my vehicles only
  async me(): Promise<Vehicle[]> {
    const res = await api.get<Vehicle[]>("/api/vehicles/me");
    return res.data;
  },

  async getById(id: number): Promise<Vehicle> {
    const res = await api.get<Vehicle>(`/api/vehicles/${id}`);
    return res.data;
  },

  async create(vehicleData: VehicleDTO): Promise<Vehicle> {
    const payload = this.formatVehicleData(vehicleData);
    const res = await api.post<Vehicle>("/api/vehicles", payload);
    return res.data;
  },

  async update(id: number, vehicleData: VehicleDTO): Promise<Vehicle> {
    const payload = this.formatVehicleData(vehicleData);
    const res = await api.put<Vehicle>(`/api/vehicles/${id}`, payload);
    return res.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/api/vehicles/${id}`);
  },

  async assignDriver(vehicleId: number, driverId: number): Promise<Vehicle> {
    const res = await api.post<Vehicle>(`/api/vehicles/${vehicleId}/assign-driver/${driverId}`);
    return res.data;
  },

  async removeDriver(vehicleId: number): Promise<Vehicle> {
    const res = await api.post<Vehicle>(`/api/vehicles/${vehicleId}/remove-driver`);
    return res.data;
  },

  async getByDriverId(driverId: number): Promise<Vehicle[]> {
    const res = await api.get<Vehicle[]>(`/api/vehicles/by-driver/${driverId}`);
    return res.data;
  },

  formatVehicleData(vehicleData: VehicleDTO): any {
    const formatted: any = {
      ...vehicleData,
      year: Number(vehicleData.year),
      mileage: vehicleData.mileage ? Number(vehicleData.mileage) : 0.0,
      status: vehicleData.status || "AVAILABLE",
    };

    if (vehicleData.lastMaintenanceDate) {
      formatted.lastMaintenanceDate = this.formatDateForBackend(vehicleData.lastMaintenanceDate as any);
    }
    if (vehicleData.nextMaintenanceDate) {
      formatted.nextMaintenanceDate = this.formatDateForBackend(vehicleData.nextMaintenanceDate as any);
    }

    Object.keys(formatted).forEach((k) => formatted[k] === undefined && delete formatted[k]);
    return formatted;
  },

  formatDateForBackend(dateString: string): string {
    if (!dateString) return "";
    return dateString.includes("T") ? dateString : `${dateString}T00:00:00`;
  },
};
