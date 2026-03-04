import { api } from "@/lib/api"; // نفس axios instance اللي تستعمله في باقي services

export type AdminStats = {
  ownersCount: number;
  vehiclesCount: number;
  availableVehicles: number;
  inServiceVehicles: number;
  outVehicles: number;
  driversCount: number;
  activeDrivers: number;
  vehiclesNeedingMaintenance: number;
  totalMileage: number;
};

export const adminStatsService = {
  async get(): Promise<AdminStats> {
    const res = await api.get("/api/admin/stats");
    return res.data as AdminStats;
  },
};