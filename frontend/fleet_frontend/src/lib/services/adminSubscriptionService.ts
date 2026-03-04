import { api } from "@/lib/api";

export type ActivateSubscriptionRequest = {
  months: number;
  amount: number;
  method: "CASH" | "BANK_TRANSFER" | "CHEQUE";
  reference?: string;
  note?: string;
};

export const adminSubscriptionService = {
  activateByEmail(ownerEmail: string, req: ActivateSubscriptionRequest) {
    const email = ownerEmail.trim().toLowerCase();
    return api.post(
      `/api/admin/owners/by-email/${encodeURIComponent(email)}/activate-subscription`,
      req
    );
  },

  paymentsByEmail(ownerEmail: string) {
    const email = ownerEmail.trim().toLowerCase();
    return api.get(
      `/api/admin/owners/by-email/${encodeURIComponent(email)}/payments`
    );
  },
};