"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useAuth } from "@/contexts/authContext";
import { SubscriptionBanner } from "@/components/subscription/SubscriptionBanner";
import {
  Copy,
  Mail,
  Phone,
  RefreshCcw,
  ShieldCheck,
  CheckCircle2,
  BadgeCheck,
  Receipt,
} from "lucide-react";

function cn(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export default function OwnerBillingPage() {
  const { user, loading, refreshMe } = useAuth();

  const UNIT_PRICE = 50; // ✅ 50 DT / mois

const plans = [
  {
    id: "m1",
    title: "Mensuel",
    months: 1,
    badge: "Standard",
    highlight: false,
    perks: ["Idéal pour commencer", "Renouvellement flexible", "Activation rapide offline"],
  },
  {
    id: "m3",
    title: "Trimestriel",
    months: 3,
    badge: "Recommandé",
    highlight: true,
    perks: ["Moins de frictions", "Meilleure continuité", "Priorité à l’activation (conseillé)"],
  },
  {
    id: "m12",
    title: "Annuel",
    months: 12,
    badge: "Pro",
    highlight: false,
    perks: ["Zéro interruption", "Gestion simplifiée", "Meilleur pour les flottes actives"],
  },
] as const;

const selectPlan = (m: number) => {
  setMonths(m);
  setAmount(m * UNIT_PRICE);
};
  // ✅ champs pour composer le message
  const [method, setMethod] = useState<"CASH" | "BANK_TRANSFER" | "CHEQUE">("CASH");
  const [months, setMonths] = useState<number>(1);
  const [amount, setAmount] = useState<number>(50);
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [copied, setCopied] = useState(false);

  const isOwner = user?.role === "ROLE_OWNER";

  const adminEmail = "admin@yourcompany.com"; // ✅ mets ton email admin ici
  const adminPhone = "+216 XX XXX XXX";        // ✅ optionnel (WhatsApp/téléphone)

  const message = useMemo(() => {
    if (!user) return "";
    return `Bonjour,
Je souhaite activer/renouveler mon abonnement Fleet Management.

📧 Email: ${user.email}
👤 Nom: ${user.firstName} ${user.lastName}

💳 Méthode: ${method}
💰 Montant: ${amount}
🗓️ Durée: ${months} mois
🧾 Référence/Preuve: ${reference || "-"}
📝 Note: ${note || "-"}

Merci de confirmer l’activation dès réception.`;
  }, [user, method, amount, months, reference, note]);

  const copyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // si clipboard bloque, l’utilisateur peut copier manuellement
      setCopied(false);
    }
  };

  if (loading) return <div className="p-6">Chargement...</div>;
  if (!user) return <div className="p-6">Non connecté.</div>;
  if (!isOwner) return <div className="p-6">Page réservée au compte OWNER.</div>;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Paiement & Abonnement</h1>
            <p className="text-sm text-slate-600 mt-1">
              Paiement <b>offline</b> (cash / virement / chèque) — activation manuelle par l’admin.
            </p>
          </div>

          <button
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            onClick={refreshMe}
          >
            <RefreshCcw className="h-4 w-4" />
            Rafraîchir statut
          </button>
        </div>

        {/* Banner */}
        <SubscriptionBanner info={user} />

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Steps + Message */}
          <div className="lg:col-span-2 space-y-6">
            {/* Why pay card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-slate-700" />
                <div className="font-bold text-slate-900">Pourquoi activer maintenant ?</div>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-700">
                <div className="flex gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <div>
                    <b>Accès complet</b> : création / modification / suppression réactivées.
                  </div>
                </div>
                <div className="flex gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <div>
                    <b>Continuité</b> : évitez une interruption après la période d’essai.
                  </div>
                </div>
                <div className="flex gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <div>
                    <b>Traçabilité</b> : validation manuelle + historique des paiements.
                  </div>
                </div>
                <div className="flex gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <div>
                    <b>Activation rapide</b> si vous envoyez une preuve (photo/capture).
                  </div>
                </div>
              </div>
            </div>

            {/* 3 steps */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="font-bold text-slate-900">Comment payer (offline) — 3 étapes</div>

              <ol className="mt-4 space-y-3 text-sm text-slate-700">
                <li><b>1)</b> Choisissez la méthode et effectuez le paiement.</li>
                <li><b>2)</b> Envoyez les infos + preuve/référence à l’admin.</li>
                <li><b>3)</b> Cliquez sur <b>Rafraîchir statut</b> (ou reconnectez-vous) pour réactiver l’accès.</li>
              </ol>

              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                💡 <b>Astuce :</b> photo du reçu / capture virement / numéro chèque = activation plus rapide.
              </div>
            </div>

{/* ✅ Plans */}
<div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
  <div className="flex items-start justify-between gap-3">
    <div>
      <div className="text-lg font-extrabold text-slate-900">Choisissez votre plan</div>
      <div className="mt-1 text-sm text-slate-600">
        Prix : <b>{UNIT_PRICE} DT / mois</b>. Paiement <b>offline</b>, activation par l’admin.
      </div>
    </div>

    <div className="text-right">
      <div className="text-xs text-slate-500">Plan sélectionné</div>
      <div className="text-sm font-semibold text-slate-900">
        {months} mois — {amount} DT
      </div>
    </div>
  </div>

  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
    {plans.map((p) => {
      const total = p.months * UNIT_PRICE;

      return (
        <button
          key={p.id}
          type="button"
          onClick={() => selectPlan(p.months)}
          className={cn(
            "text-left rounded-2xl border p-4 transition-all hover:shadow-md",
            p.highlight
              ? "border-slate-900 bg-slate-900 text-white"
              : "border-slate-200 bg-white text-slate-900",
            months === p.months && !p.highlight && "ring-2 ring-slate-900"
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <div className={cn("font-bold", p.highlight ? "text-white" : "text-slate-900")}>
              {p.title}
            </div>
            <span
              className={cn(
                "text-xs font-semibold px-2 py-1 rounded-full",
                p.highlight
                  ? "bg-white/15 text-white"
                  : "bg-slate-100 text-slate-700"
              )}
            >
              {p.badge}
            </span>
          </div>

          <div className={cn("mt-2 text-2xl font-extrabold", p.highlight ? "text-white" : "text-slate-900")}>
            {total} DT
          </div>

          <div className={cn("mt-1 text-xs", p.highlight ? "text-white/80" : "text-slate-600")}>
            {UNIT_PRICE} DT × {p.months} mois
          </div>

          <ul className={cn("mt-3 space-y-1 text-sm", p.highlight ? "text-white/90" : "text-slate-700")}>
            {p.perks.map((k) => (
              <li key={k} className="flex gap-2">
                <span className={cn("mt-0.5", p.highlight ? "text-emerald-300" : "text-emerald-600")}>✓</span>
                <span>{k}</span>
              </li>
            ))}
          </ul>

          <div className={cn("mt-4 inline-flex items-center gap-2 text-sm font-semibold",
            p.highlight ? "text-white" : "text-slate-900"
          )}>
            Choisir ce plan →
          </div>
        </button>
      );
    })}
  </div>

  <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
    💡 <b>Conseil :</b> le plan <b>3 mois</b> réduit les renouvellements et évite les coupures après l’essai.
  </div>
</div>
            {/* Message section - improved */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="font-bold text-slate-900 flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-slate-700" />
                  Message à envoyer à l’admin
                </div>
                {copied && (
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1">
                    Copié ✅
                  </span>
                )}
              </div>

              <p className="mt-2 text-sm text-slate-600">
                Remplissez ces informations pour générer un message complet. Ensuite, copiez/collez et envoyez-le à l’admin.
              </p>

              {/* Form */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="text-sm">
                  Méthode
                  <select
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2"
                    value={method}
                    onChange={(e) => setMethod(e.target.value as any)}
                  >
                    <option value="CASH">Cash</option>
                    <option value="BANK_TRANSFER">Virement bancaire</option>
                    <option value="CHEQUE">Chèque</option>
                  </select>
                </label>

                <label className="text-sm">
                  Montant
                  <input
                    type="number"
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    min={0}
                  />
                </label>

                <label className="text-sm">
                  Durée (mois)
                  <input
                    type="number"
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2"
                    value={months}
                    onChange={(e) => setMonths(Number(e.target.value))}
                    min={1}
                  />
                </label>

                <label className="text-sm">
                  Référence / preuve (optionnel)
                  <input
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="Ex: REC-2026-001 / ref virement / n° chèque"
                  />
                </label>

                <label className="text-sm sm:col-span-2">
                  Note (optionnel)
                  <input
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Ex: payé le 02/03, merci d'activer le compte"
                  />
                </label>
              </div>

              {/* Generated message */}
              <div className="mt-4">
                <div className="text-xs font-semibold text-slate-600">Message généré :</div>
                <textarea
                  className="mt-2 w-full min-h-[180px] rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800"
                  value={message}
                  readOnly
                />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                  onClick={copyMessage}
                >
                  <Copy className="h-4 w-4" />
                  Copier le message
                </button>

                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  onClick={refreshMe}
                >
                  <RefreshCcw className="h-4 w-4" />
                  J’ai payé → Rafraîchir
                </button>

                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <BadgeCheck className="h-4 w-4" />
                  Retour au dashboard
                </Link>
              </div>
            </div>
          </div>

          {/* Right: Contact + FAQ */}
          <div className="space-y-6">
            {/* Contact card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="font-bold text-slate-900">Contact admin</div>
              <p className="mt-2 text-sm text-slate-600">
                Envoyez le message ci-dessus avec votre preuve de paiement.
              </p>

              <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center gap-2 text-slate-700">
                  <Mail className="h-4 w-4" />
                  <span className="font-semibold">Email :</span>
                  <span className="ml-1">{adminEmail}</span>
                </div>

                <div className="flex items-center gap-2 text-slate-700">
                  <Phone className="h-4 w-4" />
                  <span className="font-semibold">Téléphone :</span>
                  <span className="ml-1">{adminPhone}</span>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                ✅ Plus vous envoyez des infos complètes (montant + référence + preuve),
                plus la confirmation est rapide.
              </div>
            </div>

            {/* FAQ */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="font-bold text-slate-900">FAQ rapide</div>

              <div className="mt-3 space-y-3 text-sm text-slate-700">
                <div>
                  <div className="font-semibold">Combien de temps pour l’activation ?</div>
                  <div className="text-slate-600">
                    Dès que l’admin confirme le paiement. Ensuite cliquez sur <b>Rafraîchir</b>.
                  </div>
                </div>

                <div>
                  <div className="font-semibold">Pourquoi “Expiré” ?</div>
                  <div className="text-slate-600">
                    Essai terminé ou date paidUntil dépassée. Paiement requis pour réactiver.
                  </div>
                </div>

                <div>
                  <div className="font-semibold">Paiement en ligne possible ?</div>
                  <div className="text-slate-600">
                    Non. Paiement uniquement offline (cash/virement/chèque).
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* footer note */}
        <div className="text-xs text-slate-500">
          Conseil : gardez une preuve de paiement (photo reçu / capture virement / numéro chèque).
        </div>
      </div>
    </div>
  );
}