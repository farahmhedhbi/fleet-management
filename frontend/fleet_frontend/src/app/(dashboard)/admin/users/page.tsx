"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminOnly } from "@/components/layout/AdminOnly";
import { AdminShell } from "@/components/admin/AdminShell";
import { adminService } from "@/lib/services/adminService";
import type { User, RoleName, InviteUserDTO, UpdateUserDTO } from "@/types/user";
import {
  Plus,
  RefreshCcw,
  Search,
  Trash2,
  Pencil,
  X,
  Save,
  Shield,
  Users,
  Mail,
  BadgeCheck,
  UserCog,
  KeyRound,
} from "lucide-react";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { toastError, toastSuccess } from "@/components/ui/Toast";

function cn(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

/**
 * ✅ Invite: ADMIN peut inviter فقط OWNER
 * ✅ List users: ne pas afficher les comptes ADMIN (liste + stats + recherche)
 * ✅ Bloquer edit/delete si ADMIN arrive quand même depuis l'API
 *
 * ⚠️ Frontend masking seulement.
 * ➜ recommandé: filtrer aussi côté backend.
 */
const ROLES_EDIT: RoleName[] = ["ROLE_ADMIN", "ROLE_OWNER", "ROLE_DRIVER", "ROLE_API_CLIENT"];

function isAdminRole(role?: string) {
  const r = String(role || "").toUpperCase();
  return r === "ROLE_ADMIN" || r.includes("ADMIN");
}

function roleChip(role?: string) {
  const r = String(role || "");
  if (r.includes("ADMIN")) return "bg-gradient-to-r from-purple-500 via-purple-600 to-pink-600";
  if (r.includes("OWNER")) return "bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600";
  if (r.includes("DRIVER")) return "bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700";
  if (r.includes("API")) return "bg-gradient-to-r from-slate-600 to-slate-800";
  return "bg-gradient-to-r from-slate-500 to-slate-700";
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [q, setQ] = useState("");

  // modal state
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"invite" | "edit">("invite");
  const [editing, setEditing] = useState<User | null>(null);

  // form
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");

  // role used mainly for EDIT; for INVITE we force ROLE_OWNER
  const [role, setRole] = useState<RoleName>("ROLE_OWNER");
  const [licenseNumber, setLicenseNumber] = useState("");

  // edit-only
  const [newPassword, setNewPassword] = useState("");

  const isInvite = mode === "invite";
  const effectiveRole: RoleName = isInvite ? "ROLE_OWNER" : role;
  const isDriver = effectiveRole === "ROLE_DRIVER";

  /**
   * ✅ Visible users = all users except ADMIN
   * (applied to list + stats + search)
   */
  const visibleUsers = useMemo(() => {
    return (users || []).filter((u) => !isAdminRole(u.role));
  }, [users]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return visibleUsers;
    return visibleUsers.filter((u) =>
      `${u.firstName} ${u.lastName} ${u.email} ${u.role}`.toLowerCase().includes(s)
    );
  }, [visibleUsers, q]);

  const stats = useMemo(() => {
    const total = visibleUsers.length;
    const admin = 0; // ✅ admin hidden
    const owner = visibleUsers.filter((u) => String(u.role).includes("OWNER")).length;
    const driver = visibleUsers.filter((u) => String(u.role).includes("DRIVER")).length;
    return { total, admin, owner, driver };
  }, [visibleUsers]);

  async function loadUsers() {
    setIsRefreshing(true);
    setLoading(true);
    try {
      const data = await adminService.listUsers();
      // ✅ keep raw list; filtering is done via visibleUsers memo
      setUsers(data || []);
    } catch (e: any) {
      toastError(e?.response?.data?.error || e?.response?.data?.message || "Erreur chargement users");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  function resetForm() {
    setFirstName("");
    setLastName("");
    setEmail("");
    setRole("ROLE_OWNER");
    setLicenseNumber("");
    setNewPassword("");
    setEditing(null);
  }

  function openInvite() {
    resetForm();
    setMode("invite");
    setRole("ROLE_OWNER"); // ✅ forcé
    setOpen(true);
  }

  function openEdit(u: User) {
    // ✅ extra safety: don't allow editing admin
    if (isAdminRole(u.role)) {
      toastError("Modification des comptes ADMIN interdite.");
      return;
    }

    resetForm();
    setMode("edit");
    setEditing(u);
    setFirstName(u.firstName || "");
    setLastName(u.lastName || "");
    setEmail(u.email || "");
    setRole((u.role as RoleName) || "ROLE_OWNER");
    setLicenseNumber(u.licenseNumber || "");
    setOpen(true);
  }

  async function submit() {
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      toastError("firstName / lastName / email are required");
      return;
    }

    // ✅ licenseNumber seulement en EDIT quand role = DRIVER
    if (!isInvite && isDriver && !licenseNumber.trim()) {
      toastError("licenseNumber is required for ROLE_DRIVER");
      return;
    }

    try {
      if (mode === "invite") {
        // ✅ INVITE: only OWNER
        const payload: InviteUserDTO = {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          role: "ROLE_OWNER",
        };

        const invited = await adminService.inviteUser(payload);

        // ✅ even if API returns admin by mistake, never show
        if (!isAdminRole(invited?.role)) {
          setUsers((prev) => [invited, ...(prev || [])]);
        }

        toastSuccess("Invitation envoyée ✅ L’utilisateur doit activer son compte par email.");
        setOpen(false);
        return;
      }

      if (mode === "edit" && editing) {
        // ✅ optional: prevent setting admin role from UI
        if (isAdminRole(effectiveRole)) {
          toastError("Impossible de définir ROLE_ADMIN depuis cette page.");
          return;
        }

        const payload: UpdateUserDTO = {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          role: effectiveRole,
          ...(newPassword.trim() ? { password: newPassword.trim() } : {}),
          ...(isDriver ? { licenseNumber: licenseNumber.trim() } : {}),
        };

        const updated = await adminService.updateUser(editing.id, payload);

        // ✅ if updated becomes admin, remove it from UI
        if (isAdminRole(updated?.role)) {
          setUsers((prev) => (prev || []).filter((x) => x.id !== editing.id));
        } else {
          setUsers((prev) =>
            (prev || []).map((x) => (x.id === updated.id ? { ...x, ...updated } : x))
          );
        }

        toastSuccess("User updated");
        setOpen(false);
      }
    } catch (e: any) {
      toastError(e?.response?.data?.error || e?.response?.data?.message || "Erreur save user");
    }
  }

  async function remove(u: User) {
    // ✅ extra safety
    if (isAdminRole(u.role)) {
      toastError("Suppression des comptes ADMIN interdite.");
      return;
    }

    const ok = confirm(`Delete user ${u.firstName} ${u.lastName} (${u.email}) ?`);
    if (!ok) return;

    try {
      await adminService.deleteUser(u.id);
      setUsers((prev) => (prev || []).filter((x) => x.id !== u.id));
      toastSuccess("User deleted");
    } catch (e: any) {
      toastError(e?.response?.data?.error || e?.response?.data?.message || "Erreur delete user");
    }
  }

  return (
    <ProtectedRoute requiredRoles={["ROLE_ADMIN"]}>
      <AdminOnly>
        <AdminShell title="Users Management" subtitle="Invite, update and delete platform users.">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
                  Users Management
                </h1>
                <p className="mt-1 text-slate-600">
                  Flow pro: Admin invite (OWNER فقط) → email token → user définit son mot de passe.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={loadUsers}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-all"
                >
                  <RefreshCcw className={isRefreshing ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
                  Refresh
                </button>

                <button
                  onClick={openInvite}
                  className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-extrabold text-white shadow-lg transition-all hover:shadow-lg bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 hover:shadow-green-500/25"
                >
                  <Plus className="h-4 w-4" />
                  Invite Owner
                </button>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-slate-600">Total</div>
                  <Users className="h-5 w-5 text-slate-400" />
                </div>
                <div className="mt-2 text-3xl font-extrabold text-slate-900">{stats.total}</div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-slate-600">Admins</div>
                  <Shield className="h-5 w-5 text-purple-500" />
                </div>
                <div className="mt-2 text-3xl font-extrabold text-slate-900">{stats.admin}</div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-slate-600">Owners</div>
                  <UserCog className="h-5 w-5 text-emerald-600" />
                </div>
                <div className="mt-2 text-3xl font-extrabold text-slate-900">{stats.owner}</div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-slate-600">Drivers</div>
                  <BadgeCheck className="h-5 w-5 text-blue-600" />
                </div>
                <div className="mt-2 text-3xl font-extrabold text-slate-900">{stats.driver}</div>
              </div>
            </div>

            {/* Card */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-lg overflow-hidden">
              {/* Search toolbar */}
              <div className="p-5 border-b border-slate-200 bg-slate-50">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-bold text-slate-900">All Users</div>

                  <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-extrabold text-slate-700">
                    <Users className="h-4 w-4" />
                    {filtered.length}
                  </div>
                </div>

                <div className="mt-4 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search by name/email/role..."
                    className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-slate-200"
                  />
                </div>
              </div>

              {/* list */}
              <div className="p-5">
                {loading ? (
                  <div className="animate-pulse space-y-3">
                    <div className="h-14 rounded-2xl bg-slate-200" />
                    <div className="h-14 rounded-2xl bg-slate-200" />
                    <div className="h-14 rounded-2xl bg-slate-200" />
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="text-slate-600">No users found.</div>
                ) : (
                  <div className="space-y-3">
                    {filtered.map((u) => (
                      <div
                        key={u.id}
                        className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 hover:shadow-md transition-all"
                      >
                        <div className="flex items-start gap-3">
                          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-900 text-white shadow-md">
                            <Users className="h-5 w-5" />
                          </div>

                          <div>
                            <div className="font-extrabold text-slate-900">
                              {u.firstName} {u.lastName}
                            </div>

                            <div className="mt-1 inline-flex items-center gap-2 text-sm font-semibold text-slate-600">
                              <Mail className="h-4 w-4 text-slate-400" />
                              {u.email}
                            </div>

                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <div
                                className={cn(
                                  "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-extrabold text-white shadow",
                                  roleChip(String(u.role))
                                )}
                              >
                                <Shield className="h-3.5 w-3.5" />
                                {u.role}
                              </div>

                              {"enabled" in u && (
                                <div
                                  className={cn(
                                    "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-extrabold shadow",
                                    u.enabled
                                      ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
                                      : "border border-amber-200 bg-amber-50 text-amber-800"
                                  )}
                                >
                                  {u.enabled ? "Enabled" : "Disabled"}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEdit(u)}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-all"
                          >
                            <Pencil className="h-4 w-4" />
                            Edit
                          </button>

                          <button
                            onClick={() => remove(u)}
                            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-extrabold text-white shadow-lg transition-all bg-gradient-to-r from-rose-500 via-red-600 to-rose-700 hover:shadow-red-500/25"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal invite/edit */}
            {open && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
                  <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                    <div className="flex items-start gap-3">
                      <div className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-900 text-white shadow-md">
                        {mode === "invite" ? (
                          <KeyRound className="h-5 w-5" />
                        ) : (
                          <Pencil className="h-5 w-5" />
                        )}
                      </div>

                      <div>
                        <div className="text-xs font-extrabold text-slate-600">
                          {mode === "invite" ? "INVITE OWNER" : "EDIT USER"}
                        </div>
                        <div className="text-xl font-extrabold text-slate-900">
                          {mode === "invite"
                            ? "Invitation Owner (email activation)"
                            : `${editing?.firstName} ${editing?.lastName}`}
                        </div>
                        {mode === "invite" && (
                          <div className="mt-1 text-sm font-semibold text-slate-600">
                            Rôle: <span className="font-extrabold text-emerald-700">ROLE_OWNER</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => setOpen(false)}
                      className="rounded-xl border border-slate-200 bg-white p-2 hover:bg-slate-50"
                    >
                      <X className="h-5 w-5 text-slate-700" />
                    </button>
                  </div>

                  <div className="p-5 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-700">First name</div>
                        <input
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-slate-200"
                        />
                      </div>

                      <div>
                        <div className="text-sm font-semibold text-slate-700">Last name</div>
                        <input
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-slate-200"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="text-sm font-semibold text-slate-700">Email</div>
                      <input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-slate-200"
                      />
                    </div>

                    {/* ✅ EDIT: role + licenseNumber */}
                    {!isInvite && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <div className="text-sm font-semibold text-slate-700">Role</div>
                          <select
                            value={role}
                            onChange={(e) => setRole(e.target.value as RoleName)}
                            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-slate-200"
                          >
                            {ROLES_EDIT.map((r) => (
                              <option key={r} value={r}>
                                {r}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <div className="text-sm font-semibold text-slate-700">
                            License number {isDriver ? "(required)" : "(only for drivers)"}
                          </div>
                          <input
                            value={licenseNumber}
                            onChange={(e) => setLicenseNumber(e.target.value)}
                            disabled={!isDriver}
                            placeholder={isDriver ? "ex: TN-DR-1234" : "Only for drivers"}
                            className={cn(
                              "mt-1 w-full rounded-xl border px-3 py-2 text-sm font-semibold outline-none focus:ring-2",
                              !isDriver
                                ? "border-slate-200 bg-slate-50 text-slate-400 focus:ring-slate-200"
                                : "border-slate-200 bg-white text-slate-800 focus:ring-slate-200"
                            )}
                          />
                        </div>
                      </div>
                    )}

                    {/* optional password in edit */}
                    {mode === "edit" && (
                      <div>
                        <div className="text-sm font-semibold text-slate-700">
                          New password (optional)
                        </div>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-slate-200"
                          placeholder="Leave empty to keep current password"
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        onClick={() => setOpen(false)}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-sm"
                      >
                        <X className="h-4 w-4" />
                        Cancel
                      </button>

                      <button
                        onClick={submit}
                        className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-extrabold text-white shadow-lg transition-all hover:shadow-lg bg-gradient-to-r from-slate-900 to-slate-800"
                      >
                        <Save className="h-4 w-4" />
                        {mode === "invite" ? "Send Invite" : "Save"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </AdminShell>
      </AdminOnly>
    </ProtectedRoute>
  );
}