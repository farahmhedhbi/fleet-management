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

  if (loading) return <div className="p-6 text-slate-700">Chargement...</div>;
  if (!user) return <div className="p-6 text-slate-700">Non connecté.</div>;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Container */}
      <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6 md:py-10 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">
              {title}
            </h1>
            <p className="text-sm md:text-base leading-relaxed text-slate-700">
              Paiement <span className="font-bold">hors ligne</span> + activation manuelle par l’admin.
            </p>
          </div>

          <button
            onClick={() => refreshMe()}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 hover:text-slate-900"
          >
            <Clock className="h-4 w-4" />
            Refresh status
          </button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Plan */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-slate-900 text-white p-2.5 shrink-0">
                <CreditCard className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="text-lg md:text-xl font-extrabold text-slate-900">
                  Standard Plan
                </div>
                <div className="text-sm md:text-base text-slate-700">
                  Gestion complète de flotte
                </div>
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-end gap-2">
                <div className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">
                  {price}
                </div>
                <div className="pb-1 text-base font-bold text-slate-700">DT</div>
              </div>
              <div className="mt-1 text-sm md:text-base text-slate-700">par mois</div>
            </div>

            <ul className="mt-6 space-y-2.5 text-sm md:text-base text-slate-800">
              <li className="flex items-center gap-2">
                <BadgeCheck className="h-4 w-4 text-emerald-600" /> Véhicules & Conducteurs
              </li>
              <li className="flex items-center gap-2">
                <BadgeCheck className="h-4 w-4 text-emerald-600" /> Missions & dispatch
              </li>
              <li className="flex items-center gap-2">
                <BadgeCheck className="h-4 w-4 text-emerald-600" /> Rapports & analytics
              </li>
              <li className="flex items-center gap-2">
                <BadgeCheck className="h-4 w-4 text-emerald-600" /> Maintenance & suivi
              </li>
            </ul>

            <div
              className={cn(
                "mt-6 rounded-2xl border p-4",
                active
                  ? "border-emerald-200 bg-emerald-50"
                  : expired
                  ? "border-rose-200 bg-rose-50"
                  : "border-amber-200 bg-amber-50"
              )}
            >
              {active ? (
                <div className="space-y-1">
                  <div className="font-extrabold text-emerald-800">✅ Actif</div>
                  <div className="text-sm md:text-base text-slate-800 leading-relaxed">
                    Valable jusqu’au : <span className="font-bold">{fmtDateTime(user.paidUntil ?? null)}</span>
                  </div>
                </div>
              ) : expired ? (
                <div className="space-y-1">
                  <div className="font-extrabold text-rose-800">⛔ Expiré</div>
                  <div className="text-sm md:text-base text-slate-800 leading-relaxed">
                    Les fonctionnalités premium sont bloquées. Faites le paiement pour réactiver.
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="font-extrabold text-amber-800">🎁 Essai gratuit</div>
                  <div className="text-sm md:text-base text-slate-800 leading-relaxed">
                    Fin d’essai : <span className="font-bold">{fmtDateTime(user.trialEndAt ?? null)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
            <div className="space-y-1">
              <div className="text-lg md:text-xl font-extrabold text-slate-900">
                Paiement hors ligne
              </div>
              <p className="text-sm md:text-base leading-relaxed text-slate-700">
                Après paiement, l’admin vérifie puis active votre abonnement.
              </p>
            </div>

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
              <div className="mt-3 text-sm md:text-base text-slate-800 grid grid-cols-1 md:grid-cols-2 gap-2 leading-relaxed">
                <div>• Email : <span className="font-bold">{user.email}</span></div>
                <div>• Montant : <span className="font-bold">{price} DT</span> / mois</div>
                <div>• Méthode : <span className="font-semibold">CASH / BANK_TRANSFER / CHEQUE</span></div>
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => refreshMe()}
                className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm md:text-base font-extrabold text-white shadow-sm hover:bg-slate-800"
              >
                J’ai payé → Vérifier activation
              </button>
            </div>

            <div className="mt-3 text-xs md:text-sm text-slate-600">
              * Activation après validation admin (paiement hors ligne).
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MethodCard({
  icon,
  title,
  lines,
}: {
  icon: React.ReactNode;
  title: string;
  lines: string[];
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 font-extrabold text-slate-900 text-base">
        <span className="rounded-xl bg-slate-50 border border-slate-200 p-2 text-slate-800">
          {icon}
        </span>
        {title}
      </div>
      <ul className="mt-3 space-y-1.5 text-sm md:text-base text-slate-800 leading-relaxed">
        {lines.map((l) => (
          <li key={l}>• {l}</li>
        ))}
      </ul>
    </div>
  );
}