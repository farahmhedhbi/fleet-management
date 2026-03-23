"use client";

import { useMemo, useState } from "react";
import { adminSubscriptionService } from "@/lib/services/adminSubscriptionService";
import AdminSubscriptionsView from "./AdminSubscriptionsView";

export type PaymentHistoryItem = {
  id: number;
  method?: string | null;
  status?: string | null;
  amount?: number | null;
  months?: number | null;
  reference?: string | null;
  note?: string | null;
  adminComment?: string | null;
  paidAt?: string | null;
  validatedAt?: string | null;
  proofFileName?: string | null;
  proofFileUrl?: string | null;
  adminProofFileName?: string | null;
  adminProofFileUrl?: string | null;
};

export type AdminSubscriptionsStatus = {
  type: "idle" | "loading" | "ok" | "error";
  message?: string;
};

function isValidEmail(v: string) {
  const s = v.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

export default function AdminSubscriptionsPage() {
  const [ownerEmail, setOwnerEmail] = useState("");
  const [payments, setPayments] = useState<PaymentHistoryItem[]>([]);
  const [status, setStatus] = useState<AdminSubscriptionsStatus>({
    type: "idle",
  });

  const cleanEmail = useMemo(
    () => ownerEmail.trim().toLowerCase(),
    [ownerEmail]
  );
  const canSearch = useMemo(() => isValidEmail(cleanEmail), [cleanEmail]);

  const resetUI = () => {
    setOwnerEmail("");
    setPayments([]);
    setStatus({ type: "idle" });
  };

  const loadPayments = async () => {
    if (!isValidEmail(cleanEmail)) {
      setStatus({
        type: "error",
        message: "Veuillez saisir un email OWNER valide.",
      });
      return;
    }

    setStatus({
      type: "loading",
      message: "Chargement de l’historique des paiements...",
    });

    try {
      const res = await adminSubscriptionService.paymentsByEmail(cleanEmail);
      const data = Array.isArray(res.data) ? res.data : [];
      setPayments(data);

      setStatus({
        type: "ok",
        message: "Historique chargé avec succès.",
      });
    } catch (e: any) {
      setPayments([]);
      setStatus({
        type: "error",
        message:
          e?.response?.data?.message ||
          "Erreur lors du chargement de l’historique des paiements.",
      });
    }
  };

  return (
    <AdminSubscriptionsView
      ownerEmail={ownerEmail}
      payments={payments}
      status={status}
      cleanEmail={cleanEmail}
      canSearch={canSearch}
      onOwnerEmailChange={setOwnerEmail}
      onReset={resetUI}
      onSearch={loadPayments}
    />
  );
}