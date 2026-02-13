"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/lib/services/authService";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setError(null);

    if (!email.trim()) {
      setError("Email obligatoire.");
      return;
    }

    setLoading(true);
    try {
      const res = await authService.forgotPassword(email.trim());
      setMsg(res?.message ?? "Si l'email existe, un lien a été envoyé.");
      // option: rediriger vers login après 2s
      //setTimeout(() => router.push("/login"), 1200);
      console.log("forgotPassword response:", res);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Erreur lors de l'envoi du lien.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border bg-white p-6 shadow">
        <h1 className="text-2xl font-semibold">Mot de passe oublié</h1>
        <p className="mt-2 text-sm text-gray-600">
          Entrez votre email. Si le compte existe, on vous envoie un lien de réinitialisation.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium">Email</label>
            <input
              type="email"
              className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:ring"
              placeholder="ex: user@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          {msg && <div className="rounded-xl bg-green-50 p-3 text-sm text-green-700">{msg}</div>}
          {error && <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-black px-4 py-2 text-white disabled:opacity-60"
          >
            {loading ? "Envoi..." : "Envoyer le lien"}
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
