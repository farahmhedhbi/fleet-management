// src/components/admin/InviteOwnerForm.tsx
"use client";

import { FormEvent, useState } from "react";
import { toast } from "react-toastify";
import { adminService } from "@/lib/services/adminService";

export default function InviteOwnerForm({
  onSuccess,
}: {
  onSuccess?: () => void;
}) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
  });

  const [loading, setLoading] = useState(false);

  const onChange = (key: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await adminService.inviteOwner({
        ...formData,
        role: "ROLE_OWNER",
      });

      toast.success(
        "Invitation envoyée. L'owner recevra un email avec ses identifiants temporaires et devra changer son mot de passe à la première connexion."
      );

      setFormData({
        firstName: "",
        lastName: "",
        email: "",
      });

      onSuccess?.();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Impossible d'inviter cet owner.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <h3 className="text-lg font-extrabold text-slate-900">Inviter un owner</h3>
        <p className="mt-1 text-sm text-slate-600">
          Le compte sera créé puis un email sera envoyé avec mot de passe temporaire.
        </p>
      </div>

      <input
        placeholder="Prénom"
        value={formData.firstName}
        onChange={(e) => onChange("firstName", e.target.value)}
        className="w-full rounded-xl border border-slate-300 px-4 py-3"
      />
      <input
        placeholder="Nom"
        value={formData.lastName}
        onChange={(e) => onChange("lastName", e.target.value)}
        className="w-full rounded-xl border border-slate-300 px-4 py-3"
      />
      <input
        type="email"
        placeholder="Email"
        value={formData.email}
        onChange={(e) => onChange("email", e.target.value)}
        className="w-full rounded-xl border border-slate-300 px-4 py-3"
      />

      <button
        type="submit"
        disabled={loading}
        className="rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
      >
        {loading ? "Envoi..." : "Inviter l'owner"}
      </button>
    </form>
  );
}