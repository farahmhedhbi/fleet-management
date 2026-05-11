"use client";

import { useEffect, useState } from "react";
import { Clock3, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { incidentService } from "@/lib/services/incidentService";
import type { IncidentHistoryDTO } from "@/types/incident";

function formatDate(value: string) {
  return new Date(value).toLocaleString("fr-FR");
}

export default function OwnerIncidentHistoryPage() {
  const router = useRouter();
  const [items, setItems] = useState<IncidentHistoryDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setItems(await incidentService.getAllHistory());
      } catch {
        toast.error("Erreur chargement historique");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <ProtectedRoute allowedRoles={["ROLE_OWNER", "ROLE_ADMIN"]}>
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-5xl space-y-6">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 rounded-xl border bg-white px-4 py-2 text-sm font-semibold"
          >
            <ArrowLeft size={18} />
            Retour
          </button>

          <div className="rounded-3xl bg-white p-6 shadow-sm border">
            <div className="flex items-center gap-2">
              <Clock3 className="text-blue-600" />
              <h1 className="text-2xl font-bold">Historique des incidents</h1>
            </div>

            <p className="mt-2 text-sm text-slate-500">
              Historique global des incidents de votre flotte.
            </p>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm border">
            {loading ? (
              <p>Chargement...</p>
            ) : items.length === 0 ? (
              <p className="text-sm text-slate-500">
                Aucun historique disponible.
              </p>
            ) : (
              <div className="space-y-5">
                {items.map((h, index) => (
                  <div key={h.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="h-3 w-3 rounded-full bg-blue-600" />
                      {index !== items.length - 1 && (
                        <div className="h-full min-h-10 w-px bg-slate-300" />
                      )}
                    </div>

                    <div className="flex-1 pb-3">
                      <p className="font-bold text-slate-800">{h.action}</p>

                      {h.comment && (
                        <p className="mt-1 text-sm text-slate-500">
                          {h.comment}
                        </p>
                      )}

                      {h.oldStatus && h.newStatus && (
                        <p className="mt-1 text-sm font-semibold text-slate-700">
                          {h.oldStatus} → {h.newStatus}
                        </p>
                      )}

                      <p className="mt-1 text-xs text-slate-400">
                        Incident #{h.incidentId} • {h.userEmail ?? "Système"} •{" "}
                        {formatDate(h.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}