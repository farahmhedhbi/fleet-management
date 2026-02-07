"use client";

import { useState, FormEvent, ChangeEvent, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { toast } from "react-toastify";
import {
  UserPlus,
  Eye,
  EyeOff,
  Mail,
  Lock,
  Phone,
  User,
  BadgeCheck,
  ArrowRight,
  Car,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { RegisterRequest } from "@/types/auth";
import { useAuth } from "@/contexts/authContext";

function cn(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

function Pill({
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

function InputShell({
  label,
  required,
  children,
  hint,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label} {required ? <span className="text-rose-600">*</span> : null}
      </label>
      {children}
      {hint ? <p className="mt-2 text-xs font-semibold text-slate-500">{hint}</p> : null}
    </div>
  );
}

export default function RegisterPage() {
  const [formData, setFormData] = useState<RegisterRequest>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
    role: "DRIVER",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const router = useRouter();

  const roles = useMemo(
    () => [
      { value: "DRIVER", label: "Driver", desc: "Accès missions & suivi", badge: "bg-sky-50 border-sky-200 text-sky-700" },
      { value: "OWNER", label: "Owner", desc: "Vue flotte & reporting", badge: "bg-emerald-50 border-emerald-200 text-emerald-700" },
      { value: "ADMIN", label: "Admin", desc: "Gestion complète", badge: "bg-violet-50 border-violet-200 text-violet-700" },
    ],
    []
  );

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const result = await register(formData);
      if (result.success) {
        toast.success("Registration successful!");
        router.push("/dashboard");
      } else {
        toast.error(result.message || "Registration failed");
      }
    } catch (error) {
      toast.error("An error occurred during registration");
    } finally {
      setLoading(false);
    }
  };

  const selectedRole = roles.find((r) => r.value === formData.role);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(1200px_700px_at_20%_10%,rgba(56,189,248,0.18),transparent_60%),radial-gradient(900px_650px_at_85%_85%,rgba(16,185,129,0.14),transparent_60%),linear-gradient(to_bottom,#f8fafc,white,#f8fafc)]">
      {/* Subtle grid */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.16] [background-image:linear-gradient(to_right,rgba(15,23,42,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.07)_1px,transparent_1px)] [background-size:64px_64px]" />
      {/* Glows */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-gradient-to-br from-sky-300/30 via-white to-emerald-300/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 right-[-120px] h-[520px] w-[520px] rounded-full bg-gradient-to-br from-emerald-300/25 to-sky-300/20 blur-3xl" />

      <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:gap-12 lg:px-8 lg:py-16">
        {/* LEFT: Brand + benefits */}
        <div className="order-2 lg:order-1">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="relative grid h-12 w-12 place-items-center rounded-2xl bg-slate-900 text-white shadow-lg">
              <Car className="h-5 w-5" />
              <span className="absolute -right-1 -top-1 h-3 w-3 animate-pulse rounded-full bg-emerald-400" />
            </div>
            <div className="leading-tight">
              <p className="text-lg font-extrabold tracking-tight text-slate-900">FleetIQ</p>
              <p className="text-sm font-semibold text-slate-600">Automobile • IA • GPS</p>
            </div>
          </Link>

          <h1 className="mt-8 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            Créez votre compte{" "}
            <span className="bg-gradient-to-r from-sky-600 via-indigo-600 to-emerald-600 bg-clip-text text-transparent">
              FleetIQ
            </span>
          </h1>

          <p className="mt-4 max-w-xl text-lg leading-relaxed text-slate-600">
            Accédez au suivi, aux missions, aux alertes et au pilotage KPI. Une expérience moderne orientée flotte.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Pill icon={<ShieldCheck className="h-4 w-4" />} label="Sécurité & rôles" />
            <Pill icon={<Sparkles className="h-4 w-4" />} label="Expérience premium" />
            <Pill icon={<BadgeCheck className="h-4 w-4" />} label="Onboarding rapide" />
          </div>

          <div className="mt-10 rounded-[28px] border border-slate-200 bg-white/70 p-5 shadow-sm backdrop-blur">
            <p className="text-sm font-extrabold text-slate-900">Rôle sélectionné</p>
            <p className="mt-2 text-sm text-slate-600">
              Choisissez un rôle adapté à l’utilisation.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className={cn("inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-extrabold", selectedRole?.badge)}>
                <span className="h-2 w-2 rounded-full bg-current opacity-70" />
                {selectedRole?.label}
              </span>
              <span className="text-sm font-semibold text-slate-700">
                {selectedRole?.desc}
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT: Register Card */}
        <div className="order-1 lg:order-2">
          <div className="relative mx-auto w-full max-w-xl">
            <div className="absolute -inset-6 -z-10 rounded-[40px] bg-gradient-to-br from-sky-200/40 via-white to-emerald-200/40 blur-2xl" />

            <div className="rounded-[32px] border border-slate-200 bg-white/85 p-7 shadow-xl backdrop-blur sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-600">Inscription</p>
                  <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">
                    Créer un compte
                  </h2>
                  <p className="mt-2 text-sm text-slate-600">
                    Remplissez les informations ci-dessous.
                  </p>
                </div>

                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-900 text-white shadow-md">
                  <UserPlus className="h-5 w-5" />
                </div>
              </div>

              <form onSubmit={handleSubmit} className="mt-7 space-y-5">
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <InputShell label="First Name" required>
                    <div className="relative">
                      <User className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-12 py-3.5 text-base font-semibold text-slate-900 shadow-sm outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-sky-500/20"
                        placeholder="Votre prénom"
                        required
                      />
                    </div>
                  </InputShell>

                  <InputShell label="Last Name" required>
                    <div className="relative">
                      <User className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-12 py-3.5 text-base font-semibold text-slate-900 shadow-sm outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-sky-500/20"
                        placeholder="Votre nom"
                        required
                      />
                    </div>
                  </InputShell>
                </div>

                <InputShell label="Email" required>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-12 py-3.5 text-base font-semibold text-slate-900 shadow-sm outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-sky-500/20"
                      placeholder="ex: name@company.com"
                      autoComplete="email"
                      required
                    />
                  </div>
                </InputShell>

                <InputShell label="Password" required hint="Minimum 6 characters">
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-12 py-3.5 pr-12 text-base font-semibold text-slate-900 shadow-sm outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-sky-500/20"
                      placeholder="Votre mot de passe"
                      minLength={6}
                      autoComplete="new-password"
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
                </InputShell>

                <InputShell label="Phone">
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-12 py-3.5 text-base font-semibold text-slate-900 shadow-sm outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-sky-500/20"
                      placeholder="+216 xx xxx xxx"
                      autoComplete="tel"
                    />
                  </div>
                </InputShell>

                <InputShell label="Role" required>
                  <div className="relative">
                    <BadgeCheck className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      className="w-full appearance-none rounded-2xl border border-slate-200 bg-white px-12 py-3.5 text-base font-semibold text-slate-900 shadow-sm outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-sky-500/20"
                    >
                      <option value="DRIVER">Driver</option>
                      <option value="OWNER">Owner</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                      ▼
                    </span>
                  </div>
                </InputShell>

                <label className="inline-flex items-start gap-3 rounded-2xl border border-slate-200 bg-white/70 p-4 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900/20"
                    required
                  />
                  <span>
                    J’accepte les{" "}
                    <Link href="/terms" className="font-extrabold text-sky-700 hover:text-sky-900">
                      Conditions
                    </Link>{" "}
                    et la{" "}
                    <Link href="/privacy" className="font-extrabold text-sky-700 hover:text-sky-900">
                      Politique de confidentialité
                    </Link>
                    .
                  </span>
                </label>

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
                        Création...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        Créer un compte <ArrowRight className="h-5 w-5 transition group-hover:translate-x-0.5" />
                      </span>
                    )}
                  </span>
                </button>
              </form>

              <div className="mt-7 text-center">
                <p className="text-sm font-semibold text-slate-600">
                  Déjà un compte ?{" "}
                  <Link href="/login" className="font-extrabold text-sky-700 hover:text-sky-900">
                    Se connecter
                  </Link>
                </p>
              </div>

              <div className="mt-7 border-t border-slate-200 pt-6">
                <p className="text-center text-xs text-slate-500">
                  © {new Date().getFullYear()} FleetIQ • Automobile & Fleet Intelligence
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
