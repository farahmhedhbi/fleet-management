import { api } from "@/lib/api";
import type {
  CreateOwnerPaymentRequest,
  PaymentDecisionRequest,
  PaymentResponse,
} from "@/types/payment";

export const paymentService = {
  // =========================
  // OWNER
  // =========================
  async createPaymentRequest(payload: CreateOwnerPaymentRequest): Promise<PaymentResponse> {
    const res = await api.post<PaymentResponse>("/api/payments", payload);
    return res.data;
  },

  async uploadOwnerProof(paymentId: number, file: File): Promise<PaymentResponse> {
    const formData = new FormData();
    formData.append("file", file);

    const res = await api.post<PaymentResponse>(
      `/api/payments/${paymentId}/owner-proof`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return res.data;
  },

  async getMyPayments(): Promise<PaymentResponse[]> {
    const res = await api.get<PaymentResponse[]>("/api/payments/my");
    return res.data;
  },

  // =========================
  // ADMIN
  // =========================
  async getPendingPayments(): Promise<PaymentResponse[]> {
    const res = await api.get<PaymentResponse[]>("/api/admin/payments/pending");
    return res.data;
  },

  async approvePayment(
    paymentId: number,
    file: File,
    comment?: string
  ): Promise<PaymentResponse> {
    const formData = new FormData();
    formData.append("file", file);
    if (comment?.trim()) {
      formData.append("comment", comment.trim());
    }

    const res = await api.put<PaymentResponse>(
      `/api/admin/payments/${paymentId}/approve`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return res.data;
  },

  async rejectPayment(
    paymentId: number,
    payload?: PaymentDecisionRequest
  ): Promise<PaymentResponse> {
    const res = await api.put<PaymentResponse>(
      `/api/admin/payments/${paymentId}/reject`,
      payload ?? {}
    );
    return res.data;
  },
};