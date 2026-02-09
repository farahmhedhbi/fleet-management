import { api } from "@/lib/api";
import { Driver, DriverDTO } from "@/types/driver";

export const driverService = {
  // ✅ ADMIN/OWNER: list all
  async getAll(): Promise<Driver[]> {
    const res = await api.get<Driver[]>("/api/drivers");
    return res.data;
  },

  // ✅ ADMIN/OWNER
  async getById(id: number): Promise<Driver> {
    const res = await api.get<Driver>(`/api/drivers/${id}`);
    return res.data;
  },

  // ✅ DRIVER: profile only
  async me(): Promise<Driver> {
    const res = await api.get<Driver>("/api/drivers/me");
    return res.data;
  },

  // ✅ ADMIN/OWNER: create driver
  async create(driverData: DriverDTO): Promise<Driver> {
    const payload: any = { ...driverData };
    if (!payload.status) payload.status = "ACTIVE";
    if (payload.licenseExpiry && !String(payload.licenseExpiry).includes("T")) {
      payload.licenseExpiry = `${payload.licenseExpiry}T00:00:00`;
    }

    const res = await api.post<Driver>("/api/drivers", payload);
    return res.data;
  },

  // ✅ ADMIN/OWNER
  async update(id: number, driverData: DriverDTO): Promise<Driver> {
    const res = await api.put<Driver>(`/api/drivers/${id}`, driverData);
    return res.data;
  },

  // ✅ ADMIN only
  async delete(id: number): Promise<void> {
    await api.delete(`/api/drivers/${id}`);
  },
};
