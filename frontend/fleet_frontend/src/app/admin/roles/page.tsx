"use client";

import { useEffect, useMemo, useState } from "react";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { adminUsersService, AdminUser, RoleName } from "@/lib/services/adminUsersService";
import { toastError, toastSuccess } from "@/components/ui/Toast";

const ROLE_OPTIONS: RoleName[] = ["ROLE_ADMIN", "ROLE_OWNER", "ROLE_DRIVER"];

export default function RolesPage() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [draftRoles, setDraftRoles] = useState<Record<number, RoleName>>({});

  async function load() {
    try {
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
    }
  }

  useEffect(() => {
    load();
  }, []);

  const rows = useMemo(() => users, [users]);

  function onChangeRole(userId: number, role: RoleName) {
    setDraftRoles((prev) => ({ ...prev, [userId]: role }));
  }

  async function save(user: AdminUser) {
    const newRole = draftRoles[user.id];
    if (!newRole || String(user.role) === newRole) {
      toastInfoLocal("Aucun changement");
      return;
    }

    try {
      setBusyId(user.id);
      const updated = await adminUsersService.updateUser(user.id, { role: newRole });

      // backend retourne UserDTO (pas UserAdminDTO) → on garde enabled/lastLoginAt existant
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id
            ? { ...u, role: updated.role ?? newRole }
            : u
        )
      );

      toastSuccess("Rôle mis à jour");
    } catch (e: any) {
      toastError(e?.response?.data?.message || "Erreur update rôle");
    } finally {
      setBusyId(null);
    }
  }

  function toastInfoLocal(msg: string) {
    // si tu as toastInfo dans ton Toast.tsx tu peux l'utiliser
    // sinon on utilise success neutre
    toastSuccess(msg);
  }

  return (
    <ProtectedRoute requiredRoles={["ROLE_ADMIN"]}>
      <div className="p-6 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">
              Rôles & permissions
            </h1>
            <p className="text-slate-600 mt-1">
              Modifier le rôle des utilisateurs (ADMIN / OWNER / DRIVER).
            </p>
          </div>

          <button
            onClick={load}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Rafraîchir
          </button>
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
                  <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-600">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">
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
                    const current = draftRoles[u.id] || (u.role as RoleName) || "ROLE_DRIVER";
                    const changed = String(u.role) !== current;

                    return (
                      <tr key={u.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-900">
                            {u.firstName} {u.lastName}
                          </div>
                          <div className="text-sm text-slate-600">{u.email}</div>
                        </td>

                        <td className="px-6 py-4">
                          <select
                            value={current}
                            onChange={(e) => onChangeRole(u.id, e.target.value as RoleName)}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
                          >
                            {ROLE_OPTIONS.map((r) => (
                              <option key={r} value={r}>
                                {r}
                              </option>
                            ))}
                          </select>

                          {changed && (
                            <span className="ml-3 inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                              Modifié
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => save(u)}
                            disabled={busyId === u.id || !changed}
                            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                          >
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
