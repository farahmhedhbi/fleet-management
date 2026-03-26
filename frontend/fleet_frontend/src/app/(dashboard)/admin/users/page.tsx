"use client";

import { useEffect, useMemo, useState } from "react";
import { adminService } from "@/lib/services/adminService";
import type { User, RoleName, InviteOwnerDTO } from "@/types/user";
import { toastError, toastSuccess } from "@/components/ui/Toast";
import AdminUsersView from "./AdminUsersView";

export const ROLES_EDIT: RoleName[] = ["ROLE_OWNER"];

export function isAdminRole(role?: string) {
  const r = String(role || "").toUpperCase();
  return r === "ROLE_ADMIN" || r.includes("ADMIN");
}

export function roleChip(role?: string) {
  const r = String(role || "");
  if (r.includes("ADMIN")) {
    return "bg-gradient-to-r from-purple-500 via-purple-600 to-pink-600";
  }
  if (r.includes("OWNER")) {
    return "bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600";
  }
  if (r.includes("DRIVER")) {
    return "bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700";
  }
  if (r.includes("API")) {
    return "bg-gradient-to-r from-slate-600 to-slate-800";
  }
  return "bg-gradient-to-r from-slate-500 to-slate-700";
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [q, setQ] = useState("");

  const [open, setOpen] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");

  const role: RoleName = "ROLE_OWNER";

  const visibleUsers = useMemo(() => {
    return (users || []).filter((u) => !isAdminRole(u.role));
  }, [users]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return visibleUsers;

    return visibleUsers.filter((u) =>
      `${u.firstName} ${u.lastName} ${u.email} ${u.role}`
        .toLowerCase()
        .includes(s)
    );
  }, [visibleUsers, q]);

  const stats = useMemo(() => {
    const total = visibleUsers.length;
    const owner = visibleUsers.filter((u) =>
      String(u.role).includes("OWNER")
    ).length;

    return { total, owner };
  }, [visibleUsers]);

  async function loadUsers() {
    setIsRefreshing(true);
    setLoading(true);
    try {
      const data = await adminService.listOwners();
      setUsers(data || []);
    } catch (e: any) {
      toastError(
        e?.response?.data?.error ||
          e?.response?.data?.message ||
          "Erreur chargement users"
      );
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
  }

  function openInvite() {
    resetForm();
    setOpen(true);
  }

  async function submit() {
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      toastError("Le prénom, le nom et l’email sont obligatoires.");
      return;
    }

    try {
      const payload: InviteOwnerDTO = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        role: "ROLE_OWNER",
      };

      const invited = await adminService.inviteOwner(payload);

      if (!isAdminRole(invited?.role)) {
        setUsers((prev) => [invited, ...(prev || [])]);
      }

      toastSuccess(
        "Invitation envoyée. L’owner recevra un email avec un mot de passe temporaire et devra le changer à la première connexion."
      );
      setOpen(false);
      resetForm();
    } catch (e: any) {
      toastError(
        e?.response?.data?.error ||
          e?.response?.data?.message ||
          "Erreur invitation owner"
      );
    }
  }

  async function remove(u: User) {
    if (isAdminRole(u.role)) {
      toastError("Suppression des comptes ADMIN interdite.");
      return;
    }

    const ok = confirm(`Supprimer ${u.firstName} ${u.lastName} (${u.email}) ?`);
    if (!ok) return;

    try {
      await adminService.deleteUser(u.id);
      setUsers((prev) => (prev || []).filter((x) => x.id !== u.id));
      toastSuccess("Utilisateur supprimé.");
    } catch (e: any) {
      toastError(
        e?.response?.data?.error ||
          e?.response?.data?.message ||
          "Erreur delete user"
      );
    }
  }

  return (
    <AdminUsersView
      users={filtered}
      loading={loading}
      isRefreshing={isRefreshing}
      q={q}
      open={open}
      firstName={firstName}
      lastName={lastName}
      email={email}
      role={role}
      stats={stats}
      onQChange={setQ}
      onFirstNameChange={setFirstName}
      onLastNameChange={setLastName}
      onEmailChange={setEmail}
      onOpenInvite={openInvite}
      onClose={() => setOpen(false)}
      onSubmit={submit}
      onDelete={remove}
      onRefresh={loadUsers}
    />
  );
}