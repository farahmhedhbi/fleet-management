"use client";

import { useEffect, useMemo, useState } from "react";

import { useAuth } from "@/contexts/authContext";
import { paymentService } from "@/lib/services/paymentService";
import {
  isSubscriptionActive,
  isSubscriptionExpired,
} from "@/lib/subscription";
import type { PaymentMethod, PaymentResponse } from "@/types/payment";

import OwnerBillingView from "./OwnerBillingView";

const MONTHLY_PRICE = 50;

export function buildFileUrl(path?: string | null) {
  if (!path) return "#";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `http://localhost:8080${path}`;
}

export function getStatusLabel(status?: string | null) {
  switch (status) {
    case "PENDING_OWNER_PROOF":
      return "Attente justificatif";
    case "PENDING_ADMIN_CASH_PROOF":
      return "Attente admin";
    case "PENDING_VERIFICATION":
      return "Vérification admin";
    case "APPROVED":
      return "Approuvé";
    case "REJECTED":
      return "Refusé";
    default:
      return status || "—";
  }
}

export function getStatusClass(status?: string | null) {
  switch (status) {
    case "PENDING_OWNER_PROOF":
      return "border-amber-200 bg-amber-50 text-amber-800";
    case "PENDING_ADMIN_CASH_PROOF":
      return "border-sky-200 bg-sky-50 text-sky-800";
    case "PENDING_VERIFICATION":
      return "border-violet-200 bg-violet-50 text-violet-800";
    case "APPROVED":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    case "REJECTED":
      return "border-red-200 bg-red-50 text-red-800";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

export function methodLabel(method?: string | null) {
  switch (method) {
    case "CASH":
      return "Cash";
    case "BANK_TRANSFER":
      return "Virement";
    case "CHEQUE":
      return "Chèque";
    default:
      return method || "—";
  }
}

export function methodBadgeClass(method?: string | null) {
  switch (method) {
    case "CASH":
      return "bg-sky-50 text-sky-700 border-sky-200";
    case "BANK_TRANSFER":
      return "bg-violet-50 text-violet-700 border-violet-200";
    case "CHEQUE":
      return "bg-amber-50 text-amber-700 border-amber-200";
    default:
      return "bg-slate-50 text-slate-700 border-slate-200";
  }
}

export function statusHelp(status?: string | null, method?: string | null) {
  if (status === "PENDING_OWNER_PROOF") {
    return "Vous devez envoyer votre justificatif de virement ou de chèque.";
  }
  if (status === "PENDING_ADMIN_CASH_PROOF") {
    return "Paiement cash déclaré. L’admin doit maintenant traiter le paiement.";
  }
  if (status === "PENDING_VERIFICATION") {
    return "Votre justificatif a été envoyé. L’admin doit vérifier puis activer le compte.";
  }
  if (status === "APPROVED") {
    return "Paiement validé. Le compte est activé.";
  }
  if (status === "REJECTED") {
    return method === "CASH"
      ? "Paiement refusé. Vérifiez le commentaire admin."
      : "Paiement refusé. Vérifiez le commentaire admin ou créez une nouvelle demande.";
  }
  return "—";
}

export default function OwnerBillingPage() {
  const { user, loading, refreshMe } = useAuth();

  const [months, setMonths] = useState<number>(1);
  const [method, setMethod] = useState<PaymentMethod>("CASH");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");

  const [selectedPaymentId, setSelectedPaymentId] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [payments, setPayments] = useState<PaymentResponse[]>([]);
  const [status, setStatus] = useState<{
    type: "idle" | "loading" | "ok" | "error";
    message?: string;
  }>({ type: "idle" });

  const isOwner = user?.role === "ROLE_OWNER";
  const active = isSubscriptionActive(user ?? undefined);
  const expired = isSubscriptionExpired(user ?? undefined);

  const amount = useMemo(() => {
    return months > 0 ? months * MONTHLY_PRICE : 0;
  }, [months]);

  const title = useMemo(() => {
    if (!isOwner) return "Billing";
    if (active) return "Abonnement actif";
    if (expired) return "Abonnement expiré";
    return "Paiement abonnement";
  }, [isOwner, active, expired]);

  const canCreate = useMemo(() => {
    return months > 0 && !!method;
  }, [months, method]);

  const pendingOwnerProofPayments = useMemo(() => {
    return payments.filter(
      (p) =>
        p.status === "PENDING_OWNER_PROOF" &&
        (p.method === "BANK_TRANSFER" || p.method === "CHEQUE")
    );
  }, [payments]);

  const latestPendingOwnerProof = useMemo(() => {
    return pendingOwnerProofPayments[0] ?? null;
  }, [pendingOwnerProofPayments]);

  async function loadPayments() {
    try {
      const data = await paymentService.getMyPayments();
      setPayments(Array.isArray(data) ? data : []);
    } catch (e: any) {
      console.error("loadPayments error", e);
    }
  }

  useEffect(() => {
    if (!user) return;
    loadPayments();
  }, [user]);

  useEffect(() => {
    if (latestPendingOwnerProof?.id) {
      setSelectedPaymentId(latestPendingOwnerProof.id);
    } else {
      setSelectedPaymentId(null);
    }
  }, [latestPendingOwnerProof]);

  async function handleCreatePayment() {
    if (!canCreate) {
      setStatus({
        type: "error",
        message: "Veuillez vérifier la durée et la méthode.",
      });
      return;
    }

    try {
      setStatus({
        type: "loading",
        message: "Création de la demande de paiement...",
      });

      const res = await paymentService.createPaymentRequest({
        amount,
        months,
        method,
        reference: reference.trim() || undefined,
        note: note.trim() || undefined,
      });

      setSelectedFile(null);
      setSelectedPaymentId(res.id);

      if (res.method === "CASH") {
        setStatus({
          type: "ok",
          message:
            "Demande cash créée. Aucun fichier owner n’est requis. L’admin va traiter la demande.",
        });
      } else {
        setStatus({
          type: "ok",
          message:
            "Demande créée. Ajoutez maintenant votre justificatif de paiement.",
        });
      }

      setReference("");
      setNote("");
      setMonths(1);
      setMethod("CASH");

      await Promise.all([loadPayments(), refreshMe()]);
    } catch (e: any) {
      setStatus({
        type: "error",
        message:
          e?.response?.data?.message ||
          "Erreur lors de la création de la demande de paiement.",
      });
    }
  }

  async function handleUploadProof() {
    if (!selectedPaymentId) {
      setStatus({
        type: "error",
        message: "Sélectionnez d’abord un paiement en attente de justificatif owner.",
      });
      return;
    }

    if (!selectedFile) {
      setStatus({
        type: "error",
        message: "Veuillez sélectionner un fichier justificatif.",
      });
      return;
    }

    try {
      setStatus({ type: "loading", message: "Envoi du justificatif..." });

      await paymentService.uploadOwnerProof(selectedPaymentId, selectedFile);

      setStatus({
        type: "ok",
        message:
          "Justificatif envoyé avec succès. Votre demande est maintenant en attente de vérification par l’admin.",
      });

      setSelectedFile(null);
      await Promise.all([loadPayments(), refreshMe()]);
    } catch (e: any) {
      setStatus({
        type: "error",
        message:
          e?.response?.data?.message || "Erreur lors de l’envoi du justificatif.",
      });
    }
  }

  async function handleRefreshAll() {
    setStatus({ type: "loading", message: "Actualisation..." });
    try {
      await Promise.all([loadPayments(), refreshMe()]);
      setStatus({ type: "ok", message: "Données actualisées." });
    } catch {
      setStatus({ type: "error", message: "Erreur lors de l’actualisation." });
    }
  }

  return (
    <OwnerBillingView
      user={user}
      loading={loading}
      isOwner={isOwner}
      active={active}
      expired={expired}
      title={title}
      months={months}
      setMonths={setMonths}
      method={method}
      setMethod={setMethod}
      reference={reference}
      setReference={setReference}
      note={note}
      setNote={setNote}
      amount={amount}
      canCreate={canCreate}
      selectedPaymentId={selectedPaymentId}
      setSelectedPaymentId={setSelectedPaymentId}
      selectedFile={selectedFile}
      setSelectedFile={setSelectedFile}
      payments={payments}
      pendingOwnerProofPayments={pendingOwnerProofPayments}
      latestPendingOwnerProof={latestPendingOwnerProof}
      status={status}
      onCreatePayment={handleCreatePayment}
      onUploadProof={handleUploadProof}
      onRefreshAll={handleRefreshAll}
    />
  );
}