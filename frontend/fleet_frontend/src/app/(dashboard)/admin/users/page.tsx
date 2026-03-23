"use client";

import { useEffect, useMemo, useState } from "react";
import { adminService } from "@/lib/services/adminService";
import type { User, RoleName, InviteOwnerDTO, UpdateUserDTO } from "@/types/user";
import { toastError, toastSuccess } from "@/components/ui/Toast";
import AdminUsersView from "./AdminUsersView";

export const ROLES_EDIT: RoleName[] = [
  "ROLE_OWNER",
  "ROLE_DRIVER",
  "ROLE_API_CLIENT",
];

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
  const [mode, setMode] = useState<"invite" | "edit">("invite");
  const [editing, setEditing] = useState<User | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");

  const [role, setRole] = useState<RoleName>("ROLE_OWNER");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const isInvite = mode === "invite";
  const effectiveRole: RoleName = isInvite ? "ROLE_OWNER" : role;
  const isDriver = effectiveRole === "ROLE_DRIVER";

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
    setRole("ROLE_OWNER");
    setLicenseNumber("");
    setNewPassword("");
    setEditing(null);
  }

  function openInvite() {
    resetForm();
    setMode("invite");
    setRole("ROLE_OWNER");
    setOpen(true);
  }

  function openEdit(u: User) {
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
    setLicenseNumber((u as any).licenseNumber || "");
    setOpen(true);
  }

  async function submit() {
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      toastError("Le prénom, le nom et l’email sont obligatoires.");
      return;
    }

    if (!isInvite && isDriver && !licenseNumber.trim()) {
      toastError("Le numéro de permis est obligatoire pour un conducteur.");
      return;
    }

    try {
      if (mode === "invite") {
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
        return;
      }

      if (mode === "edit" && editing) {
        if (isAdminRole(effectiveRole)) {
          toastError("Impossible de définir ROLE_ADMIN depuis cette page.");
          return;
        }

        const payload: UpdateUserDTO = {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim().toLowerCase(),
          role: effectiveRole,
          ...(newPassword.trim() ? { password: newPassword.trim() } : {}),
          ...(isDriver ? { licenseNumber: licenseNumber.trim() } : {}),
        };

        const updated = await adminService.updateUser(editing.id, payload);

        if (isAdminRole(updated?.role)) {
          setUsers((prev) => (prev || []).filter((x) => x.id !== editing.id));
        } else {
          setUsers((prev) =>
            (prev || []).map((x) =>
              x.id === updated.id ? { ...x, ...updated } : x
            )
          );
        }

        toastSuccess("Utilisateur mis à jour avec succès.");
        setOpen(false);
      }
    } catch (e: any) {
      toastError(
        e?.response?.data?.error ||
          e?.response?.data?.message ||
          "Erreur save user"
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
      mode={mode}
      editing={editing}
      firstName={firstName}
      lastName={lastName}
      email={email}
      role={role}
      licenseNumber={licenseNumber}
      newPassword={newPassword}
      stats={stats}
      isInvite={isInvite}
      effectiveRole={effectiveRole}
      isDriver={isDriver}
      onQChange={setQ}
      onFirstNameChange={setFirstName}
      onLastNameChange={setLastName}
      onEmailChange={setEmail}
      onRoleChange={setRole}
      onLicenseNumberChange={setLicenseNumber}
      onNewPasswordChange={setNewPassword}
      onOpenInvite={openInvite}
      onOpenEdit={openEdit}
      onClose={() => setOpen(false)}
      onSubmit={submit}
      onDelete={remove}
      onRefresh={loadUsers}
    />
  );
}