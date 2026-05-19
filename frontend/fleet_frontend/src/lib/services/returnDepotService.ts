import { api } from "@/lib/api";
import type { ReturnDepotDTO } from "@/types/returnDepot";

export const returnDepotService = {
  async suggest(missionId: number): Promise<ReturnDepotDTO> {
    const res = await api.post<ReturnDepotDTO>(
      `/api/return-depot/mission/${missionId}/suggest`
    );
    return res.data;
  },

  async accept(requestId: number): Promise<ReturnDepotDTO> {
    const res = await api.post<ReturnDepotDTO>(
      `/api/return-depot/${requestId}/accept`
    );
    return res.data;
  },

  async reject(requestId: number): Promise<ReturnDepotDTO> {
    const res = await api.post<ReturnDepotDTO>(
      `/api/return-depot/${requestId}/reject`
    );
    return res.data;
  },
};