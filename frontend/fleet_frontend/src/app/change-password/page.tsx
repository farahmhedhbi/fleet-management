"use client";

import { FormEvent, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { useAuth } from "@/contexts/authContext";
import ChangePasswordView from "./ChangePasswordView";

export default function ChangePasswordPage() {
  const { changePassword, logout, refreshMe } = useAuth();

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const passwordChecks = useMemo(
    () => [
      {
        label: "Au moins 8 caractères",
        valid: newPassword.length >= 8,
      },
      {
        label: "Le mot de passe de confirmation correspond",
        valid: confirm.length > 0 && newPassword === confirm,
      },
      {
        label: "Différent de l'ancien mot de passe",
        valid: !!newPassword && newPassword !== oldPassword,
      },
    ],
    [newPassword, confirm, oldPassword]
  );

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setError(null);

    if (!oldPassword || !newPassword || !confirm) {
      setError("Tous les champs sont obligatoires.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Le nouveau mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    if (newPassword === oldPassword) {
      setError("Le nouveau mot de passe doit être différent de l'ancien.");
      return;
    }

    if (newPassword !== confirm) {
      setError("La confirmation du mot de passe est incorrecte.");
      return;
    }

    setLoading(true);
    try {
      const result = await changePassword(oldPassword, newPassword);

      if (!result.success) {
        const message =
          result.message || "Erreur lors du changement du mot de passe.";
        setError(message);
        toast.error(message);
        return;
      }

      const successMessage =
        result.message || "Mot de passe changé avec succès.";
      setMsg(successMessage);
      toast.success(successMessage);

      await refreshMe();

      setTimeout(() => {
        logout("/login");
      }, 1200);
    } catch (e: any) {
      const message =
        e?.response?.data?.message ||
        "Erreur lors du changement du mot de passe.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ChangePasswordView
      oldPassword={oldPassword}
      newPassword={newPassword}
      confirm={confirm}
      showOld={showOld}
      showNew={showNew}
      showConfirm={showConfirm}
      loading={loading}
      msg={msg}
      error={error}
      passwordChecks={passwordChecks}
      setOldPassword={setOldPassword}
      setNewPassword={setNewPassword}
      setConfirm={setConfirm}
      setShowOld={setShowOld}
      setShowNew={setShowNew}
      setShowConfirm={setShowConfirm}
      onSubmit={onSubmit}
    />
  );
}