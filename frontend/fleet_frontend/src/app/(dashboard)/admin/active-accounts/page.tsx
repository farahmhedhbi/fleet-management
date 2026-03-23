"use client";

import { useEffect, useMemo, useState } from "react";
import { adminUsersService, AdminUser } from "@/lib/services/adminUsersService";
import { toastError, toastSuccess } from "@/components/ui/Toast";
import ActiveAccountsView from "./ActiveAccountsView";

export function formatDate(iso?: string | null) {
  if (!iso) return "Jamais connecté";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Date invalide";
  return d.toLocaleString();
}

export function roleBadge(role?: string) {
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
    <ActiveAccountsView
      filter={filter}
      loading={loading}
      users={users}
      busyId={busyId}
      isRefreshing={isRefreshing}
      stats={stats}
      onFilterChange={setFilter}
      onRefresh={load}
      onToggleEnabled={toggleEnabled}
    />
  );
}