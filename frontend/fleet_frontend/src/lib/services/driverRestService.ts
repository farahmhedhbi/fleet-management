import {api} from "@/lib/api";

export const driverRestService = {
  async markReady() {
    const res = await api.post("/api/driver/rest/ready");
    return res.data;
  },
};