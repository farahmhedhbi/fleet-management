"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authService } from "@/lib/services/authService";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);

  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setError(null);

    if (!token) {
      setError("Token manquant dans l'URL.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Mot de passe trop court (min 6).");
      return;
    }
    if (newPassword !== confirm) {
      setError("Confirmation mot de passe incorrecte.");
      return;
    }

    setLoading(true);
    try {
      const res = await authService.resetPassword(token, newPassword);
      setMsg(res?.message ?? "Mot de passe réinitialisé.");
      setTimeout(() => router.push("/login"), 1200);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Token invalide ou expiré.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border bg-white p-6 shadow">
        <h1 className="text-2xl font-semibold">Réinitialiser mot de passe</h1>
        <p className="mt-2 text-sm text-gray-600">
          Entrez un nouveau mot de passe. Le lien peut expirer.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium">Nouveau mot de passe</label>
            <input
              type="password"
              className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:ring"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Confirmer</label>
            <input
              type="password"
              className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:ring"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          {msg && <div className="rounded-xl bg-green-50 p-3 text-sm text-green-700">{msg}</div>}
          {error && <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-black px-4 py-2 text-white disabled:opacity-60"
          >
            {loading ? "Validation..." : "Confirmer"}
          </button>

          <button
            type="button"
            onClick={() => router.push("/login")}
            className="w-full rounded-xl border px-4 py-2"
          >
            Retour login
          </button>
        </form>
      </div>
    </div>
  );
}
