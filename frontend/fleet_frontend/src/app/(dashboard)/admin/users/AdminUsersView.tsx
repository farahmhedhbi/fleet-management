"use client";

import { AdminOnly } from "@/components/layout/AdminOnly";
import { AdminShell } from "@/components/admin/AdminShell";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import type { User, RoleName } from "@/types/user";
import {
  Plus,
  RefreshCcw,
  Search,
  Trash2,
  X,
  Save,
  Shield,
  Users,
  Mail,
  UserCog,
  KeyRound,
} from "lucide-react";
import { roleChip } from "./page";

function cn(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

interface AdminUsersViewProps {
  users: User[];
  loading: boolean;
  isRefreshing: boolean;
  q: string;
  open: boolean;
  firstName: string;
  lastName: string;
  email: string;
  role: RoleName;
  stats: {
    total: number;
    owner: number;
  };
  onQChange: (value: string) => void;
  onFirstNameChange: (value: string) => void;
  onLastNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onOpenInvite: () => void;
  onClose: () => void;
  onSubmit: () => void;
  onDelete: (user: User) => void;
  onRefresh: () => void;
}

export default function AdminUsersView({
  users,
  loading,
  isRefreshing,
  q,
  open,
  firstName,
  lastName,
  email,
  role,
  stats,
  onQChange,
  onFirstNameChange,
  onLastNameChange,
  onEmailChange,
  onOpenInvite,
  onClose,
  onSubmit,
  onDelete,
  onRefresh,
}: AdminUsersViewProps) {
  return (
    <ProtectedRoute requiredRoles={["ROLE_ADMIN"]}>
      <AdminOnly>
        <AdminShell
          title="Users Management"
          subtitle="Invite and delete platform owners."
        >
          <div className="space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
                  Users Management
                </h1>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={onRefresh}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50"
                >
                  <RefreshCcw
                    className={isRefreshing ? "h-4 w-4 animate-spin" : "h-4 w-4"}
                  />
                  Refresh
                </button>

                <button
                  onClick={onOpenInvite}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 px-4 py-2 text-sm font-extrabold text-white shadow-lg transition-all hover:shadow-green-500/25"
                >
                  <Plus className="h-4 w-4" />
                  Invite Owner
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-slate-600">Total</div>
                  <Users className="h-5 w-5 text-slate-400" />
                </div>
                <div className="mt-2 text-3xl font-extrabold text-slate-900">
                  {stats.total}
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
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
              <div className="border-b border-slate-200 bg-slate-50 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-bold text-slate-900">All Owners</div>

                  <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-extrabold text-slate-700">
                    <Users className="h-4 w-4" />
                    {users.length}
                  </div>
                </div>

                <div className="relative mt-4">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    value={q}
                    onChange={(e) => onQChange(e.target.value)}
                    placeholder="Search by name or email..."
                    className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-3 text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-slate-200"
                  />
                </div>
              </div>

              <div className="p-5">
                {loading ? (
                  <div className="animate-pulse space-y-3">
                    <div className="h-14 rounded-2xl bg-slate-200" />
                    <div className="h-14 rounded-2xl bg-slate-200" />
                    <div className="h-14 rounded-2xl bg-slate-200" />
                  </div>
                ) : users.length === 0 ? (
                  <div className="text-slate-600">No owners found.</div>
                ) : (
                  <div className="space-y-3">
                    {users.map((u) => (
                      <div
                        key={u.id}
                        className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition-all hover:shadow-md md:flex-row md:items-center md:justify-between"
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
                                    (u as any).enabled
                                      ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
                                      : "border border-amber-200 bg-amber-50 text-amber-800"
                                  )}
                                >
                                  {(u as any).enabled ? "Enabled" : "Disabled"}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onDelete(u)}
                            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 via-red-600 to-rose-700 px-3 py-2 text-sm font-extrabold text-white shadow-lg transition-all hover:shadow-red-500/25"
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

            {open && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                  <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 p-5">
                    <div className="flex items-start gap-3">
                      <div className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-900 text-white shadow-md">
                        <KeyRound className="h-5 w-5" />
                      </div>

                      <div>
                        <div className="text-xs font-extrabold text-slate-600">
                          INVITE OWNER
                        </div>
                        <div className="text-xl font-extrabold text-slate-900">
                          Invitation Owner
                        </div>
                        <div className="mt-1 text-sm font-semibold text-slate-600">
                          Rôle :{" "}
                          <span className="font-extrabold text-emerald-700">
                            {role}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={onClose}
                      className="rounded-xl border border-slate-200 bg-white p-2 hover:bg-slate-50"
                    >
                      <X className="h-5 w-5 text-slate-700" />
                    </button>
                  </div>

                  <div className="space-y-4 p-5">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div>
                        <div className="text-sm font-semibold text-slate-700">
                          First name
                        </div>
                        <input
                          value={firstName}
                          onChange={(e) => onFirstNameChange(e.target.value)}
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-slate-200"
                        />
                      </div>

                      <div>
                        <div className="text-sm font-semibold text-slate-700">
                          Last name
                        </div>
                        <input
                          value={lastName}
                          onChange={(e) => onLastNameChange(e.target.value)}
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-slate-200"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="text-sm font-semibold text-slate-700">
                        Email
                      </div>
                      <input
                        value={email}
                        onChange={(e) => onEmailChange(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-slate-200"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        onClick={onClose}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                      >
                        <X className="h-4 w-4" />
                        Cancel
                      </button>

                      <button
                        onClick={onSubmit}
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 px-4 py-2 text-sm font-extrabold text-white shadow-lg transition-all hover:shadow-lg"
                      >
                        <Save className="h-4 w-4" />
                        Send Invite
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