"use client";

import { useMemo, useState } from "react";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { adminSubscriptionService } from "@/lib/services/adminSubscriptionService";
import {
  ReceiptText,
  RefreshCcw,
  AlertTriangle,
  CheckCircle2,
  Mail,
  Search,
  CreditCard,
  FileText,
} from "lucide-react";

function cn(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

function fmtDate(v?: string | null) {
  if (!v) return "—";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? v : d.toLocaleString();
}

function isValidEmail(v: string) {
  const s = v.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
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
      return "En attente justificatif owner";
    case "PENDING_ADMIN_CASH_PROOF":
      return "En attente justificatif admin cash";
    case "PENDING_VERIFICATION":
      return "En attente de vérification";
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

export default function AdminSubscriptionsPage() {
  const [ownerEmail, setOwnerEmail] = useState("");
  const [payments, setPayments] = useState<any[]>([]);
  const [status, setStatus] = useState<{
    type: "idle" | "loading" | "ok" | "error";
    message?: string;
  }>({ type: "idle" });

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
      setPayments(Array.isArray(res.data) ? res.data : []);
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
    <ProtectedRoute requiredRoles={["ROLE_ADMIN"]}>
      <div className="min-h-[calc(100vh-4rem)] bg-slate-50 p-8 space-y-6 text-base leading-relaxed">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Admin — Historique des paiements
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Rechercher et consulter l’historique des paiements d’un owner.
            </p>
          </div>

          <button
            onClick={resetUI}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <RefreshCcw className="h-4 w-4" />
            Reset
          </button>
        </div>

        {/* Status */}
        {status.type !== "idle" && (
          <div
            className={cn(
              "rounded-2xl border p-4 text-[15px]",
              status.type === "loading" &&
                "border-blue-200 bg-blue-50 text-blue-900",
              status.type === "ok" &&
                "border-emerald-200 bg-emerald-50 text-emerald-900",
              status.type === "error" &&
                "border-red-200 bg-red-50 text-red-900"
            )}
          >
            <div className="flex items-start gap-3">
              {status.type === "ok" ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5" />
              ) : status.type === "error" ? (
                <AlertTriangle className="mt-0.5 h-5 w-5" />
              ) : (
                <RefreshCcw className="mt-0.5 h-5 w-5 animate-spin" />
              )}

              <div>
                <div className="font-extrabold">
                  {status.type === "loading"
                    ? "Chargement..."
                    : status.type === "ok"
                    ? "Succès"
                    : "Erreur"}
                </div>
                {status.message && <div className="mt-0.5">{status.message}</div>}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Recherche */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg lg:col-span-1">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-slate-900 p-2 text-white">
                <Search className="h-5 w-5" />
              </div>
              <div>
                <div className="text-lg font-extrabold text-slate-900">
                  Recherche
                </div>
                <div className="text-sm text-slate-500">
                  Saisir l’email d’un owner
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <label className="block text-sm font-semibold text-slate-700">
                Owner Email <span className="text-red-600">*</span>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 outline-none focus:ring-2 focus:ring-slate-300"
                    value={ownerEmail}
                    onChange={(e) => setOwnerEmail(e.target.value)}
                    placeholder="ex: owner@email.com"
                    inputMode="email"
                    autoComplete="email"
                  />
                </div>

                <div className="mt-1 text-xs text-slate-500">
                  Utilise l’email du owner pour afficher son historique de
                  paiement.
                </div>

                {ownerEmail.trim() && !isValidEmail(cleanEmail) && (
                  <div className="mt-1 text-xs font-semibold text-red-600">
                    Email invalide.
                  </div>
                )}
              </label>

              <button
                onClick={loadPayments}
                disabled={!canSearch || status.type === "loading"}
                className={cn(
                  "w-full rounded-xl px-4 py-3 text-sm font-extrabold text-white transition-all",
                  canSearch
                    ? "bg-slate-900 hover:bg-slate-800"
                    : "cursor-not-allowed bg-slate-400"
                )}
              >
                Voir historique paiements
              </button>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                <div className="font-extrabold">Résumé</div>
                <div className="mt-1">
                  Owner Email : <b>{canSearch ? cleanEmail : "—"}</b>
                </div>
                <div>
                  Nombre de paiements chargés : <b>{payments.length}</b>
                </div>
              </div>
            </div>
          </div>

          {/* Historique */}
          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-slate-900 p-2 text-white">
                    <ReceiptText className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-lg font-extrabold text-slate-900">
                      Historique des paiements
                    </div>
                    <div className="text-sm text-slate-500">
                      Traçabilité complète des paiements owner
                    </div>
                  </div>
                </div>

                <button
                  onClick={loadPayments}
                  disabled={!canSearch || status.type === "loading"}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50",
                    (!canSearch || status.type === "loading") &&
                      "cursor-not-allowed opacity-50"
                  )}
                >
                  <RefreshCcw
                    className={cn(
                      "h-4 w-4",
                      status.type === "loading" && "animate-spin"
                    )}
                  />
                  Refresh
                </button>
              </div>

              <div className="mt-5">
                {payments.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-slate-600">
                    Aucun paiement trouvé.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {payments.map((p) => (
                      <div
                        key={p.id}
                        className="rounded-2xl border border-slate-200 bg-white p-5"
                      >
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="font-extrabold text-slate-900">
                                #{p.id} — {methodLabel(p.method)} — {p.amount} DT
                              </div>
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
                                <span className="font-bold">Durée :</span>{" "}
                                {p.months ?? "—"} mois
                              </div>
                              <div>
                                <span className="font-bold">Date :</span>{" "}
                                {fmtDate(p.paidAt)}
                              </div>
                              <div>
                                <span className="font-bold">Référence :</span>{" "}
                                {p.reference || "—"}
                              </div>
                              <div>
                                <span className="font-bold">Validation :</span>{" "}
                                {fmtDate(p.validatedAt)}
                              </div>
                            </div>
                          </div>
                        </div>

                        {(p.note || p.adminComment) && (
                          <div className="mt-4 grid gap-3">
                            {p.note && (
                              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                                <span className="font-bold">Note owner :</span>{" "}
                                {p.note}
                              </div>
                            )}

                            {p.adminComment && (
                              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                                <span className="font-bold">
                                  Commentaire admin :
                                </span>{" "}
                                {p.adminComment}
                              </div>
                            )}
                          </div>
                        )}

                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <div className="mb-2 flex items-center gap-2 text-sm font-extrabold text-slate-900">
                              <FileText className="h-4 w-4" />
                              Justificatif owner
                            </div>
                            {p.proofFileUrl ? (
                              <a
                                href={p.proofFileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center rounded-lg bg-slate-900 px-3 py-2 text-xs font-extrabold text-white hover:bg-slate-800"
                              >
                                Ouvrir {p.proofFileName ? `(${p.proofFileName})` : ""}
                              </a>
                            ) : (
                              <div className="text-sm text-slate-500">
                                Aucun justificatif owner.
                              </div>
                            )}
                          </div>

                          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <div className="mb-2 flex items-center gap-2 text-sm font-extrabold text-slate-900">
                              <CreditCard className="h-4 w-4" />
                              Justificatif admin
                            </div>
                            {p.adminProofFileUrl ? (
                              <a
                                href={p.adminProofFileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center rounded-lg bg-emerald-600 px-3 py-2 text-xs font-extrabold text-white hover:bg-emerald-700"
                              >
                                Ouvrir{" "}
                                {p.adminProofFileName
                                  ? `(${p.adminProofFileName})`
                                  : ""}
                              </a>
                            ) : (
                              <div className="text-sm text-slate-500">
                                Aucun justificatif admin.
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}