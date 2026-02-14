// src/lib/services/adminUsersService.ts
import { api } from "@/lib/api";

export type RoleName = "ROLE_ADMIN" | "ROLE_OWNER" | "ROLE_DRIVER";

export interface AdminUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: RoleName | string;
  enabled: boolean;
  lastLoginAt?: string | null; // ISO string
}

// ✅ API Sprint 1 (AdminUserController)
export const adminUsersService = {
  async list(enabled?: boolean): Promise<AdminUser[]> {
    const params: any = {};
    if (enabled !== undefined) params.enabled = enabled;

    const res = await api.get<AdminUser[]>("/api/admin/users", { params });
    return res.data;
  },

  async setEnabled(id: number, value: boolean): Promise<AdminUser> {
    const res = await api.put<AdminUser>(`/api/admin/users/${id}/enable`, null, {
      params: { value },
    });
    return res.data;
  },

  // ✅ API Sprint 1 (AdminController)
  async updateUser(id: number, payload: { role?: RoleName }): Promise<any> {
    const res = await api.put(`/api/admin/users/${id}`, payload);
    return res.data;
  },
};
