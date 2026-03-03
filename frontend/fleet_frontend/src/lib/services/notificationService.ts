import { api } from "@/lib/api";
import type { Notification } from "@/types/notification";

export const notificationService = {
  async list(): Promise<Notification[]> {
    const res = await api.get<Notification[]>("/api/notifications");
    return res.data;
  },

  async unreadCount(): Promise<number> {
    const res = await api.get<number>("/api/notifications/unread-count");
    return Number(res.data) || 0;
  },

  async markRead(id: number): Promise<void> {
    await api.put(`/api/notifications/${id}/read`);
  },

  async markAllRead(): Promise<void> {
    await api.put("/api/notifications/read-all");
  },
};