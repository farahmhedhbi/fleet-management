"use client";

import { useEffect, useMemo, useState } from "react";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { adminUsersService, AdminUser } from "@/lib/services/adminUsersService";
import { toastError, toastSuccess } from "@/components/ui/Toast";
import {
  RefreshCcw,
  Users,
  UserCheck,
  UserX,
  Shield,
  BadgeCheck,
  Mail,
  Clock,
  Power,
} from "lucide-react";

function formatDate(iso?: string | null) {
  if (!iso) return "Jamais connecté";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Date invalide";
  return d.toLocaleString();
}

function roleBadge(role?: string) {
  const r = String(role || "");
  if (r.includes("ADMIN")) return "bg-gradient-to-r from-purple-500 via-purple-600 to-pink-600";
  if (r.includes("OWNER")) return "bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600";
  if (r.includes("DRIVER")) return "bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700";
  return "bg-gradient-to-r from-slate-500 to-slate-700";
}

export default function ActiveAccountsPage() {
  const [filter, setFilter] = useState<"ALL" | "ENABLED" | "DISABLED">("ALL");
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const enabledParam = useMemo(() => {
    if (filter === "ENABLED") return true;
    if (filter === "DISABLED") return false;
    return undefined;
  }, [filter]);

  const stats = useMemo(() => {
    const total = users.length;
    const enabled = users.filter((u) => u.enabled).length;
    const disabled = users.filter((u) => !u.enabled).length;
    return { total, enabled, disabled };
  }, [users]);

  async function load() {
    try {
      setIsRefreshing(true);
      setLoading(true);
      const data = await adminUsersService.list(enabledParam);
      setUsers(data);
    } catch (e: any) {
      toastError(e?.response?.data?.message || "Erreur chargement utilisateurs");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
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
      <div className="p-8 space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Comptes actifs
            </h1>
            <p className="mt-1 text-slate-600">
              Liste des utilisateurs, statut activé/désactivé et dernière connexion.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-all"
            >
              <option value="ALL">Tous</option>
              <option value="ENABLED">Activés</option>
              <option value="DISABLED">Désactivés</option>
            </select>

            <button
              onClick={load}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-all"
            >
              <RefreshCcw className={isRefreshing ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats row (dashboard-like) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-600">Total users</div>
              <Users className="h-5 w-5 text-slate-400" />
            </div>
            <div className="mt-2 text-3xl font-extrabold text-slate-900">{stats.total}</div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-600">Activés</div>
              <UserCheck className="h-5 w-5 text-emerald-500" />
            </div>
            <div className="mt-2 text-3xl font-extrabold text-slate-900">{stats.enabled}</div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-600">Désactivés</div>
              <UserX className="h-5 w-5 text-rose-500" />
            </div>
            <div className="mt-2 text-3xl font-extrabold text-slate-900">{stats.disabled}</div>
          </div>
        </div>

        {/* Table card */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-lg overflow-hidden">
          <div className="p-5 border-b border-slate-200 bg-slate-50">
            <div className="flex items-center justify-between">
              <div className="font-bold text-slate-900 flex items-center gap-2">
                <Shield className="h-5 w-5 text-slate-700" />
                Utilisateurs
              </div>
              <div className="text-xs font-semibold text-slate-500">
                Filtre: <span className="text-slate-700">{filter}</span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-white">
                <tr className="border-b border-slate-200">
                  <th className="px-6 py-4 text-left text-xs font-extrabold uppercase tracking-wider text-slate-600">
                    Utilisateur
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-extrabold uppercase tracking-wider text-slate-600">
                    Rôle
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-extrabold uppercase tracking-wider text-slate-600">
                    Statut
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-extrabold uppercase tracking-wider text-slate-600">
                    Dernière connexion
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-extrabold uppercase tracking-wider text-slate-600">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
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
                    <tr key={u.id} className="hover:bg-slate-50 transition">
                      {/* User */}
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-900 text-white shadow-md">
                            <BadgeCheck className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="font-extrabold text-slate-900">
                              {u.firstName} {u.lastName}
                            </div>
                            <div className="mt-1 inline-flex items-center gap-2 text-sm font-semibold text-slate-600">
                              <Mail className="h-4 w-4 text-slate-400" />
                              {u.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-extrabold text-white shadow ${roleBadge(
                            String(u.role)
                          )}`}
                        >
                          <span className="h-2 w-2 rounded-full bg-white/70" />
                          {String(u.role)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        {u.enabled ? (
                          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-700 border border-emerald-200">
                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                            Activé
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-2 rounded-full bg-rose-50 px-3 py-1 text-xs font-extrabold text-rose-700 border border-rose-200">
                            <span className="h-2 w-2 rounded-full bg-rose-500" />
                            Désactivé
                          </span>
                        )}
                      </td>

                      {/* Last login */}
                      <td className="px-6 py-4">
                        <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                          <Clock className="h-4 w-4 text-slate-400" />
                          {formatDate(u.lastLoginAt)}
                        </div>
                      </td>

                      {/* Action */}
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => toggleEnabled(u)}
                          disabled={busyId === u.id}
                          className={`
                            inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-extrabold text-white shadow-lg transition-all
                            ${
                              u.enabled
                                ? "bg-gradient-to-r from-rose-500 via-red-600 to-rose-700 hover:shadow-red-500/25"
                                : "bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 hover:shadow-green-500/25"
                            }
                            hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed
                          `}
                        >
                          <Power className="h-4 w-4" />
                          {busyId === u.id ? "..." : u.enabled ? "Désactiver" : "Activer"}
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
