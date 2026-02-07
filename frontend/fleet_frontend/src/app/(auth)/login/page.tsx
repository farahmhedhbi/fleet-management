"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-toastify";
import {
  Eye,
  EyeOff,
  LogIn,
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  MapPin,
} from "lucide-react";
import { useAuth } from "@/contexts/authContext";

function cn(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

function StatPill({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur">
      <span className="text-slate-900">{icon}</span>
      <span>{label}</span>
    </div>
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState("admin@fleet.com");
  const [password, setPassword] = useState("admin123");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const router = useRouter();

  const testAccounts = useMemo(
    () => [
      { role: "Admin", email: "admin@fleet.com", pass: "admin123", color: "text-sky-700", chip: "bg-sky-50 border-sky-200" },
      { role: "Owner", email: "owner@fleet.com", pass: "owner123", color: "text-emerald-700", chip: "bg-emerald-50 border-emerald-200" },
      { role: "Driver", email: "driver@fleet.com", pass: "driver123", color: "text-violet-700", chip: "bg-violet-50 border-violet-200" },
    ],
    []
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const result = await login({ email, password });
      if (result.success) {
        toast.success("Login successful!");
        router.push("/dashboard");
      } else {
        toast.error(result.message || "Invalid credentials");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(error?.message || "An error occurred during login");
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
        {/* LEFT: Brand / Benefits */}
        <div className="order-2 lg:order-1">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="relative grid h-12 w-12 place-items-center rounded-2xl bg-slate-900 text-white shadow-lg">
              <span className="text-lg">🚘</span>
              <span className="absolute -right-1 -top-1 h-3 w-3 animate-pulse rounded-full bg-emerald-400" />
            </div>
            <div className="leading-tight">
              <p className="text-lg font-extrabold tracking-tight text-slate-900">FleetIQ</p>
              <p className="text-sm font-semibold text-slate-600">Gestion de flottes • IA • GPS</p>
            </div>
          </Link>

          <h1 className="mt-8 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            Connectez-vous à votre{" "}
            <span className="bg-gradient-to-r from-sky-600 via-indigo-600 to-emerald-600 bg-clip-text text-transparent">
              cockpit automobile
            </span>
          </h1>

          <p className="mt-4 max-w-xl text-lg leading-relaxed text-slate-600">
            Accédez aux missions, suivi GPS, maintenance prédictive et KPI — dans une interface claire et moderne.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <StatPill icon={<ShieldCheck className="h-4 w-4" />} label="Accès sécurisé" />
            <StatPill icon={<MapPin className="h-4 w-4" />} label="Tracking temps réel" />
            <StatPill icon={<Sparkles className="h-4 w-4" />} label="Insights IA" />
          </div>

          <div className="mt-10 rounded-[28px] border border-slate-200 bg-white/70 p-5 shadow-sm backdrop-blur">
            <p className="text-sm font-extrabold text-slate-900">Comptes de test</p>
            <p className="mt-1 text-sm text-slate-600">
              Cliquez pour remplir automatiquement le formulaire.
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {testAccounts.map((a) => (
                <button
                  key={a.role}
                  type="button"
                  onClick={() => {
                    setEmail(a.email);
                    setPassword(a.pass);
                    toast.info(`Loaded ${a.role} account`);
                  }}
                  className={cn(
                    "group rounded-2xl border px-4 py-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md",
                    a.chip
                  )}
                >
                  <p className={cn("text-sm font-extrabold", a.color)}>{a.role}</p>
                  <p className="mt-1 truncate text-xs font-semibold text-slate-600">{a.email}</p>
                  <div className="mt-2 inline-flex items-center gap-2 text-xs font-semibold text-slate-700">
                    <span className="rounded-full bg-white/70 px-2 py-1">••••••</span>
                    <span className="opacity-70 transition group-hover:translate-x-0.5">→</span>
                  </div>
                </button>
              ))}
            </div>

            <p className="mt-4 text-xs text-slate-500">
              Ces comptes sont créés automatiquement quand le backend démarre.
            </p>
          </div>
        </div>

        {/* RIGHT: Card */}
        <div className="order-1 lg:order-2">
          <div className="relative mx-auto w-full max-w-md">
            <div className="absolute -inset-6 -z-10 rounded-[40px] bg-gradient-to-br from-sky-200/40 via-white to-emerald-200/40 blur-2xl" />

            <div className="rounded-[32px] border border-slate-200 bg-white/85 p-7 shadow-xl backdrop-blur sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-600">Bienvenue</p>
                  <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">
                    Se connecter
                  </h2>
                  <p className="mt-2 text-sm text-slate-600">
                    Accédez à votre espace FleetIQ.
                  </p>
                </div>

                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-900 text-white shadow-md">
                  <LogIn className="h-5 w-5" />
                </div>
              </div>

              <form onSubmit={handleSubmit} className="mt-7 space-y-5">
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

                {/* Password */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="block text-sm font-semibold text-slate-700">
                      Mot de passe
                    </label>
                    <Link
                      href="/forgot-password"
                      className="text-sm font-semibold text-sky-700 hover:text-sky-900"
                    >
                      Mot de passe oublié ?
                    </Link>
                  </div>

                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-12 py-3.5 pr-12 text-base font-semibold text-slate-900 shadow-sm outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-sky-500/20"
                      placeholder="Votre mot de passe"
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                {/* Remember */}
                <div className="flex items-center justify-between">
                  <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900/20"
                    />
                    Rester connecté
                  </label>

                  <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-700">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Secure
                  </div>
                </div>

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
                        Connexion...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        Se connecter <ArrowRight className="h-5 w-5 transition group-hover:translate-x-0.5" />
                      </span>
                    )}
                  </span>
                </button>
              </form>

              <div className="mt-7 text-center">
                <p className="text-sm font-semibold text-slate-600">
                  Pas de compte ?{" "}
                  <Link href="/register" className="font-extrabold text-sky-700 hover:text-sky-900">
                    Créer un compte
                  </Link>
                </p>
              </div>

              <div className="mt-7 border-t border-slate-200 pt-6">
                <p className="text-center text-xs text-slate-500">
                  En vous connectant, vous acceptez nos{" "}
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
