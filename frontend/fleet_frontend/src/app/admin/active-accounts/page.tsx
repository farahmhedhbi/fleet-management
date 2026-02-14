"use client";

import { useEffect, useMemo, useState } from "react";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { adminUsersService, AdminUser } from "@/lib/services/adminUsersService";
import { toastError, toastSuccess } from "@/components/ui/Toast";

function formatDate(iso?: string | null) {
  if (!iso) return "Jamais connecté";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Date invalide";
  return d.toLocaleString();
}

export default function ActiveAccountsPage() {
  const [filter, setFilter] = useState<"ALL" | "ENABLED" | "DISABLED">("ALL");
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [busyId, setBusyId] = useState<number | null>(null);

  const enabledParam = useMemo(() => {
    if (filter === "ENABLED") return true;
    if (filter === "DISABLED") return false;
    return undefined;
  }, [filter]);

  async function load() {
    try {
      setLoading(true);
      const data = await adminUsersService.list(enabledParam);
      setUsers(data);
    } catch (e: any) {
      toastError(e?.response?.data?.message || "Erreur chargement utilisateurs");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabledParam]);

  async function toggleEnabled(u: AdminUser) {
    try {
      setBusyId(u.id);
      const updated = await adminUsersService.setEnabled(u.id, !u.enabled);
      setUsers((prev) => prev.map((x) => (x.id === u.id ? updated : x)));
      toastSuccess(updated.enabled ? "Compte activé" : "Compte désactivé");
    } catch (e: any) {
      toastError(e?.response?.data?.message || "Erreur modification enabled");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <ProtectedRoute requiredRoles={["ROLE_ADMIN"]}>
      <div className="p-6 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">
              Comptes actifs
            </h1>
            <p className="text-slate-600 mt-1">
              Liste des utilisateurs + statut activé/désactivé + dernière connexion.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
            >
              <option value="ALL">Tous</option>
              <option value="ENABLED">Activés</option>
              <option value="DISABLED">Désactivés</option>
            </select>

            <button
              onClick={load}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Rafraîchir
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-600">
                    Utilisateur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-600">
                    Rôle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-600">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-600">
                    Dernière connexion
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-600">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">
                {loading ? (
                  <tr>
                    <td className="px-6 py-6 text-slate-600" colSpan={5}>
                      Chargement...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td className="px-6 py-6 text-slate-600" colSpan={5}>
                      Aucun utilisateur.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">
                          {u.firstName} {u.lastName}
                        </div>
                        <div className="text-sm text-slate-600">{u.email}</div>
                      </td>

                      <td className="px-6 py-4 text-sm font-semibold text-slate-700">
                        {String(u.role)}
                      </td>

                      <td className="px-6 py-4">
                        {u.enabled ? (
                          <span className="inline-flex items-center rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">
                            Activé
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700">
                            Désactivé
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-700">
                        {formatDate(u.lastLoginAt)}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => toggleEnabled(u)}
                          disabled={busyId === u.id}
                          className={`rounded-xl px-4 py-2 text-sm font-bold transition
                            ${
                              u.enabled
                                ? "bg-red-600 text-white hover:bg-red-700"
                                : "bg-emerald-600 text-white hover:bg-emerald-700"
                            }
                            disabled:opacity-60`}
                        >
                          {busyId === u.id
                            ? "..."
                            : u.enabled
                            ? "Désactiver"
                            : "Activer"}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
