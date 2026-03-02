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
  Check,
} from "lucide-react";
import { toast } from "react-toastify";
import { useAuth } from "@/contexts/authContext";
import { notificationService } from "@/lib/services/notificationService";
import type { Notification } from "@/types/notification";

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

/**
 * ✅ Robust roleName extraction:
 * supports:
 * - user.role = "ROLE_OWNER"
 * - user.roleName = "ROLE_OWNER"
 * - user.role = { name: "ROLE_OWNER" }
 * - user.role = { name: "ROLE_OWNER", ... }
 */
function getRoleNameFromUser(user: any): string {
  if (!user) return "";
  if (typeof user.role === "string") return user.role;
  if (typeof user.roleName === "string") return user.roleName;
  if (user.role && typeof user.role.name === "string") return user.role.name;
  return "";
}

export default function Navbar({ sidebarOpen, setSidebarOpen }: NavbarProps) {
  const { user, logout } = useAuth();
  const router = useRouter();

  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  // ✅ ONLY OWNER sees notifications (robust)
  const roleName = useMemo(() => getRoleNameFromUser(user), [user]);
  const isOwner = roleName === "ROLE_OWNER" || roleName.includes("OWNER");

  const [notifLoading, setNotifLoading] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const menuRef = useClickOutside<HTMLDivElement>(() => setMenuOpen(false));
  const notifRef = useClickOutside<HTMLDivElement>(() => setNotifOpen(false));

  const displayName = useMemo(() => {
    const f = user?.firstName?.trim();
    const l = user?.lastName?.trim();
    return [f, l].filter(Boolean).join(" ") || "User";
  }, [user?.firstName, user?.lastName]);

  const badge = useMemo(() => {
    const r = roleLabel(roleName || (user?.role as any));
    if (r.includes("admin")) return "bg-violet-50 text-violet-700 border-violet-200";
    if (r.includes("owner")) return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (r.includes("driver")) return "bg-sky-50 text-sky-700 border-sky-200";
    return "bg-slate-50 text-slate-700 border-slate-200";
  }, [roleName, user?.role]);

  const handleLogout = () => {
    setMenuOpen(false);
    setNotifOpen(false);
    logout();
    toast.success("Logged out successfully");
    router.push("/login");
  };

  const loadUnreadCount = async () => {
    if (!isOwner) return;
    try {
      const c = await notificationService.unreadCount();
      setUnreadCount(Number(c) || 0);
    } catch {
      // ignore
    }
  };

  const loadNotifications = async () => {
    if (!isOwner) return;
    setNotifLoading(true);
    try {
      const list = await notificationService.list();
      setNotifications(list);
      await loadUnreadCount();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e?.message || "Failed to load notifications");
    } finally {
      setNotifLoading(false);
    }
  };

  // ✅ Poll unread count only for OWNER, otherwise reset
  useEffect(() => {
    if (!isOwner) {
      setUnreadCount(0);
      setNotifications([]);
      setNotifOpen(false);
      return;
    }

    loadUnreadCount();
    const t = setInterval(loadUnreadCount, 15000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOwner]);

  const markRead = async (id: number) => {
    try {
      await notificationService.markRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      await loadUnreadCount();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e?.message || "Mark read failed");
    }
  };

  const markAllRead = async () => {
    try {
      await notificationService.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      await loadUnreadCount();
      toast.success("All notifications marked as read ✅");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e?.message || "Mark all failed");
    }
  };

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-slate-200/60 bg-white/75 backdrop-blur-xl lg:pl-64">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-500/25 to-transparent" />

      <div className="px-3 py-3 lg:px-6 lg:py-4">
        <div className="flex items-center justify-between">
          {/* Left */}
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
                <p className="text-base font-extrabold tracking-tight text-slate-900">FleetIQ</p>
                <p className="text-xs font-semibold text-slate-600">Fleet Management • IA • GPS</p>
              </div>
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2">
            {/* ✅ Notifications ONLY OWNER */}
            {isOwner && (
              <div className="relative" ref={notifRef}>
                <button
                  onClick={async () => {
                    const next = !notifOpen;
                    setNotifOpen(next);
                    setMenuOpen(false);
                    if (next) await loadNotifications();
                  }}
                  className="relative inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white/80 p-2.5 text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                  aria-label="Notifications"
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-600 px-1 text-xs font-extrabold text-white">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <div className="absolute right-0 mt-3 w-[360px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
                    <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                      <p className="text-sm font-extrabold text-slate-900">Notifications</p>
                      <button
                        onClick={markAllRead}
                        className="text-xs font-extrabold text-slate-700 hover:text-slate-900"
                      >
                        Mark all read
                      </button>
                    </div>

                    <div className="max-h-[420px] overflow-auto p-2">
                      {notifLoading ? (
                        <div className="p-3 text-sm font-semibold text-slate-600">Loading...</div>
                      ) : notifications.length === 0 ? (
                        <div className="p-6 text-sm font-semibold text-slate-600">No notifications.</div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            className={cn(
                              "flex gap-3 rounded-2xl px-3 py-3 transition hover:bg-slate-50",
                              !n.read && "bg-blue-50/40"
                            )}
                          >
                            <div
                              className={cn(
                                "mt-1 h-2.5 w-2.5 rounded-full",
                                !n.read ? "bg-sky-500/70" : "bg-slate-300"
                              )}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-sm font-extrabold text-slate-900 truncate">{n.title}</p>

                                {!n.read && (
                                  <button
                                    onClick={() => markRead(n.id)}
                                    className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-extrabold text-slate-700 hover:bg-slate-50"
                                    title="Mark as read"
                                  >
                                    <Check size={12} />
                                    Read
                                  </button>
                                )}
                              </div>

                              <p className="mt-1 text-sm font-semibold text-slate-600">{n.message}</p>

                              <div className="mt-2 flex items-center justify-between">
                                <span className="text-xs font-semibold text-slate-500">
                                  {new Date(n.createdAt).toLocaleString()}
                                </span>

                                {n.missionId && (
                                  <button
                                    onClick={() => {
                                      setNotifOpen(false);
                                      router.push("/missions");
                                    }}
                                    className="rounded-full bg-slate-900 px-3 py-1 text-[11px] font-extrabold text-white hover:bg-slate-800"
                                  >
                                    Open
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="border-t border-slate-200 px-4 py-3">
                      <button
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-extrabold text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                        onClick={() => {
                          setNotifOpen(false);
                          router.push("/missions");
                        }}
                      >
                        Voir tout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

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
                      {roleLabel(roleName || user?.role)}
                    </span>
                  </div>
                </div>

                <ChevronDown size={16} className={cn("text-slate-500 transition", menuOpen && "rotate-180")} />
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
                      onClick={() => { setMenuOpen(false); router.push("/dashboard"); }}
                      className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-extrabold text-slate-800 transition hover:bg-slate-50"
                    >
                      <LayoutDashboard size={16} className="text-slate-500" />
                      Dashboard
                    </button>

                    <button
                      onClick={() => { setMenuOpen(false); router.push("/profile"); }}
                      className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-extrabold text-slate-800 transition hover:bg-slate-50"
                    >
                      <User size={16} className="text-slate-500" />
                      Profil
                    </button>

                    <button
                      onClick={() => { setMenuOpen(false); router.push("/settings"); }}
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