import { api } from "@/lib/api";
import type { User, CreateUserDTO, UpdateUserDTO } from "@/types/user";
import type { Vehicle } from "@/types/vehicle";

export const adminService = {
  // ===== Owners =====
  async listOwners(): Promise<User[]> {
    const res = await api.get<User[]>("/api/admin/owners");
    return res.data;
  },

  async vehiclesByOwner(ownerId: number): Promise<Vehicle[]> {
    const res = await api.get<Vehicle[]>(`/api/admin/owners/${ownerId}/vehicles`);
    return res.data;
  },

  // ===== Users =====
  async listUsers(): Promise<User[]> {
    const res = await api.get<User[]>("/api/admin/users");
    return res.data;
  },

  async getUser(id: number): Promise<User> {
    const res = await api.get<User>(`/api/admin/users/${id}`);
    return res.data;
  },

  async createUser(payload: CreateUserDTO): Promise<User> {
    const res = await api.post<User>("/api/admin/users", payload);
    return res.data;
  },

  async updateUser(id: number, payload: UpdateUserDTO): Promise<User> {
    const res = await api.put<User>(`/api/admin/users/${id}`, payload);
    return res.data;
  },

  async deleteUser(id: number): Promise<void> {
    await api.delete(`/api/admin/users/${id}`);
  },
};
