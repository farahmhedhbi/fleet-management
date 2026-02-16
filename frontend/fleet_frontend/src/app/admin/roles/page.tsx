"use client";

import { useEffect, useMemo, useState } from "react";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import {
  adminUsersService,
  AdminUser,
  RoleName,
} from "@/lib/services/adminUsersService";
import { toastError, toastSuccess } from "@/components/ui/Toast";
import {
  RefreshCcw,
  Shield,
  Users,
  UserCog,
  BadgeCheck,
  Mail,
  Save,
} from "lucide-react";

const ROLE_OPTIONS: RoleName[] = ["ROLE_ADMIN", "ROLE_OWNER", "ROLE_DRIVER"];

function cn(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

function roleChip(role?: string) {
  const r = String(role || "");
  if (r.includes("ADMIN"))
    return "bg-gradient-to-r from-purple-500 via-purple-600 to-pink-600";
  if (r.includes("OWNER"))
    return "bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600";
  if (r.includes("DRIVER"))
    return "bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700";
  return "bg-gradient-to-r from-slate-500 to-slate-700";
}

function saveButtonGradient(role?: RoleName) {
  const r = String(role || "");
  if (r.includes("ADMIN"))
    return "bg-gradient-to-r from-purple-500 via-purple-600 to-pink-600 hover:shadow-purple-500/25";
  if (r.includes("OWNER"))
    return "bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 hover:shadow-green-500/25";
  if (r.includes("DRIVER"))
    return "bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 hover:shadow-blue-500/25";
  return "bg-gradient-to-r from-slate-600 to-slate-800 hover:shadow-slate-500/25";
}

export default function RolesPage() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [draftRoles, setDraftRoles] = useState<Record<number, RoleName>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);

  async function load() {
    try {
      setIsRefreshing(true);
      setLoading(true);
      const data = await adminUsersService.list(); // tous
      setUsers(data);

      // init draft
      const init: Record<number, RoleName> = {};
      data.forEach((u) => {
        const r = (u.role as RoleName) || "ROLE_DRIVER";
        if (ROLE_OPTIONS.includes(r)) init[u.id] = r;
      });
      setDraftRoles(init);
    } catch (e: any) {
      toastError(e?.response?.data?.message || "Erreur chargement utilisateurs");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const rows = useMemo(() => users, [users]);

  const stats = useMemo(() => {
    const total = rows.length;
    const admin = rows.filter((u) => String(u.role).includes("ADMIN")).length;
    const owner = rows.filter((u) => String(u.role).includes("OWNER")).length;
    const driver = rows.filter((u) => String(u.role).includes("DRIVER")).length;
    return { total, admin, owner, driver };
  }, [rows]);

  function onChangeRole(userId: number, role: RoleName) {
    setDraftRoles((prev) => ({ ...prev, [userId]: role }));
  }

  async function save(user: AdminUser) {
    const newRole = draftRoles[user.id];
    if (!newRole || String(user.role) === newRole) {
      toastSuccess("Aucun changement");
      return;
    }

    try {
      setBusyId(user.id);
      const updated = await adminUsersService.updateUser(user.id, {
        role: newRole,
      });

      // backend retourne UserDTO → on garde enabled/lastLoginAt existant
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id ? { ...u, role: updated.role ?? newRole } : u
        )
      );

      toastSuccess("Rôle mis à jour");
    } catch (e: any) {
      toastError(e?.response?.data?.message || "Erreur update rôle");
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
              Rôles & permissions
            </h1>
            <p className="mt-1 text-slate-600">
              Modifier le rôle des utilisateurs (ADMIN / OWNER / DRIVER).
            </p>
          </div>

          <button
            onClick={load}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-all"
          >
            <RefreshCcw
              className={isRefreshing ? "h-4 w-4 animate-spin" : "h-4 w-4"}
            />
            Refresh
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-600">Total users</div>
              <Users className="h-5 w-5 text-slate-400" />
            </div>
            <div className="mt-2 text-3xl font-extrabold text-slate-900">
              {stats.total}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-600">Admins</div>
              <Shield className="h-5 w-5 text-purple-500" />
            </div>
            <div className="mt-2 text-3xl font-extrabold text-slate-900">
              {stats.admin}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-600">Owners</div>
              <UserCog className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="mt-2 text-3xl font-extrabold text-slate-900">
              {stats.owner}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-600">Drivers</div>
              <BadgeCheck className="h-5 w-5 text-blue-600" />
            </div>
            <div className="mt-2 text-3xl font-extrabold text-slate-900">
              {stats.driver}
            </div>
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
                Modifiez le rôle puis cliquez sur <span className="text-slate-700">Enregistrer</span>
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
                  <th className="px-6 py-4 text-right text-xs font-extrabold uppercase tracking-wider text-slate-600">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td className="px-6 py-6 text-slate-600" colSpan={3}>
                      Chargement...
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td className="px-6 py-6 text-slate-600" colSpan={3}>
                      Aucun utilisateur.
                    </td>
                  </tr>
                ) : (
                  rows.map((u) => {
                    const current =
                      draftRoles[u.id] || (u.role as RoleName) || "ROLE_DRIVER";
                    const changed = String(u.role) !== current;

                    return (
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
                          <div className="flex flex-wrap items-center gap-3">
                            <select
                              value={current}
                              onChange={(e) =>
                                onChangeRole(u.id, e.target.value as RoleName)
                              }
                              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-extrabold text-slate-800 shadow-sm outline-none focus:ring-2 focus:ring-slate-200"
                            >
                              {ROLE_OPTIONS.map((r) => (
                                <option key={r} value={r}>
                                  {r}
                                </option>
                              ))}
                            </select>

                            <span
                              className={cn(
                                "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-extrabold text-white shadow",
                                roleChip(current)
                              )}
                            >
                              <span className="h-2 w-2 rounded-full bg-white/70" />
                              {current}
                            </span>

                            {changed && (
                              <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-extrabold text-amber-700 border border-amber-200">
                                Modifié
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Action */}
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => save(u)}
                            disabled={busyId === u.id || !changed}
                            className={cn(
                              "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-extrabold text-white shadow-lg transition-all hover:shadow-lg",
                              saveButtonGradient(current),
                              "disabled:opacity-50 disabled:cursor-not-allowed"
                            )}
                          >
                            <Save className="h-4 w-4" />
                            {busyId === u.id ? "..." : "Enregistrer"}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
