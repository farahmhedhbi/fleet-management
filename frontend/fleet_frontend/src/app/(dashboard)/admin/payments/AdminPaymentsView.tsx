"use client";

import {
  RefreshCcw,
  FileCheck2,
  FileX2,
  ShieldCheck,
  Receipt,
  Upload,
  FileText,
} from "lucide-react";
import type { PaymentResponse } from "@/types/payment";
import type { FeedbackState } from "./page";

function cn(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function buildFileUrl(path?: string | null) {
  if (!path) return "#";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `http://localhost:8080${path}`;
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

function statusLabel(status?: string | null) {
  switch (status) {
    case "PENDING_OWNER_PROOF":
      return "Attente justificatif owner";
    case "PENDING_ADMIN_CASH_PROOF":
      return "Attente validation admin";
    case "PENDING_VERIFICATION":
      return "Attente vérification";
    case "APPROVED":
      return "Approuvé";
    case "REJECTED":
      return "Refusé";
    default:
      return status || "—";
  }
}

function statusClass(status?: string | null) {
  switch (status) {
    case "PENDING_OWNER_PROOF":
      return "border-amber-200 bg-amber-50 text-amber-800";
    case "PENDING_ADMIN_CASH_PROOF":
      return "border-blue-200 bg-blue-50 text-blue-800";
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

function fmtDate(date?: string | null) {
  if (!date) return "—";
  const d = new Date(date);
  return Number.isNaN(d.getTime()) ? String(date) : d.toLocaleString();
}

interface AdminPaymentsViewProps {
  payments: PaymentResponse[];
  loading: boolean;
  busyId: number | null;
  pendingCount: number;
  feedback: FeedbackState;
  approveComment: Record<number, string>;
  rejectComment: Record<number, string>;
  onRefresh: () => void;
  onApprove: (paymentId: number) => void;
  onReject: (paymentId: number) => void;
  setApproveComment: React.Dispatch<
    React.SetStateAction<Record<number, string>>
  >;
  setRejectComment: React.Dispatch<
    React.SetStateAction<Record<number, string>>
  >;
}

export default function AdminPaymentsView({
  payments,
  loading,
  busyId,
  pendingCount,
  feedback,
  approveComment,
  rejectComment,
  onRefresh,
  onApprove,
  onReject,
  setApproveComment,
  setRejectComment,
}: AdminPaymentsViewProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl p-4 md:p-6">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
              Validation des paiements
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              L’admin vérifie les preuves owner puis approuve. Le système génère
              automatiquement le justificatif PDF.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-extrabold text-slate-700">
              {pendingCount} en attente
            </span>

            <button
              onClick={onRefresh}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-800 shadow-sm hover:bg-slate-50"
            >
              <RefreshCcw className="h-4 w-4" />
              Actualiser
            </button>
          </div>
        </div>

        {feedback.message && (
          <div
            className={cn(
              "mb-6 rounded-2xl border p-4 text-sm font-semibold",
              feedback.type === "ok" &&
                "border-emerald-200 bg-emerald-50 text-emerald-800",
              feedback.type === "error" &&
                "border-red-200 bg-red-50 text-red-800"
            )}
          >
            {feedback.message}
          </div>
        )}

        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 text-slate-700 shadow-sm">
            Chargement...
          </div>
        ) : payments.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 text-slate-700 shadow-sm">
            Aucun paiement en attente.
          </div>
        ) : (
          <div className="space-y-5">
            {payments.map((p) => {
              const isCash = p.method === "CASH";
              const isWaitingOwnerProof = p.status === "PENDING_OWNER_PROOF";
              const canApprove =
                p.status === "PENDING_VERIFICATION" ||
                p.status === "PENDING_ADMIN_CASH_PROOF";

              return (
                <div
                  key={p.id}
                  className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-lg font-extrabold text-slate-900">
                          Paiement #{p.id}
                        </h2>
                        <span
                          className={cn(
                            "inline-flex rounded-full border px-3 py-1 text-xs font-extrabold",
                            statusClass(p.status)
                          )}
                        >
                          {statusLabel(p.status)}
                        </span>
                      </div>

                      <div className="mt-2 grid gap-2 text-sm text-slate-700 md:grid-cols-2">
                        <div>
                          <span className="font-bold">Owner :</span>{" "}
                          {p.userName || "—"} ({p.userEmail || "—"})
                        </div>
                        <div>
                          <span className="font-bold">Méthode :</span>{" "}
                          {methodLabel(p.method)}
                        </div>
                        <div>
                          <span className="font-bold">Montant :</span>{" "}
                          {p.amount ?? "—"} DT
                        </div>
                        <div>
                          <span className="font-bold">Durée :</span>{" "}
                          {p.months ?? "—"} mois
                        </div>
                        <div>
                          <span className="font-bold">Référence :</span>{" "}
                          {p.reference || "—"}
                        </div>
                        <div>
                          <span className="font-bold">Créé le :</span>{" "}
                          {fmtDate(p.paidAt)}
                        </div>
                      </div>

                      {p.note && (
                        <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                          <span className="font-bold">Note :</span> {p.note}
                        </div>
                      )}
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                      {isCash ? (
                        <div className="flex items-start gap-2">
                          <ShieldCheck className="mt-0.5 h-4 w-4 text-blue-700" />
                          Paiement cash : après validation, le système générera
                          automatiquement un PDF.
                        </div>
                      ) : isWaitingOwnerProof ? (
                        <div className="flex items-start gap-2">
                          <Receipt className="mt-0.5 h-4 w-4 text-amber-700" />
                          En attente du fichier owner.
                        </div>
                      ) : (
                        <div className="flex items-start gap-2">
                          <Upload className="mt-0.5 h-4 w-4 text-violet-700" />
                          Le justificatif owner a été envoyé. Après validation,
                          le système générera automatiquement un PDF.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 grid gap-5 lg:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 p-4">
                      <div className="text-sm font-extrabold text-slate-900">
                        Justificatif owner
                      </div>

                      {p.proofFileUrl ? (
                        <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3">
                          <div className="truncate text-sm font-semibold text-slate-800">
                            {p.proofFileName || "Fichier owner"}
                          </div>
                          <a
                            href={buildFileUrl(p.proofFileUrl)}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-extrabold text-white"
                          >
                            Ouvrir
                          </a>
                        </div>
                      ) : (
                        <div className="mt-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                          Aucun justificatif owner.
                        </div>
                      )}
                    </div>

                    <div className="rounded-2xl border border-slate-200 p-4">
                      <div className="text-sm font-extrabold text-slate-900">
                        Justificatif admin
                      </div>

                      {p.adminProofFileUrl ? (
                        <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3">
                          <div className="truncate text-sm font-semibold text-slate-800">
                            {p.adminProofFileName || "Fichier admin"}
                          </div>
                          <a
                            href={buildFileUrl(p.adminProofFileUrl)}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-extrabold text-white"
                          >
                            Ouvrir
                          </a>
                        </div>
                      ) : (
                        <div className="mt-3 flex items-start gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                          <FileText className="mt-0.5 h-4 w-4" />
                          Aucun justificatif admin encore généré.
                        </div>
                      )}
                    </div>

                    <div className="rounded-2xl border border-slate-200 p-4">
                      <div className="text-sm font-extrabold text-slate-900">
                        Action admin
                      </div>

                      <div className="mt-3 space-y-3">
                        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                          Le justificatif PDF sera généré automatiquement après
                          approbation.
                        </div>

                        <label className="block text-sm font-semibold text-slate-700">
                          Commentaire approbation
                          <textarea
                            rows={3}
                            value={approveComment[p.id] ?? ""}
                            onChange={(e) =>
                              setApproveComment((prev) => ({
                                ...prev,
                                [p.id]: e.target.value,
                              }))
                            }
                            placeholder="Paiement reçu et compte activé..."
                            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-slate-300"
                          />
                        </label>

                        <label className="block text-sm font-semibold text-slate-700">
                          Commentaire refus
                          <textarea
                            rows={3}
                            value={rejectComment[p.id] ?? ""}
                            onChange={(e) =>
                              setRejectComment((prev) => ({
                                ...prev,
                                [p.id]: e.target.value,
                              }))
                            }
                            placeholder="Motif du refus..."
                            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-slate-300"
                          />
                        </label>

                        <div className="flex flex-col gap-3 sm:flex-row">
                          <button
                            onClick={() => onApprove(p.id)}
                            disabled={busyId === p.id || !canApprove}
                            className={cn(
                              "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-extrabold text-white",
                              canApprove
                                ? "bg-emerald-600 hover:bg-emerald-700"
                                : "cursor-not-allowed bg-slate-400"
                            )}
                          >
                            <FileCheck2 className="h-4 w-4" />
                            Approuver
                          </button>

                          <button
                            onClick={() => onReject(p.id)}
                            disabled={busyId === p.id}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-extrabold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                          >
                            <FileX2 className="h-4 w-4" />
                            Refuser
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {p.adminComment && (
                    <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                      <span className="font-bold">Commentaire admin :</span>{" "}
                      {p.adminComment}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}