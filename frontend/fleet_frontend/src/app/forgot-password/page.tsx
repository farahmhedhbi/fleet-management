"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-toastify";
import { authService } from "@/lib/services/authService";
import {
  Mail,
  KeyRound,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  MapPin,
  LogIn,
} from "lucide-react";

function cn(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

function StatPill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur">
      <span className="text-slate-900">{icon}</span>
      <span>{label}</span>
    </div>
  );
}

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
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
      const m = res?.message ?? "Si l'email existe, un lien a été envoyé.";
      setMsg(m);
      toast.success(m);
      // Option: auto-redirect to login
      // setTimeout(() => router.push("/login"), 1200);
    } catch (e: any) {
      const m = e?.response?.data?.message || "Erreur lors de l'envoi du lien.";
      setError(m);
      toast.error(m);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(1200px_700px_at_20%_10%,rgba(56,189,248,0.18),transparent_60%),radial-gradient(900px_650px_at_85%_85%,rgba(16,185,129,0.14),transparent_60%),linear-gradient(to_bottom,#f8fafc,white,#f8fafc)]">
      {/* Subtle grid */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.16] [background-image:linear-gradient(to_right,rgba(15,23,42,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.07)_1px,transparent_1px)] [background-size:64px_64px]" />

      {/* Glow blobs */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-gradient-to-br from-sky-300/30 via-white to-emerald-300/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 right-[-120px] h-[520px] w-[520px] rounded-full bg-gradient-to-br from-emerald-300/25 to-sky-300/20 blur-3xl" />

      <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:gap-12 lg:px-8 lg:py-16">
        {/* LEFT: Brand / Benefits (same as Login/Register) */}
        <div className="order-2 lg:order-1">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="relative grid h-12 w-12 place-items-center rounded-2xl bg-slate-900 text-white shadow-lg">
              <span className="text-lg">🚘</span>
              <span className="absolute -right-1 -top-1 h-3 w-3 animate-pulse rounded-full bg-emerald-400" />
            </div>
            <div className="leading-tight">
              <p className="text-lg font-extrabold tracking-tight text-slate-900">
                FleetIQ
              </p>
              <p className="text-sm font-semibold text-slate-600">
                Gestion de flottes • IA • GPS
              </p>
            </div>
          </Link>

          <h1 className="mt-8 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            Récupérez votre{" "}
            <span className="bg-gradient-to-r from-sky-600 via-indigo-600 to-emerald-600 bg-clip-text text-transparent">
              compte
            </span>
          </h1>

          <p className="mt-4 max-w-xl text-lg leading-relaxed text-slate-600">
            Entrez votre email. Si le compte existe, un lien de réinitialisation
            vous sera envoyé.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <StatPill icon={<ShieldCheck className="h-4 w-4" />} label="Accès sécurisé" />
            <StatPill icon={<MapPin className="h-4 w-4" />} label="Tracking temps réel" />
            <StatPill icon={<Sparkles className="h-4 w-4" />} label="Insights IA" />
          </div>

          <div className="mt-10 rounded-[28px] border border-slate-200 bg-white/70 p-5 shadow-sm backdrop-blur">
            <p className="text-sm font-extrabold text-slate-900">Conseil</p>
            <p className="mt-1 text-sm text-slate-600">
              Vérifiez aussi <span className="font-extrabold">Spam</span> si
              vous ne recevez rien.
            </p>
          </div>
        </div>

        {/* RIGHT: Card (same style) */}
        <div className="order-1 lg:order-2">
          <div className="relative mx-auto w-full max-w-md">
            <div className="absolute -inset-6 -z-10 rounded-[40px] bg-gradient-to-br from-sky-200/40 via-white to-emerald-200/40 blur-2xl" />

            <div className="rounded-[32px] border border-slate-200 bg-white/85 p-7 shadow-xl backdrop-blur sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-600">
                    Réinitialisation
                  </p>
                  <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">
                    Mot de passe oublié
                  </h2>
                  <p className="mt-2 text-sm text-slate-600">
                    Nous vous envoyons un lien pour créer un nouveau mot de passe.
                  </p>
                </div>

                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-900 text-white shadow-md">
                  <KeyRound className="h-5 w-5" />
                </div>
              </div>

              <form onSubmit={onSubmit} className="mt-7 space-y-5">
                {/* Email */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-12 py-3.5 text-base font-semibold text-slate-900 shadow-sm outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-sky-500/20"
                      placeholder="ex: admin@fleet.com"
                      autoComplete="email"
                      required
                    />
                  </div>
                </div>

                {msg && (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-sm font-semibold text-emerald-800">
                    {msg}
                  </div>
                )}
                {error && (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-4 text-sm font-semibold text-rose-700">
                    {error}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-slate-900 px-6 py-4 text-base font-extrabold text-white shadow-[0_14px_40px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_50px_rgba(15,23,42,0.22)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-gradient-to-r from-emerald-500 to-sky-500" />
                  <span className="relative">
                    {loading ? (
                      <span className="flex items-center justify-center gap-3">
                        <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Envoi...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        Envoyer le lien{" "}
                        <ArrowRight className="h-5 w-5 transition group-hover:translate-x-0.5" />
                      </span>
                    )}
                  </span>
                </button>

                {/* Back to login */}
                <button
                  type="button"
                  onClick={() => router.push("/login")}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-extrabold text-slate-800 shadow-sm transition hover:bg-slate-50"
                >
                  <LogIn className="h-4 w-4" />
                  Retour login
                </button>
              </form>

              <div className="mt-7 border-t border-slate-200 pt-6">
                <p className="text-center text-xs text-slate-500">
                  En continuant, vous acceptez nos{" "}
                  <Link href="/terms" className="font-semibold text-slate-700 hover:text-slate-900">
                    Conditions
                  </Link>{" "}
                  et notre{" "}
                  <Link href="/privacy" className="font-semibold text-slate-700 hover:text-slate-900">
                    Politique de confidentialité
                  </Link>
                  .
                </p>
              </div>
            </div>

            {/* Tiny footer */}
            <div className="mt-4 text-center text-xs font-semibold text-slate-500">
              © {new Date().getFullYear()} FleetIQ • Automobile & Fleet Intelligence
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
