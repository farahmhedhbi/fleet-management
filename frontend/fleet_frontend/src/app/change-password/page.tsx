// src/app/change-password/page.tsx
"use client";

import { FormEvent, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { useAuth } from "@/contexts/authContext";
import {
  Eye,
  EyeOff,
  Lock,
  ShieldCheck,
  KeyRound,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

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
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-sky-50 px-4 py-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)] lg:grid-cols-2">
          {/* Bloc gauche */}
          <div className="flex items-center bg-slate-950 px-8 py-10 text-white sm:px-10 lg:px-12">
            <div className="w-full">
              <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15 backdrop-blur">
                <ShieldCheck className="h-8 w-8 text-sky-300" />
              </div>

              <h1 className="max-w-md text-3xl font-extrabold leading-tight sm:text-4xl">
                Changement obligatoire du mot de passe
              </h1>

              <p className="mt-4 max-w-lg text-sm leading-7 text-slate-300 sm:text-base">
                Pour renforcer la sécurité de votre compte, veuillez définir un
                nouveau mot de passe avant de continuer à utiliser l’application.
              </p>

              <div className="mt-8 space-y-4">
                <InfoItem
                  icon={<KeyRound className="h-5 w-5 text-sky-300" />}
                  title="Compte sécurisé"
                  text="Choisissez un mot de passe fort et facile à retenir pour vous."
                />
                <InfoItem
                  icon={<ShieldCheck className="h-5 w-5 text-emerald-300" />}
                  title="Accès protégé"
                  text="Après validation, votre session sera actualisée puis vous serez redirigé vers la connexion."
                />
              </div>
            </div>
          </div>

          {/* Bloc droit */}
          <div className="px-6 py-8 sm:px-8 sm:py-10 lg:px-10">
            <div className="mx-auto w-full max-w-md">
              <div className="mb-8">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                  <ShieldCheck className="h-4 w-4" />
                  Mise à jour de sécurité
                </div>

                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                  Définir un nouveau mot de passe
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Remplissez les champs ci-dessous pour finaliser la mise à jour
                  de votre mot de passe.
                </p>
              </div>

              <form onSubmit={onSubmit} className="space-y-5">
                <PasswordField
                  label="Mot de passe actuel"
                  placeholder="Saisir votre mot de passe actuel"
                  value={oldPassword}
                  setValue={setOldPassword}
                  show={showOld}
                  setShow={setShowOld}
                />

                <PasswordField
                  label="Nouveau mot de passe"
                  placeholder="Saisir le nouveau mot de passe"
                  value={newPassword}
                  setValue={setNewPassword}
                  show={showNew}
                  setShow={setShowNew}
                />

                <PasswordField
                  label="Confirmer le nouveau mot de passe"
                  placeholder="Confirmer le nouveau mot de passe"
                  value={confirm}
                  setValue={setConfirm}
                  show={showConfirm}
                  setShow={setShowConfirm}
                />

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="mb-3 text-sm font-semibold text-slate-800">
                    Exigences du mot de passe
                  </p>

                  <div className="space-y-2">
                    {passwordChecks.map((item) => (
                      <div
                        key={item.label}
                        className="flex items-center gap-2 text-sm"
                      >
                        <CheckCircle2
                          className={`h-4 w-4 ${
                            item.valid ? "text-emerald-600" : "text-slate-300"
                          }`}
                        />
                        <span
                          className={
                            item.valid ? "text-slate-800" : "text-slate-500"
                          }
                        >
                          {item.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {error && (
                  <AlertBox type="error" message={error} />
                )}

                {msg && (
                  <AlertBox type="success" message={msg} />
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-900 px-4 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Mise à jour..." : "Changer le mot de passe"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PasswordField({
  label,
  placeholder,
  value,
  setValue,
  show,
  setShow,
}: {
  label: string;
  placeholder?: string;
  value: string;
  setValue: (v: string) => void;
  show: boolean;
  setShow: (v: boolean) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-800">
        {label}
      </label>

      <div className="group relative">
        <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition group-focus-within:text-sky-600" />

        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-2xl border border-slate-300 bg-white py-3.5 pl-11 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
        />

        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-800"
          aria-label={show ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

function AlertBox({
  type,
  message,
}: {
  type: "error" | "success";
  message: string;
}) {
  const isError = type === "error";

  return (
    <div
      className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm ${
        isError
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-emerald-200 bg-emerald-50 text-emerald-700"
      }`}
    >
      {isError ? (
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      ) : (
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
      )}
      <span>{message}</span>
    </div>
  );
}

function InfoItem({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div>
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="mt-1 text-sm leading-6 text-slate-300">{text}</p>
      </div>
    </div>
  );
}