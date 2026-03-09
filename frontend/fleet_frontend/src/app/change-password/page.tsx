// src/app/change-password/page.tsx
"use client";

import { FormEvent, useState } from "react";
import { toast } from "react-toastify";
import { useAuth } from "@/contexts/authContext";
import { Eye, EyeOff, Lock, ShieldCheck } from "lucide-react";

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

    if (newPassword !== confirm) {
      setError("La confirmation du mot de passe est incorrecte.");
      return;
    }

    setLoading(true);
    try {
      const result = await changePassword(oldPassword, newPassword);

      if (!result.success) {
        const message = result.message || "Erreur lors du changement du mot de passe.";
        setError(message);
        toast.error(message);
        return;
      }

      const successMessage = result.message || "Mot de passe changé avec succès.";
      setMsg(successMessage);
      toast.success(successMessage);

      await refreshMe();

      setTimeout(() => {
        logout("/login");
      }, 1200);
    } catch (e: any) {
      const message =
        e?.response?.data?.message || "Erreur lors du changement du mot de passe.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-100">
            <ShieldCheck className="h-7 w-7 text-sky-700" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Changement obligatoire du mot de passe
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Pour sécuriser votre compte, vous devez définir un nouveau mot de passe avant de continuer.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <PasswordField
            label="Mot de passe actuel"
            value={oldPassword}
            setValue={setOldPassword}
            show={showOld}
            setShow={setShowOld}
          />

          <PasswordField
            label="Nouveau mot de passe"
            value={newPassword}
            setValue={setNewPassword}
            show={showNew}
            setShow={setShowNew}
          />

          <PasswordField
            label="Confirmer le nouveau mot de passe"
            value={confirm}
            setValue={setConfirm}
            show={showConfirm}
            setShow={setShowConfirm}
          />

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {msg && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {msg}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Mise à jour..." : "Changer le mot de passe"}
          </button>
        </form>
      </div>
    </div>
  );
}

function PasswordField({
  label,
  value,
  setValue,
  show,
  setShow,
}: {
  label: string;
  value: string;
  setValue: (v: string) => void;
  show: boolean;
  setShow: (v: boolean) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-semibold text-slate-700">{label}</label>
      <div className="relative">
        <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-11 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}