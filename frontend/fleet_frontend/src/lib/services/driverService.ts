import { api } from "@/lib/api";
import { Driver, DriverDTO } from "@/types/driver";

export const driverService = {
  async getAll(): Promise<Driver[]> {
    try {
      const res = await api.get<Driver[]>("/api/drivers");
      return res.data;
    } catch (error: any) {
      console.error("❌ Failed to fetch drivers:", error);
      throw error;
    }
  },

  async getById(id: number): Promise<Driver> {
    try {
      const res = await api.get<Driver>(`/api/drivers/${id}`);
      return res.data;
    } catch (error: any) {
      console.error(`❌ Failed to fetch driver ${id}:`, error);
      throw error;
    }
  },

  async create(driverData: DriverDTO): Promise<Driver> {
    const payload: any = { ...driverData };
    if (!payload.status) payload.status = "ACTIVE";
    if (payload.licenseExpiry && !String(payload.licenseExpiry).includes("T")) {
      payload.licenseExpiry = new Date(payload.licenseExpiry).toISOString();
    }

    try {
      const res = await api.post<Driver>("/api/drivers", payload);
      return res.data;
    } catch (error: any) {
      console.error("❌ Failed to create driver:", error);
      throw error;
    }
  },

  async update(id: number, driverData: DriverDTO): Promise<Driver> {
    try {
      const res = await api.put<Driver>(`/api/drivers/${id}`, driverData);
      return res.data;
    } catch (error: any) {
      console.error(`❌ Failed to update driver ${id}:`, error);
      throw error;
    }
  },

  async delete(id: number): Promise<void> {
    try {
      await api.delete(`/api/drivers/${id}`);
    } catch (error: any) {
      console.error(`❌ Failed to delete driver ${id}:`, error);
      throw error;
    }
  },
};
