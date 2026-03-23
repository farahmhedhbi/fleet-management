"use client";

import {CreditCard,Receipt,Upload,RefreshCcw,CheckCircle2,AlertTriangle,Clock3,Wallet,Landmark,BadgeDollarSign,
FileText,ShieldCheck,
} from "lucide-react";

import { fmtDateTime } from "@/lib/subscription";
import type { PaymentMethod, PaymentResponse } from "@/types/payment";

import {
  buildFileUrl,
  getStatusLabel,
  getStatusClass,
  methodLabel,
  methodBadgeClass,
  statusHelp,
} from "./page";

function cn(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

interface OwnerBillingViewProps {
  user: any;
  loading: boolean;
  isOwner: boolean;
  active: boolean;
  expired: boolean;
  title: string;
  months: number;
  setMonths: (value: number) => void;
  method: PaymentMethod;
  setMethod: (value: PaymentMethod) => void;
  reference: string;
  setReference: (value: string) => void;
  note: string;
  setNote: (value: string) => void;
  amount: number;
  canCreate: boolean;
  selectedPaymentId: number | null;
  setSelectedPaymentId: (value: number | null) => void;
  selectedFile: File | null;
  setSelectedFile: (value: File | null) => void;
  payments: PaymentResponse[];
  pendingOwnerProofPayments: PaymentResponse[];
  latestPendingOwnerProof: PaymentResponse | null;
  status: {
    type: "idle" | "loading" | "ok" | "error";
    message?: string;
  };
  onCreatePayment: () => void;
  onUploadProof: () => void;
  onRefreshAll: () => void;
}

const MONTHLY_PRICE = 50;

export default function OwnerBillingView({
  user,
  loading,
  isOwner,
  active,
  expired,
  title,
  months,
  setMonths,
  method,
  setMethod,
  reference,
  setReference,
  note,
  setNote,
  amount,
  canCreate,
  selectedPaymentId,
  setSelectedPaymentId,
  setSelectedFile,
  payments,
  pendingOwnerProofPayments,
  latestPendingOwnerProof,
  status,
  onCreatePayment,
  onUploadProof,
  onRefreshAll,
}: OwnerBillingViewProps) {
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
                onClick={onRefreshAll}
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
                    Choisissez la durée et la méthode. Le tarif est fixe à 50 DT par mois.
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
                    onChange={(e) => setMonths(Math.max(1, Number(e.target.value) || 1))}
                    className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-slate-300 focus:ring-4 focus:ring-slate-100"
                  />
                </label>

                <label className="block text-sm font-semibold text-slate-700">
                  Montant total (DT)
                  <input
                    type="text"
                    value={`${amount} DT`}
                    readOnly
                    className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none"
                  />
                  <p className="mt-2 text-xs text-slate-500">
                    Tarif fixe : {MONTHLY_PRICE} DT / mois
                  </p>
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
                  onClick={onCreatePayment}
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
                      onClick={onUploadProof}
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