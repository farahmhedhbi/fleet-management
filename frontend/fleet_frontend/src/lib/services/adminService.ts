import { api } from "@/lib/api";
import type { User, UpdateUserDTO, InviteOwnerDTO } from "@/types/user";
import type { Vehicle } from "@/types/vehicle";

export type OwnerDriverCountDTO = {
  ownerId: number;
  driversCount: number;
};

export type OwnerVehicleCountDTO = {
  ownerId: number;
  vehiclesCount: number;
};

export const adminService = {
  async listOwners(): Promise<User[]> {
    const res = await api.get<User[]>("/api/admin/owners");
    return res.data;
  },

  async vehiclesByOwner(ownerId: number): Promise<Vehicle[]> {
    const res = await api.get<Vehicle[]>(`/api/admin/owners/${ownerId}/vehicles`);
    return res.data;
  },

  async countDriversByOwner(ownerId: number): Promise<OwnerDriverCountDTO> {
    const res = await api.get<OwnerDriverCountDTO>(
      `/api/admin/owners/${ownerId}/drivers/count`
    );
    return res.data;
  },

  async countVehiclesByOwner(ownerId: number): Promise<OwnerVehicleCountDTO> {
    const res = await api.get<OwnerVehicleCountDTO>(
      `/api/admin/owners/${ownerId}/vehicles/count`
    );
    return res.data;
  },

  async listUsers(): Promise<User[]> {
    const res = await api.get<User[]>("/api/admin/users");
    return res.data;
  },

  async getUser(id: number): Promise<User> {
    const res = await api.get<User>(`/api/admin/users/${id}`);
    return res.data;
  },

  async updateUser(id: number, payload: UpdateUserDTO): Promise<User> {
    const res = await api.put<User>(`/api/admin/users/${id}`, payload);
    return res.data;
  },

  async deleteUser(id: number): Promise<void> {
    await api.delete(`/api/admin/users/${id}`);
  },

  async inviteOwner(payload: InviteOwnerDTO): Promise<User> {
    const body = {
      ...payload,
      role: "ROLE_OWNER",
    };

    const res = await api.post<User>("/api/admin/owners/invite", body);
    return res.data;
  },
};