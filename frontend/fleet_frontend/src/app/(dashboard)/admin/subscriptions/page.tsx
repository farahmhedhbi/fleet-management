"use client";

import { useMemo, useState } from "react";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { adminSubscriptionService } from "@/lib/services/adminSubscriptionService";
import {
  CreditCard,
  ReceiptText,
  RefreshCcw,
  CheckCircle2,
  AlertTriangle,
  Mail,
} from "lucide-react";

type Method = "CASH" | "BANK_TRANSFER" | "CHEQUE";

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

export default function AdminSubscriptionsPage() {
  const [ownerEmail, setOwnerEmail] = useState<string>("");

  const [months, setMonths] = useState<number>(1);
  const [amount, setAmount] = useState<number>(50);
  const [method, setMethod] = useState<Method>("CASH");
  const [reference, setReference] = useState<string>("");
  const [note, setNote] = useState<string>("");

  const [result, setResult] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [status, setStatus] = useState<{
    type: "idle" | "loading" | "ok" | "error";
    message?: string;
  }>({ type: "idle" });

  const cleanEmail = useMemo(
    () => ownerEmail.trim().toLowerCase(),
    [ownerEmail]
  );

  const canSubmit = useMemo(() => {
    if (!isValidEmail(cleanEmail)) return false;
    if (!months || months <= 0) return false;
    if (!amount || amount <= 0) return false;
    if (!method) return false;
    return true;
  }, [cleanEmail, months, amount, method]);

  const resetUI = () => {
    setResult(null);
    setPayments([]);
    setStatus({ type: "idle" });
  };

  const loadPayments = async () => {
    if (!isValidEmail(cleanEmail)) {
      setStatus({ type: "error", message: "Veuillez saisir un email OWNER valide." });
      return;
    }

    setStatus({ type: "loading", message: "Chargement de l’historique des paiements..." });

    try {
      const res = await adminSubscriptionService.paymentsByEmail(cleanEmail);
      setPayments(res.data || []);
      setStatus({ type: "ok", message: "Historique chargé." });
    } catch (e: any) {
      setStatus({
        type: "error",
        message: e?.response?.data?.message || "Erreur lors du chargement des paiements.",
      });
    }
  };

  const doActivate = async () => {
    if (!canSubmit) {
      setStatus({
        type: "error",
        message: "Vérifie les champs (Email, Mois, Montant, Méthode).",
      });
      return;
    }

    setStatus({ type: "loading", message: "Activation en cours..." });
    setResult(null);

    try {
      const res = await adminSubscriptionService.activateByEmail(cleanEmail, {
        months,
        amount,
        method,
        reference: reference.trim() ? reference.trim() : undefined,
        note: note.trim() ? note.trim() : undefined,
      });

      setResult(res.data);
      setStatus({ type: "ok", message: "✅ Abonnement activé avec succès." });

      await loadPayments();
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        "Erreur lors de l’activation (vérifier backend / droits / données).";
      setStatus({ type: "error", message: msg });
    }
  };

  return (
    <ProtectedRoute requiredRoles={["ROLE_ADMIN"]}>
      {/* ✅ Fond clair + police lisible */}
      <div className="min-h-[calc(100vh-4rem)] bg-slate-50 p-8 space-y-6 text-base leading-relaxed">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Admin — Abonnements
            </h1>
            
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
              status.type === "loading" && "border-blue-200 bg-blue-50 text-blue-900",
              status.type === "ok" && "border-emerald-200 bg-emerald-50 text-emerald-900",
              status.type === "error" && "border-red-200 bg-red-50 text-red-900"
            )}
          >
            <div className="flex items-start gap-3">
              {status.type === "ok" ? (
                <CheckCircle2 className="h-5 w-5 mt-0.5" />
              ) : status.type === "error" ? (
                <AlertTriangle className="h-5 w-5 mt-0.5" />
              ) : (
                <RefreshCcw className="h-5 w-5 mt-0.5 animate-spin" />
              )}

              <div>
                <div className="font-extrabold">
                  {status.type === "loading"
                    ? "Traitement..."
                    : status.type === "ok"
                      ? "Succès"
                      : "Erreur"}
                </div>
                {status.message && <div className="mt-0.5">{status.message}</div>}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="lg:col-span-1 rounded-2xl border border-slate-200 bg-white shadow-lg p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-slate-900 text-white p-2">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <div className="text-lg font-extrabold text-slate-900">Activation</div>
                <div className="text-sm text-slate-500">Étape 1 → saisir infos paiement</div>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {/* ✅ OWNER EMAIL */}
              <label className="block text-sm font-semibold text-slate-700">
                Owner Email <span className="text-red-600">*</span>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 outline-none focus:ring-2 focus:ring-slate-300"
                    value={ownerEmail}
                    onChange={(e) => setOwnerEmail(e.target.value)}
                    placeholder="ex: owner@email.com"
                    inputMode="email"
                    autoComplete="email"
                  />
                </div>

                <div className="mt-1 text-xs text-slate-500">
                  Utilise l’email de l’OWNER (depuis <b>Owners</b> ou <b>Users Admin</b>).
                </div>

                {ownerEmail.trim() && !isValidEmail(cleanEmail) && (
                  <div className="mt-1 text-xs font-semibold text-red-600">
                    Email invalide.
                  </div>
                )}
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm font-semibold text-slate-700">
                  Mois <span className="text-red-600">*</span>
                  <input
                    type="number"
                    min={1}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-slate-300"
                    value={months}
                    onChange={(e) => setMonths(Number(e.target.value))}
                  />
                </label>

                <label className="block text-sm font-semibold text-slate-700">
                  Montant (DT) <span className="text-red-600">*</span>
                  <input
                    type="number"
                    min={1}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-slate-300"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                  />
                </label>
              </div>

              <label className="block text-sm font-semibold text-slate-700">
                Méthode <span className="text-red-600">*</span>
                <select
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-slate-300"
                  value={method}
                  onChange={(e) => setMethod(e.target.value as Method)}
                >
                  <option value="CASH">Cash</option>
                  <option value="BANK_TRANSFER">Bank transfer</option>
                  <option value="CHEQUE">Cheque</option>
                </select>
              </label>

              <label className="block text-sm font-semibold text-slate-700">
                Référence (optionnel)
                <input
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-slate-300"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="ex: REC-2026-001 / ref virement"
                />
              </label>

              <label className="block text-sm font-semibold text-slate-700">
                Note (optionnel)
                <input
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-slate-300"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="ex: payé à l’accueil, confirmé par ..."
                />
              </label>

              <button
                onClick={doActivate}
                disabled={!canSubmit || status.type === "loading"}
                className={cn(
                  "w-full rounded-xl px-4 py-3 text-sm font-extrabold text-white transition-all",
                  canSubmit ? "bg-slate-900 hover:bg-slate-800" : "bg-slate-400 cursor-not-allowed"
                )}
              >
                Activer abonnement
              </button>

              <button
                onClick={loadPayments}
                disabled={!isValidEmail(cleanEmail) || status.type === "loading"}
                className={cn(
                  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 hover:bg-slate-50 transition-all",
                  (!isValidEmail(cleanEmail) || status.type === "loading") && "opacity-50 cursor-not-allowed"
                )}
              >
                Voir historique paiements
              </button>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                <div className="font-extrabold">Résumé</div>
                <div className="mt-1">
                  Owner Email: <b>{isValidEmail(cleanEmail) ? cleanEmail : "—"}</b>
                </div>
                <div>
                  Durée: <b>{months}</b> mois
                </div>
                <div>
                  Montant: <b>{amount}</b> DT
                </div>
                <div>
                  Méthode: <b>{method}</b>
                </div>
              </div>
            </div>
          </div>

          {/* Result + Payments */}
          <div className="lg:col-span-2 space-y-6">
            {/* Result */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-lg p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-slate-900 text-white p-2">
                  <ReceiptText className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-lg font-extrabold text-slate-900">Résultat</div>
                  <div className="text-sm text-slate-500">Étape 2 → vérifier status + dates</div>
                </div>
              </div>

              {!result ? (
                <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-slate-600">
                  <div className="font-extrabold">Aucun résultat pour le moment</div>
                  <div className="mt-1 text-sm">
                    Remplis le formulaire puis clique <b>Activer abonnement</b>.
                  </div>
                </div>
              ) : (
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoCard label="Owner" value={`${result.firstName ?? ""} ${result.lastName ?? ""}`} />
                  <InfoCard label="Email" value={result.email} />
                  <InfoCard label="Status" value={String(result.subscriptionStatus ?? "—")} />
                  <InfoCard label="Paid until" value={fmtDate(result.paidUntil)} />
                  <InfoCard label="Trial end" value={fmtDate(result.trialEndAt)} />
                  <InfoCard label="Role" value={result.role} />
                </div>
              )}
            </div>

            {/* Payments */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-lg p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-lg font-extrabold text-slate-900">Historique des paiements</div>
                  <div className="text-sm text-slate-500">Traçabilité (offline)</div>
                </div>

                <button
                  onClick={loadPayments}
                  disabled={!isValidEmail(cleanEmail) || status.type === "loading"}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50",
                    (!isValidEmail(cleanEmail) || status.type === "loading") && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <RefreshCcw className={cn("h-4 w-4", status.type === "loading" && "animate-spin")} />
                  Refresh
                </button>
              </div>

              <div className="mt-5">
                {payments.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-slate-600">
                    Aucun paiement trouvé.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {payments.map((p) => (
                      <div key={p.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-extrabold text-slate-900">
                            {p.method} — {p.amount} DT — {p.months} mois
                          </div>
                          <div className="text-xs text-slate-500">{fmtDate(p.paidAt)}</div>
                        </div>

                        {(p.reference || p.note) && (
                          <div className="mt-2 text-sm text-slate-700">
                            {p.reference && (
                              <div>
                                <span className="font-bold">Ref:</span> {p.reference}
                              </div>
                            )}
                            {p.note && (
                              <div>
                                <span className="font-bold">Note:</span> {p.note}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Help */}
            
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

function InfoCard({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="text-xs font-extrabold text-slate-600">{label.toUpperCase()}</div>
      <div className="mt-1 text-sm font-extrabold text-slate-900 break-all">
        {value ?? "—"}
      </div>
    </div>
  );
}