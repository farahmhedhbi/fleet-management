"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { SubscriptionInfo } from "@/types/subscription";
import {
  fmtDateTime,
  isSubscriptionActive,
  isSubscriptionExpired,
  remainingTime,
} from "@/lib/subscription";

export function SubscriptionBanner({ info }: { info: SubscriptionInfo }) {
  const status = info.subscriptionStatus;

  // refresh chaque minute
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((x) => x + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  const trialLeft = useMemo(() => remainingTime(info.trialEndAt), [info.trialEndAt]);
  const activeLeft = useMemo(() => remainingTime(info.paidUntil), [info.paidUntil]);

  if (!status) return null;

  // EXPIRED (ou TRIAL/ACTIVE dépassé)
  if (isSubscriptionExpired(info)) {
    return (
      <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="font-extrabold text-red-700">⛔ Abonnement expiré</div>
            <div className="mt-1 text-sm text-slate-700">
              Votre période d’accès est terminée. Les fonctionnalités premium sont bloquées
              (Véhicules, Conducteurs, Missions, Rapports…).
            </div>
            <div className="mt-2 text-sm text-slate-700">
              ✅ Pour réactiver: effectuez un paiement <b>hors ligne</b> (Cash/Virement/Chèque).
              L’admin validera et activera votre compte.
            </div>
          </div>

          <Link
            href="/owner/billing"
            className="shrink-0 rounded-xl bg-red-600 px-4 py-2 text-sm font-extrabold text-white hover:bg-red-700"
          >
            Activer maintenant
          </Link>
        </div>
      </div>
    );
  }

  // TRIAL (actif)
  if (status === "TRIAL") {
    return (
      <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="font-extrabold text-amber-800">🎁 Essai gratuit (TRIAL)</div>
            <div className="mt-1 text-sm text-slate-700">
              Fin d’essai : <b>{fmtDateTime(info.trialEndAt)}</b>
            </div>

            {trialLeft && (
              <div className="mt-1 text-sm font-semibold text-slate-800">
                ⏳ Temps restant : <b>{trialLeft.days}j {trialLeft.hours}h</b>
              </div>
            )}

            <div className="mt-2 text-sm text-slate-700">
              Après expiration, les fonctionnalités importantes seront bloquées.
              Vous pouvez payer dès maintenant pour éviter toute interruption.
            </div>
          </div>

          <Link
            href="/owner/billing"
            className="shrink-0 rounded-xl bg-amber-600 px-4 py-2 text-sm font-extrabold text-white hover:bg-amber-700"
          >
            Voir paiement
          </Link>
        </div>
      </div>
    );
  }

  // ACTIVE
  if (isSubscriptionActive(info)) {
    return (
      <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="font-extrabold text-emerald-800">✅ Abonnement actif</div>
            <div className="mt-1 text-sm text-slate-700">
              Valable jusqu’au : <b>{fmtDateTime(info.paidUntil)}</b>
            </div>

            {activeLeft && (
              <div className="mt-1 text-sm font-semibold text-slate-800">
                ⏳ Temps restant : <b>{activeLeft.days}j {activeLeft.hours}h</b>
              </div>
            )}
          </div>

          <Link
            href="/owner/billing"
            className="shrink-0 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-extrabold text-white hover:bg-emerald-700"
          >
            Gérer abonnement
          </Link>
        </div>
      </div>
    );
  }

  // fallback (rare)
  return null;
}