import { api } from "@/lib/api";

export type ActivateSubscriptionRequest = {
  months: number;
  amount: number;
  method: "CASH" | "BANK_TRANSFER" | "CHEQUE";
  reference?: string;
  note?: string;
};

export const adminSubscriptionService = {
  activate(ownerId: number, req: ActivateSubscriptionRequest) {
    return api.post(`/api/admin/users/${ownerId}/activate-subscription`, req);
  },
  payments(ownerId: number) {
    return api.get(`/api/admin/users/${ownerId}/payments`);
  },
};