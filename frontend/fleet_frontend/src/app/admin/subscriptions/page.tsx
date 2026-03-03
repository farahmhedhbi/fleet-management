"use client";

import { useState } from "react";
import { adminSubscriptionService } from "@/lib/services/adminSubscriptionService";

export default function AdminSubscriptionsPage() {
  const [ownerId, setOwnerId] = useState("");
  const [months, setMonths] = useState(1);
  const [amount, setAmount] = useState(50);
  const [method, setMethod] = useState<"CASH" | "BANK_TRANSFER" | "CHEQUE">("CASH");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [result, setResult] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);

  const doActivate = async () => {
    setResult(null);
    const id = Number(ownerId);
    const res = await adminSubscriptionService.activate(id, {
      months,
      amount,
      method,
      reference: reference || undefined,
      note: note || undefined,
    });
    setResult(res.data);
  };

  const loadPayments = async () => {
    const id = Number(ownerId);
    const res = await adminSubscriptionService.payments(id);
    setPayments(res.data);
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-bold">Admin — Abonnements</h1>

      <div className="grid gap-3 rounded-xl border p-4 max-w-xl">
        <label className="text-sm">
          Owner ID
          <input className="mt-1 w-full rounded-lg border p-2" value={ownerId} onChange={(e) => setOwnerId(e.target.value)} />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm">
            Mois
            <input type="number" className="mt-1 w-full rounded-lg border p-2" value={months} onChange={(e) => setMonths(Number(e.target.value))} />
          </label>
          <label className="text-sm">
            Montant
            <input type="number" className="mt-1 w-full rounded-lg border p-2" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
          </label>
        </div>

        <label className="text-sm">
          Méthode
          <select className="mt-1 w-full rounded-lg border p-2" value={method} onChange={(e) => setMethod(e.target.value as any)}>
            <option value="CASH">CASH</option>
            <option value="BANK_TRANSFER">BANK_TRANSFER</option>
            <option value="CHEQUE">CHEQUE</option>
          </select>
        </label>

        <label className="text-sm">
          Référence (optionnel)
          <input className="mt-1 w-full rounded-lg border p-2" value={reference} onChange={(e) => setReference(e.target.value)} />
        </label>

        <label className="text-sm">
          Note (optionnel)
          <input className="mt-1 w-full rounded-lg border p-2" value={note} onChange={(e) => setNote(e.target.value)} />
        </label>

        <div className="flex gap-2">
          <button className="rounded-lg bg-black px-4 py-2 text-white" onClick={doActivate}>
            Activer abonnement
          </button>
          <button className="rounded-lg border px-4 py-2" onClick={loadPayments}>
            Voir paiements
          </button>
        </div>
      </div>

      {result && (
        <pre className="rounded-xl border bg-slate-50 p-4 text-xs overflow-auto">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}

      {payments?.length > 0 && (
        <div className="rounded-xl border p-4">
          <div className="font-semibold mb-2">Historique paiements</div>
          <div className="text-sm space-y-2">
            {payments.map((p) => (
              <div key={p.id} className="rounded-lg border p-3">
                <div><b>{p.method}</b> — {p.amount} — {p.months} mois</div>
                <div className="text-slate-600">paidAt: {p.paidAt}</div>
                {p.reference && <div className="text-slate-600">ref: {p.reference}</div>}
                {p.note && <div className="text-slate-600">note: {p.note}</div>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}