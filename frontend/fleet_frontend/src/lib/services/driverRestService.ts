import { api } from "@/lib/api";

export const driverRestService = {
  async markReady() {
    const res = await api.post("/api/driver/rest/ready");
    return res.data;
  },

  async startMiddleRest(missionId: number) {
    const res = await api.post(`/api/driver/rest/middle/${missionId}`);
    return res.data;
  },
};