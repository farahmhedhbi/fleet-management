"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminOnly } from "@/components/layout/AdminOnly";
import { useAuth } from "@/contexts/authContext";
import { paymentService } from "@/lib/services/paymentService";
import type { PaymentResponse } from "@/types/payment";
import AdminPaymentsView from "./AdminPaymentsView";

export type FeedbackState = {
  type: "idle" | "ok" | "error";
  message?: string;
};

export default function AdminPaymentsPage() {
  return (
    <AdminOnly>
      <AdminPaymentsInner />
    </AdminOnly>
  );
}

function AdminPaymentsInner() {
  const { refreshMe } = useAuth();

  const [payments, setPayments] = useState<PaymentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);

  const [approveComment, setApproveComment] = useState<Record<number, string>>(
    {}
  );
  const [rejectComment, setRejectComment] = useState<Record<number, string>>(
    {}
  );

  const [feedback, setFeedback] = useState<FeedbackState>({
    type: "idle",
  });

  async function load() {
    setLoading(true);
    try {
      const data = await paymentService.getPendingPayments();
      setPayments(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setFeedback({
        type: "error",
        message:
          e?.response?.data?.message ||
          "Erreur lors du chargement des paiements.",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const pendingCount = useMemo(() => payments.length, [payments]);

  async function handleApprove(paymentId: number) {
    const comment = approveComment[paymentId];

    try {
      setBusyId(paymentId);
      setFeedback({ type: "idle" });

      await paymentService.approvePayment(paymentId, null, comment);
      await Promise.all([load(), refreshMe()]);

      setFeedback({
        type: "ok",
        message: `Paiement #${paymentId} approuvé avec génération automatique du PDF.`,
      });

      setApproveComment((prev) => ({ ...prev, [paymentId]: "" }));
    } catch (e: any) {
      setFeedback({
        type: "error",
        message:
          e?.response?.data?.message || "Erreur lors de l’approbation.",
      });
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject(paymentId: number) {
    try {
      setBusyId(paymentId);
      setFeedback({ type: "idle" });

      await paymentService.rejectPayment(paymentId, {
        comment: rejectComment[paymentId]?.trim() || undefined,
      });

      await load();

      setFeedback({
        type: "ok",
        message: `Paiement #${paymentId} refusé.`,
      });

      setRejectComment((prev) => ({ ...prev, [paymentId]: "" }));
    } catch (e: any) {
      setFeedback({
        type: "error",
        message: e?.response?.data?.message || "Erreur lors du refus.",
      });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <AdminPaymentsView
      payments={payments}
      loading={loading}
      busyId={busyId}
      pendingCount={pendingCount}
      feedback={feedback}
      approveComment={approveComment}
      rejectComment={rejectComment}
      onRefresh={load}
      onApprove={handleApprove}
      onReject={handleReject}
      setApproveComment={setApproveComment}
      setRejectComment={setRejectComment}
    />
  );
}