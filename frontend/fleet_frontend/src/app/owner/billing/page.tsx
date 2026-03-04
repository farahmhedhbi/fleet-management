"use client";

import { useMemo } from "react";
import { useAuth } from "@/contexts/authContext";
import { SubscriptionBanner } from "@/components/subscription/SubscriptionBanner";
import { isSubscriptionActive, isSubscriptionExpired, fmtDateTime } from "@/lib/subscription";
import { CreditCard, BadgeCheck, Banknote, Landmark, Receipt, Clock } from "lucide-react";

function cn(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export default function OwnerBillingPage() {
  const { user, loading, refreshMe } = useAuth();

  const isOwner = user?.role === "ROLE_OWNER";
  const active = isSubscriptionActive(user ?? undefined);
  const expired = isSubscriptionExpired(user ?? undefined);

  const price = 50;

  const title = useMemo(() => {
    if (!isOwner) return "Billing";
    if (active) return "Subscription Active";
    if (expired) return "Subscription Expired";
    return "Free Trial";
  }, [isOwner, active, expired]);

  if (loading) return <div className="p-6">Chargement...</div>;
  if (!user) return <div className="p-6">Non connecté.</div>;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">{title}</h1>
          <p className="mt-1 text-slate-600">
            Paiement <b>hors ligne</b> + activation manuelle par l’admin.
          </p>
        </div>

        <button
          onClick={() => refreshMe()}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <Clock className="h-4 w-4" />
          Refresh status
        </button>
      </div>

      {/* Banner sur page billing */}
      {isOwner && <SubscriptionBanner info={user} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Plan */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-lg p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-slate-900 text-white p-2">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <div className="text-lg font-extrabold text-slate-900">Standard Plan</div>
              <div className="text-sm text-slate-600">Gestion complète de flotte</div>
            </div>
          </div>

          <div className="mt-5">
            <div className="text-4xl font-extrabold text-slate-900">
              {price} <span className="text-lg font-bold text-slate-600">DT</span>
            </div>
            <div className="text-sm text-slate-600">par mois</div>
          </div>

          <ul className="mt-5 space-y-2 text-sm text-slate-700">
            <li className="flex items-center gap-2">
              <BadgeCheck className="h-4 w-4" /> Véhicules & Conducteurs
            </li>
            <li className="flex items-center gap-2">
              <BadgeCheck className="h-4 w-4" /> Missions & dispatch
            </li>
            <li className="flex items-center gap-2">
              <BadgeCheck className="h-4 w-4" /> Rapports & analytics
            </li>
            <li className="flex items-center gap-2">
              <BadgeCheck className="h-4 w-4" /> Maintenance & suivi
            </li>
          </ul>

          <div
            className={cn(
              "mt-6 rounded-xl p-4 text-sm",
              expired ? "bg-red-50 border border-red-200" : "bg-slate-50 border border-slate-200"
            )}
          >
            {active ? (
              <div>
                <div className="font-extrabold text-emerald-700">✅ Actif</div>
                <div className="mt-1 text-slate-700">
                  Valable jusqu’au: <b>{fmtDateTime(user.paidUntil ?? null)}</b>
                </div>
              </div>
            ) : expired ? (
              <div>
                <div className="font-extrabold text-red-700">⛔ Expiré</div>
                <div className="mt-1 text-slate-700">
                  Les fonctionnalités premium sont bloquées. Faites le paiement pour réactiver.
                </div>
              </div>
            ) : (
              <div>
                <div className="font-extrabold text-amber-700">🎁 Essai gratuit</div>
                <div className="mt-1 text-slate-700">
                  Fin d’essai: <b>{fmtDateTime(user.trialEndAt ?? null)}</b>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white shadow-lg p-6">
          <div className="text-xl font-extrabold text-slate-900">Paiement hors ligne</div>
          <p className="mt-1 text-slate-600 text-sm">
            Après paiement, l’admin vérifie puis active votre abonnement.
          </p>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <MethodCard
              icon={<Banknote className="h-5 w-5" />}
              title="Cash"
              lines={["Payez en espèces.", "Gardez le reçu.", "Donnez la référence à l’admin."]}
            />
            <MethodCard
              icon={<Landmark className="h-5 w-5" />}
              title="Virement"
              lines={["Faites un virement.", "Ajoutez une référence.", "Envoyez la référence à l’admin."]}
            />
            <MethodCard
              icon={<Receipt className="h-5 w-5" />}
              title="Chèque"
              lines={["Préparez le chèque.", "Indiquez votre email/ID.", "Activation après validation."]}
            />
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="font-extrabold text-slate-900">Infos à donner à l’admin</div>
            <div className="mt-2 text-sm text-slate-700 grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>• Email: <b>{user.email}</b></div>
              <div>• ID: <b>{user.id}</b></div>
              <div>• Montant: <b>{price} DT</b> / mois</div>
              <div>• Méthode: CASH / BANK_TRANSFER / CHEQUE</div>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={() => refreshMe()}
              className="rounded-xl bg-black px-4 py-3 text-sm font-extrabold text-white hover:bg-slate-900"
            >
              J’ai payé → Vérifier activation
            </button>
          </div>

          <div className="mt-3 text-xs text-slate-500">
            * Activation après validation admin (paiement hors ligne).
          </div>
        </div>
      </div>
    </div>
  );
}

function MethodCard({ icon, title, lines }: { icon: React.ReactNode; title: string; lines: string[] }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center gap-2 font-extrabold text-slate-900">
        <span className="rounded-xl bg-slate-50 border border-slate-200 p-2">{icon}</span>
        {title}
      </div>
      <ul className="mt-3 space-y-1 text-sm text-slate-700">
        {lines.map((l) => (
          <li key={l}>• {l}</li>
        ))}
      </ul>
    </div>
  );
}