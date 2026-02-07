"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Menu,
  X,
  Bell,
  User,
  LogOut,
  ChevronDown,
  Settings,
  LayoutDashboard,
  ShieldCheck,
} from "lucide-react";
import { toast } from "react-toastify";
import { useAuth } from "@/contexts/authContext";

interface NavbarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

function cn(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

/** Click outside hook */
function useClickOutside<T extends HTMLElement>(onOutside: () => void) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const el = ref.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) onOutside();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onOutside]);

  return ref;
}

function roleLabel(role?: string) {
  if (!role) return "User";
  return role.replace("ROLE_", "").replaceAll("_", " ").toLowerCase();
}

function initials(first?: string, last?: string) {
  const a = (first?.[0] || "U").toUpperCase();
  const b = (last?.[0] || "").toUpperCase();
  return a + b;
}

export default function Navbar({ sidebarOpen, setSidebarOpen }: NavbarProps) {
  const { user, logout } = useAuth();
  const router = useRouter();

  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const menuRef = useClickOutside<HTMLDivElement>(() => setMenuOpen(false));
  const notifRef = useClickOutside<HTMLDivElement>(() => setNotifOpen(false));

  const displayName = useMemo(() => {
    const f = user?.firstName?.trim();
    const l = user?.lastName?.trim();
    return [f, l].filter(Boolean).join(" ") || "User";
  }, [user?.firstName, user?.lastName]);

  const badge = useMemo(() => {
    const r = roleLabel(user?.role);
    if (r.includes("admin")) return "bg-violet-50 text-violet-700 border-violet-200";
    if (r.includes("owner")) return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (r.includes("driver")) return "bg-sky-50 text-sky-700 border-sky-200";
    return "bg-slate-50 text-slate-700 border-slate-200";
  }, [user?.role]);

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    toast.success("Logged out successfully");
    router.push("/login");
  };

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-slate-200/60 bg-white/75 backdrop-blur-xl lg:pl-64">
      {/* subtle top glow */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-500/25 to-transparent" />

      <div className="px-3 py-3 lg:px-6 lg:py-4">
        <div className="flex items-center justify-between">
          {/* Left: toggle + brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white/80 p-2.5 text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md focus:outline-none focus:ring-2 focus:ring-sky-500/20 lg:hidden"
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            <div
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => router.push("/dashboard")}
              role="button"
              aria-label="Go to dashboard"
            >
              <div className="relative grid h-10 w-10 place-items-center rounded-2xl bg-slate-900 text-white shadow-sm">
                <span className="text-base font-extrabold">F</span>
                <span className="absolute -right-1 -top-1 h-3 w-3 animate-pulse rounded-full bg-emerald-400" />
              </div>
              <div className="hidden sm:block leading-tight">
                <p className="text-base font-extrabold tracking-tight text-slate-900">
                  FleetIQ
                </p>
                <p className="text-xs font-semibold text-slate-600">
                  Fleet Management • IA • GPS
                </p>
              </div>
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2">
            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => {
                  setNotifOpen((v) => !v);
                  setMenuOpen(false);
                }}
                className="relative inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white/80 p-2.5 text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                aria-label="Notifications"
              >
                <Bell size={18} />
                {/* dot */}
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-emerald-500" />
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-3 w-[320px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                    <p className="text-sm font-extrabold text-slate-900">Notifications</p>
                    <span className="text-xs font-semibold text-slate-500">Aujourd’hui</span>
                  </div>

                  <div className="p-2">
                    {[
                      { t: "Maintenance", d: "2 véhicules à risque élevé détectés.", tag: "Alert" },
                      { t: "Itinéraire", d: "Suggestion IA : -12% km sur la tournée A.", tag: "IA" },
                      { t: "Conformité", d: "Documents conducteur à renouveler.", tag: "Ops" },
                    ].map((n) => (
                      <div
                        key={n.t}
                        className="flex gap-3 rounded-2xl px-3 py-3 transition hover:bg-slate-50"
                      >
                        <div className="mt-0.5 h-2.5 w-2.5 rounded-full bg-sky-500/60" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-extrabold text-slate-900">{n.t}</p>
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-extrabold text-slate-700">
                              {n.tag}
                            </span>
                          </div>
                          <p className="mt-1 text-sm font-semibold text-slate-600">{n.d}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-slate-200 px-4 py-3">
                    <button
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-extrabold text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                      onClick={() => {
                        setNotifOpen(false);
                        router.push("/dashboard");
                      }}
                    >
                      Voir tout
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* User Menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => {
                  setMenuOpen((v) => !v);
                  setNotifOpen(false);
                }}
                className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/80 px-3 py-2 shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                aria-label="User menu"
              >
                <div className="relative grid h-9 w-9 place-items-center rounded-2xl bg-slate-900 text-white">
                  <span className="text-xs font-extrabold">{initials(user?.firstName, user?.lastName)}</span>
                </div>

                <div className="hidden md:block text-left leading-tight">
                  <div className="text-sm font-extrabold text-slate-900">{displayName}</div>
                  <div className="mt-0.5 flex items-center gap-2">
                    <span className={cn("rounded-full border px-2 py-0.5 text-[11px] font-extrabold capitalize", badge)}>
                      {roleLabel(user?.role)}
                    </span>
                  </div>
                </div>

                <ChevronDown
                  size={16}
                  className={cn("text-slate-500 transition", menuOpen && "rotate-180")}
                />
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-3 w-[280px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
                  <div className="border-b border-slate-200 px-4 py-4">
                    <p className="text-sm font-extrabold text-slate-900">{displayName}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-600">{user?.email}</p>
                    <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-700">
                      <ShieldCheck size={14} />
                      Session active
                    </div>
                  </div>

                  <div className="p-2">
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        router.push("/dashboard");
                      }}
                      className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-extrabold text-slate-800 transition hover:bg-slate-50"
                    >
                      <LayoutDashboard size={16} className="text-slate-500" />
                      Dashboard
                    </button>

                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        router.push("/profile");
                      }}
                      className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-extrabold text-slate-800 transition hover:bg-slate-50"
                    >
                      <User size={16} className="text-slate-500" />
                      Profil
                    </button>

                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        router.push("/settings");
                      }}
                      className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-extrabold text-slate-800 transition hover:bg-slate-50"
                    >
                      <Settings size={16} className="text-slate-500" />
                      Paramètres
                    </button>
                  </div>

                  <div className="border-t border-slate-200 p-2">
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-extrabold text-rose-700 transition hover:bg-rose-50"
                    >
                      <LogOut size={16} />
                      Se déconnecter
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
