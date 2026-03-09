import { api } from "@/lib/api";
import type { Driver, DriverDTO } from "@/types/driver";
import type { CreateDriverByOwnerRequest } from "@/types/auth";

function toLocalDateTime(value?: string | null) {
  if (!value) return value;
  return value.includes("T") ? value : `${value}T00:00:00`;
}

function normalizeDateTime(value?: string | null) {
  if (!value) return value;
  return value.includes("T") ? value : `${value}T00:00:00`;
}

export const driverService = {
  async getAll(): Promise<Driver[]> {
    const res = await api.get<Driver[]>("/api/drivers");
    return Array.isArray(res.data) ? res.data : [];
  },

  async getById(id: number): Promise<Driver> {
    const res = await api.get<Driver>(`/api/drivers/${id}`);
    return res.data;
  },

  async me(): Promise<Driver> {
    const res = await api.get<Driver>("/api/drivers/me");
    return res.data;
  },

  async create(driverData: CreateDriverByOwnerRequest): Promise<Driver> {
    const payload: CreateDriverByOwnerRequest = {
      ...driverData,
      licenseExpiry: toLocalDateTime(driverData.licenseExpiry),
    };

    const res = await api.post<Driver>("/api/drivers", payload);
    return res.data;
  },

  async update(id: number, driverData: DriverDTO): Promise<Driver> {
    const payload = {
      ...driverData,
      licenseExpiry: normalizeDateTime(driverData.licenseExpiry ?? null),
    };

    const res = await api.put<Driver>(`/api/drivers/${id}`, payload);
    return res.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/api/drivers/${id}`);
  },
};