"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CreditCard,
  Receipt,
  Upload,
  RefreshCcw,
  CheckCircle2,
  AlertTriangle,
  Clock3,
  Wallet,
  Landmark,
  BadgeDollarSign,
  FileText,
  ShieldCheck,
} from "lucide-react";

import { useAuth } from "@/contexts/authContext";
import { paymentService } from "@/lib/services/paymentService";
import {
  isSubscriptionActive,
  isSubscriptionExpired,
  fmtDateTime,
} from "@/lib/subscription";
import type { PaymentMethod, PaymentResponse } from "@/types/payment";

function cn(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function buildFileUrl(path?: string | null) {
  if (!path) return "#";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `http://localhost:8080${path}`;
}

function getStatusLabel(status?: string | null) {
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

function getStatusClass(status?: string | null) {
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

function methodLabel(method?: string | null) {
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

function methodBadgeClass(method?: string | null) {
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

function statusHelp(status?: string | null, method?: string | null) {
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
  const [amount, setAmount] = useState<number>(50);
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

  const title = useMemo(() => {
    if (!isOwner) return "Billing";
    if (active) return "Abonnement actif";
    if (expired) return "Abonnement expiré";
    return "Paiement abonnement";
  }, [isOwner, active, expired]);

  const canCreate = useMemo(() => {
    return amount > 0 && months > 0 && !!method;
  }, [amount, months, method]);

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
        message: "Veuillez vérifier le montant, la durée et la méthode.",
      });
      return;
    }

    try {
      setStatus({ type: "loading", message: "Création de la demande de paiement..." });

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

  if (loading) {
    return <div className="p-6 text-slate-700">Chargement...</div>;
  }

  if (!user) {
    return <div className="p-6 text-slate-700">Non connecté.</div>;
  }

  if (!isOwner) {
    return <div className="p-6 text-slate-700">Cette page est réservée au owner.</div>;
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-7xl p-4 md:p-6">
        <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
                {title}
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Gérez vos paiements hors ligne et suivez la validation administrative.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold",
                  active && "border-emerald-200 bg-emerald-50 text-emerald-700",
                  expired && "border-red-200 bg-red-50 text-red-700",
                  !active &&
                    !expired &&
                    "border-amber-200 bg-amber-50 text-amber-700"
                )}
              >
                {active ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Actif
                  </>
                ) : expired ? (
                  <>
                    <AlertTriangle className="h-4 w-4" />
                    Expiré
                  </>
                ) : (
                  <>
                    <Clock3 className="h-4 w-4" />
                    En attente / essai
                  </>
                )}
              </div>

              <button
                onClick={handleRefreshAll}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-800 shadow-sm transition hover:bg-slate-50"
              >
                <RefreshCcw className="h-4 w-4" />
                Actualiser
              </button>
            </div>
          </div>
        </div>

        {status.message && (
          <div
            className={cn(
              "mb-6 rounded-2xl border p-4 text-sm font-semibold shadow-sm",
              status.type === "ok" && "border-emerald-200 bg-emerald-50 text-emerald-800",
              status.type === "error" && "border-red-200 bg-red-50 text-red-800",
              status.type === "loading" && "border-blue-200 bg-blue-50 text-blue-800"
            )}
          >
            {status.message}
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
          <div className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-2xl bg-slate-900 p-3 text-white shadow-sm">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900">Créer une demande</h2>
                  <p className="text-sm text-slate-600">
                    Choisissez la méthode et enregistrez votre paiement.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Durée (mois)
                  <input
                    type="number"
                    min={1}
                    value={months}
                    onChange={(e) => setMonths(Number(e.target.value))}
                    className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-slate-300 focus:ring-4 focus:ring-slate-100"
                  />
                </label>

                <label className="block text-sm font-semibold text-slate-700">
                  Montant (DT)
                  <input
                    type="number"
                    min={1}
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-slate-300 focus:ring-4 focus:ring-slate-100"
                  />
                </label>

                <label className="block text-sm font-semibold text-slate-700">
                  Méthode
                  <select
                    value={method}
                    onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                    className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-slate-300 focus:ring-4 focus:ring-slate-100"
                  >
                    <option value="CASH">Cash</option>
                    <option value="BANK_TRANSFER">Virement</option>
                    <option value="CHEQUE">Chèque</option>
                  </select>
                </label>

                <label className="block text-sm font-semibold text-slate-700">
                  Référence
                  <input
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="ex: REF-2026-001"
                    className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-slate-300 focus:ring-4 focus:ring-slate-100"
                  />
                </label>

                <label className="block text-sm font-semibold text-slate-700 md:col-span-2">
                  Note
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Ajoutez un commentaire si nécessaire."
                    rows={4}
                    className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-slate-300 focus:ring-4 focus:ring-slate-100"
                  />
                </label>
              </div>

              <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                {method === "CASH" ? (
                  <div className="flex items-start gap-3">
                    <div className="rounded-2xl bg-sky-100 p-2 text-sky-700">
                      <Wallet className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-extrabold text-slate-900">Paiement cash</div>
                      <div className="mt-1 text-sm text-slate-600">
                        Après création, vous n’envoyez aucun justificatif. L’admin traitera ensuite la demande.
                      </div>
                    </div>
                  </div>
                ) : method === "BANK_TRANSFER" ? (
                  <div className="flex items-start gap-3">
                    <div className="rounded-2xl bg-violet-100 p-2 text-violet-700">
                      <Landmark className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-extrabold text-slate-900">Paiement par virement</div>
                      <div className="mt-1 text-sm text-slate-600">
                        Après création, envoyez votre justificatif de virement pour validation.
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <div className="rounded-2xl bg-amber-100 p-2 text-amber-700">
                      <BadgeDollarSign className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-extrabold text-slate-900">Paiement par chèque</div>
                      <div className="mt-1 text-sm text-slate-600">
                        Après création, envoyez votre justificatif de chèque pour validation.
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6">
                <button
                  onClick={handleCreatePayment}
                  disabled={!canCreate || status.type === "loading"}
                  className={cn(
                    "inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-extrabold text-white shadow-sm transition",
                    canCreate
                      ? "bg-slate-900 hover:bg-slate-800"
                      : "cursor-not-allowed bg-slate-400"
                  )}
                >
                  Créer la demande
                </button>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-2xl bg-blue-600 p-3 text-white shadow-sm">
                  <Upload className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900">
                    Envoyer le justificatif owner
                  </h2>
                  <p className="text-sm text-slate-600">
                    Uniquement pour les paiements virement ou chèque en attente.
                  </p>
                </div>
              </div>

              {pendingOwnerProofPayments.length > 0 ? (
                <>
                  <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                    Paiement sélectionné : <span className="font-extrabold">#{latestPendingOwnerProof?.id}</span>
                    {" — "}
                    {methodLabel(latestPendingOwnerProof?.method)}
                    {" — "}
                    {latestPendingOwnerProof?.amount} DT
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="block text-sm font-semibold text-slate-700">
                      Paiement concerné
                      <select
                        value={selectedPaymentId ?? ""}
                        onChange={(e) => setSelectedPaymentId(Number(e.target.value))}
                        className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-slate-300 focus:ring-4 focus:ring-slate-100"
                      >
                        {pendingOwnerProofPayments.map((p) => (
                          <option key={p.id} value={p.id}>
                            #{p.id} — {methodLabel(p.method)} — {p.amount} DT
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block text-sm font-semibold text-slate-700">
                      Fichier justificatif
                      <input
                        type="file"
                        accept=".pdf,image/*"
                        onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                        className="mt-1.5 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                      />
                    </label>
                  </div>

                  <div className="mt-5">
                    <button
                      onClick={handleUploadProof}
                      disabled={status.type === "loading"}
                      className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-blue-700"
                    >
                      Envoyer le justificatif
                    </button>
                  </div>
                </>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  Aucun paiement n’attend actuellement un justificatif.
                </div>
              )}
            </section>
          </div>

          <div className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-slate-900" />
                <h3 className="text-base font-extrabold text-slate-900">Résumé abonnement</h3>
              </div>

              <div className="grid gap-3 sm:grid-cols-1">
                <InfoCard label="Statut" value={user.subscriptionStatus ?? "—"} />
                <InfoCard label="Paiement valide jusqu’à" value={fmtDateTime(user.paidUntil)} />
                <InfoCard label="Fin essai" value={fmtDateTime(user.trialEndAt)} />
              </div>

              <div className="mt-4 text-sm">
                {active ? (
                  <div className="flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-700">
                    <CheckCircle2 className="mt-0.5 h-4 w-4" />
                    Votre abonnement est actif.
                  </div>
                ) : expired ? (
                  <div className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-3 text-red-700">
                    <AlertTriangle className="mt-0.5 h-4 w-4" />
                    Votre abonnement est expiré. Lancez un nouveau paiement.
                  </div>
                ) : (
                  <div className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-amber-700">
                    <Clock3 className="mt-0.5 h-4 w-4" />
                    Votre compte est en essai ou en attente de validation.
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <Receipt className="h-5 w-5 text-slate-900" />
                <h3 className="text-base font-extrabold text-slate-900">Historique paiements</h3>
              </div>

              <div className="max-h-[780px] space-y-4 overflow-y-auto pr-1">
                {payments.length === 0 ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                    Aucun paiement pour le moment.
                  </div>
                ) : (
                  payments.map((p) => (
                    <article
                      key={p.id}
                      className="rounded-3xl border border-slate-200 bg-slate-50/50 p-4 transition hover:border-slate-300"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="text-base font-extrabold text-slate-900">
                              Paiement #{p.id}
                            </div>
                            <span
                              className={cn(
                                "inline-flex rounded-full border px-2.5 py-1 text-[11px] font-extrabold",
                                methodBadgeClass(p.method)
                              )}
                            >
                              {methodLabel(p.method)}
                            </span>
                          </div>

                          <div className="mt-2 text-sm text-slate-700">
                            {p.amount} DT • {p.months} mois
                          </div>

                          <div className="mt-1 text-xs text-slate-500">
                            Créé le {fmtDateTime(p.paidAt)}
                          </div>
                        </div>

                        <span
                          className={cn(
                            "inline-flex rounded-full border px-3 py-1 text-xs font-extrabold",
                            getStatusClass(p.status)
                          )}
                        >
                          {getStatusLabel(p.status)}
                        </span>
                      </div>

                      {(p.reference || p.note) && (
                        <div className="mt-4 grid gap-2 text-sm text-slate-700">
                          {p.reference && (
                            <div>
                              <span className="font-bold text-slate-900">Référence :</span> {p.reference}
                            </div>
                          )}
                          {p.note && (
                            <div>
                              <span className="font-bold text-slate-900">Note :</span> {p.note}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-700">
                        {statusHelp(p.status, p.method)}
                      </div>

                      {(p.proofFileUrl || p.adminProofFileUrl || p.adminComment) && (
                        <div className="mt-4 space-y-3">
                          {p.proofFileUrl && (
                            <FileBox
                              title="Justificatif owner"
                              fileName={p.proofFileName || "Fichier owner"}
                              href={buildFileUrl(p.proofFileUrl)}
                              tone="default"
                            />
                          )}

                          {p.adminProofFileUrl && (
                            <FileBox
                              title="Justificatif admin"
                              fileName={p.adminProofFileName || "Confirmation admin"}
                              href={buildFileUrl(p.adminProofFileUrl)}
                              tone="success"
                            />
                          )}

                          {p.adminComment && (
                            <div className="rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-700">
                              <span className="font-bold text-slate-900">Commentaire admin :</span>{" "}
                              {p.adminComment}
                            </div>
                          )}
                        </div>
                      )}
                    </article>
                  ))
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className="mt-1 break-all text-sm font-extrabold text-slate-900">
        {value ?? "—"}
      </div>
    </div>
  );
}

function FileBox({
  title,
  fileName,
  href,
  tone = "default",
}: {
  title: string;
  fileName: string;
  href: string;
  tone?: "default" | "success";
}) {
  const isSuccess = tone === "success";

  return (
    <div
      className={cn(
        "rounded-2xl border p-3",
        isSuccess ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-white"
      )}
    >
      <div
        className={cn(
          "text-[11px] font-extrabold uppercase tracking-wide",
          isSuccess ? "text-emerald-700" : "text-slate-500"
        )}
      >
        {title}
      </div>

      <div className="mt-2 flex items-center justify-between gap-3">
        <div
          className={cn(
            "truncate text-sm font-semibold",
            isSuccess ? "text-emerald-900" : "text-slate-800"
          )}
        >
          {fileName}
        </div>

        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className={cn(
            "inline-flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-extrabold text-white shadow-sm transition",
            isSuccess ? "bg-emerald-600 hover:bg-emerald-700" : "bg-slate-900 hover:bg-slate-800"
          )}
        >
          <FileText className="h-3.5 w-3.5" />
          Ouvrir
        </a>
      </div>
    </div>
  );
}