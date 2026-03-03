"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { isExpired } from "@/lib/subscription";
import type { SubscriptionInfo } from "@/types/subscription";

function fmt(d?: string | null) {
  if (!d) return "-";
  const dt = new Date(d);
  return Number.isNaN(dt.getTime()) ? d : dt.toLocaleString();
}

function timeLeft(target?: string | null) {
  if (!target) return null;

  const end = new Date(target).getTime();
  if (Number.isNaN(end)) return null;

  const now = Date.now();
  const diff = end - now;

  if (diff <= 0) return { days: 0, hours: 0 };

  const totalHours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;

  return { days, hours };
}

export function SubscriptionBanner({ info }: { info: SubscriptionInfo }) {
  const status = info.subscriptionStatus;

  // 🔄 rafraîchit chaque minute
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((x) => x + 1), 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const trialTime = useMemo(() => timeLeft(info.trialEndAt), [info.trialEndAt]);
  const activeTime = useMemo(() => timeLeft(info.paidUntil), [info.paidUntil]);

  if (!status) return null;

  if (status === "TRIAL") {
    return (
      <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <div className="font-semibold">🎁 Période d’essai (TRIAL)</div>

        <div className="mt-1 text-sm text-slate-700">
          Fin d’essai : <b>{fmt(info.trialEndAt)}</b>
        </div>

        {trialTime && (
          <div className="mt-1 text-sm text-slate-800 font-medium">
            ⏳ Temps restant :{" "}
            <b>
              {trialTime.days}j {trialTime.hours}h
            </b>
          </div>
        )}

        <div className="mt-2 text-sm text-slate-700">
          Après expiration, les actions seront bloquées.
        </div>

        <div className="mt-2 text-sm">
          <Link className="underline" href="/owner/billing">
            Voir instructions de paiement
          </Link>
        </div>
      </div>
    );
  }

  if (isExpired(status)) {
    return (
      <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4">
        <div className="font-semibold">⛔ Abonnement expiré</div>
        <div className="mt-1 text-sm text-slate-700">
          Vos fonctionnalités sont désactivées.
        </div>
        <div className="mt-2 text-sm">
          <Link className="underline" href="/owner/billing">
            Activer l’abonnement
          </Link>
        </div>
      </div>
    );
  }

  // ACTIVE
  return (
    <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
      <div className="font-semibold">✅ Abonnement actif</div>

      <div className="mt-1 text-sm text-slate-700">
        Valable jusqu’au : <b>{fmt(info.paidUntil)}</b>
      </div>

      {activeTime && (
        <div className="mt-1 text-sm text-slate-800 font-medium">
          ⏳ Temps restant :{" "}
          <b>
            {activeTime.days}j {activeTime.hours}h
          </b>
        </div>
      )}
    </div>
  );
}