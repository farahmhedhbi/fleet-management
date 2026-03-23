"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  AlertTriangle,
  Clock3,
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

function getRoleNameFromUser(user: any): string {
  if (!user) return "";
  if (typeof user.role === "string") return user.role;
  if (typeof user.roleName === "string") return user.roleName;
  if (user.role && typeof user.role.name === "string") return user.role.name;
  return "";
}

function formatDateTime(value?: string | null) {
  if (!value) return "Date inconnue";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "Date invalide";
  return d.toLocaleString();
}

function isDriverLateAlert(notification: Notification) {
  return notification?.title?.trim().toLowerCase() === "retard de mission";
}

function isOwnerLateStartNotification(notification: Notification) {
  return notification?.title?.trim().toLowerCase() === "mission démarrée en retard";
}

export default function Navbar({ sidebarOpen, setSidebarOpen }: NavbarProps) {
  const { user, logout } = useAuth();
  const router = useRouter();

  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // popup flottante seulement pour le driver en retard
  const [floatingAlert, setFloatingAlert] = useState<Notification | null>(null);

  const isMountedRef = useRef(true);
  const alreadyPlayedIdsRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const roleName = useMemo(() => getRoleNameFromUser(user), [user]);
  const isOwner = roleName === "ROLE_OWNER" || roleName.includes("OWNER");
  const isDriver = roleName === "ROLE_DRIVER" || roleName.includes("DRIVER");
  const canSeeNotifs = isOwner || isDriver;

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

  const openAllRoute = useCallback(() => {
    return isDriver ? "/my-missions" : "/missions";
  }, [isDriver]);

  const handleLogout = useCallback(() => {
    setMenuOpen(false);
    setNotifOpen(false);
    logout();
    toast.success("Logged out successfully");
    router.push("/login");
  }, [logout, router]);

  const playLateAlertSound = useCallback(() => {
    try {
      const audio = new Audio("/alert.mp3");
      audio.volume = 1;
      void audio.play().catch(() => {});
    } catch {
      // ignore
    }
  }, []);

  const processSpecialNotifications = useCallback(
    (list: Notification[]) => {
      const driverLateUnread = list.filter((n) => isDriverLateAlert(n) && !n.read);

      // popup flottante pour le driver
      setFloatingAlert(driverLateUnread.length > 0 ? driverLateUnread[0] : null);

      // son + toast une seule fois pour alerte driver
      const newDriverLateUnread = driverLateUnread.filter(
        (n) => typeof n.id === "number" && !alreadyPlayedIdsRef.current.has(n.id)
      );

      if (newDriverLateUnread.length > 0) {
        newDriverLateUnread.forEach((n) => alreadyPlayedIdsRef.current.add(n.id));
        playLateAlertSound();

        const latest = newDriverLateUnread[0];
        toast.error(latest.message || "Alerte de retard de mission", {
          autoClose: 6000,
        });
      }

      // toast orange pour owner : mission démarrée en retard
      const ownerLateStartUnread = list.filter(
        (n) =>
          isOwnerLateStartNotification(n) &&
          !n.read &&
          typeof n.id === "number" &&
          !alreadyPlayedIdsRef.current.has(n.id)
      );

      if (ownerLateStartUnread.length > 0) {
        ownerLateStartUnread.forEach((n) => alreadyPlayedIdsRef.current.add(n.id));

        const latest = ownerLateStartUnread[0];
        toast.warn(latest.message || "Mission démarrée en retard", {
          autoClose: 6000,
        });
      }
    },
    [playLateAlertSound]
  );

  const loadUnreadCount = useCallback(async () => {
    if (!canSeeNotifs) {
      if (isMountedRef.current) setUnreadCount(0);
      return;
    }

    try {
      const count = await notificationService.unreadCount();
      if (!isMountedRef.current) return;
      setUnreadCount(Number(count) || 0);
    } catch (e: any) {
      console.error("Unread notifications error:", e?.response?.data || e?.message || e);
      if (!isMountedRef.current) return;
      setUnreadCount(0);
    }
  }, [canSeeNotifs]);

  const loadNotifications = useCallback(
    async (showErrorToast = false) => {
      if (!canSeeNotifs) {
        if (isMountedRef.current) {
          setNotifications([]);
          setUnreadCount(0);
          setFloatingAlert(null);
        }
        return;
      }

      if (isMountedRef.current) setNotifLoading(true);

      try {
        const list = await notificationService.list();
        const safeList = Array.isArray(list) ? list : [];

        if (!isMountedRef.current) return;

        setNotifications(safeList);
        processSpecialNotifications(safeList);
        await loadUnreadCount();
      } catch (e: any) {
        console.error("Load notifications error:", e?.response?.data || e?.message || e);

        if (!isMountedRef.current) return;

        setNotifications([]);
        setUnreadCount(0);
        setFloatingAlert(null);

        if (showErrorToast) {
          toast.error(
            e?.response?.data?.message || e?.message || "Failed to load notifications"
          );
        }
      } finally {
        if (isMountedRef.current) setNotifLoading(false);
      }
    },
    [canSeeNotifs, loadUnreadCount, processSpecialNotifications]
  );

  useEffect(() => {
    if (!canSeeNotifs) {
      setUnreadCount(0);
      setNotifications([]);
      setNotifOpen(false);
      setFloatingAlert(null);
      return;
    }

    loadUnreadCount();
    loadNotifications(false);

    const timer = setInterval(() => {
      loadUnreadCount();
      loadNotifications(false);
    }, 15000);

    return () => clearInterval(timer);
  }, [canSeeNotifs, loadUnreadCount, loadNotifications]);

  // popup driver toutes les 60 secondes tant qu'elle est non lue
  useEffect(() => {
    if (!canSeeNotifs) return;

    const timer = setInterval(() => {
      const lateUnread = notifications.filter((n) => isDriverLateAlert(n) && !n.read);

      if (lateUnread.length > 0) {
        setFloatingAlert(lateUnread[0]);
        playLateAlertSound();
      }
    }, 60000);

    return () => clearInterval(timer);
  }, [notifications, canSeeNotifs, playLateAlertSound]);

  const markRead = async (id: number) => {
    try {
      await notificationService.markRead(id);

      if (!isMountedRef.current) return;

      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );

      if (floatingAlert?.id === id) {
        setFloatingAlert(null);
      }

      await loadUnreadCount();
      await loadNotifications(false);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e?.message || "Mark read failed");
    }
  };

  const markAllRead = async () => {
    try {
      await notificationService.markAllRead();

      if (!isMountedRef.current) return;

      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
      setFloatingAlert(null);

      toast.success("All notifications marked as read ✅");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e?.message || "Mark all failed");
    }
  };

  const hasUnreadDriverLateAlert = useMemo(() => {
    return notifications.some((n) => isDriverLateAlert(n) && !n.read);
  }, [notifications]);

  return (
    <>
      {floatingAlert && (
        <div className="fixed right-4 top-20 z-[70] w-[380px] max-w-[calc(100vw-2rem)] animate-in slide-in-from-top-3 duration-300">
          <div className="overflow-hidden rounded-3xl border border-red-200 bg-white shadow-2xl">
            <div className="bg-gradient-to-r from-red-600 to-rose-600 px-4 py-3 text-white">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-white/20 p-2">
                    <AlertTriangle size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-extrabold">Alerte critique</p>
                    <p className="text-xs font-semibold text-white/90">
                      Mission en retard
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setFloatingAlert(null)}
                  className="rounded-full p-1 text-white/90 transition hover:bg-white/10 hover:text-white"
                  type="button"
                  aria-label="Fermer l'alerte"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="space-y-3 px-4 py-4">
              <div>
                <p className="text-sm font-extrabold text-red-700">
                  {floatingAlert.title}
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-700">
                  {floatingAlert.message}
                </p>
              </div>

              <div className="rounded-2xl bg-red-50 px-3 py-2 text-xs font-bold text-red-700">
                {formatDateTime(floatingAlert.createdAt)}
              </div>

              <div className="flex items-center gap-2">
                {floatingAlert.missionId && (
                  <button
                    onClick={() => {
                      setFloatingAlert(null);
                      setNotifOpen(false);
                      router.push(openAllRoute());
                    }}
                    className="flex-1 rounded-2xl bg-red-600 px-4 py-2 text-sm font-extrabold text-white transition hover:bg-red-700"
                    type="button"
                  >
                    Voir mission
                  </button>
                )}

                <button
                  onClick={() => setFloatingAlert(null)}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-extrabold text-slate-800 transition hover:bg-slate-50"
                  type="button"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <nav className="fixed top-0 z-50 w-full border-b border-slate-200/60 bg-white/75 backdrop-blur-xl lg:pl-64">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-500/25 to-transparent" />

        <div className="px-3 py-3 lg:px-6 lg:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white/80 p-2.5 text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md focus:outline-none focus:ring-2 focus:ring-sky-500/20 lg:hidden"
                aria-label="Toggle sidebar"
                type="button"
              >
                {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
              </button>

              <div
                className="flex cursor-pointer items-center gap-3"
                onClick={() => router.push("/dashboard")}
                role="button"
                aria-label="Go to dashboard"
              >
                <div className="relative grid h-10 w-10 place-items-center rounded-2xl bg-slate-900 text-white shadow-sm">
                  <span className="text-base font-extrabold">F</span>
                  <span className="absolute -right-1 -top-1 h-3 w-3 animate-pulse rounded-full bg-emerald-400" />
                </div>

                <div className="hidden leading-tight sm:block">
                  <p className="text-base font-extrabold tracking-tight text-slate-900">
                    FleetIQ
                  </p>
                  <p className="text-xs font-semibold text-slate-600">
                    Fleet Management • IA • GPS
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {canSeeNotifs && (
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={async () => {
                      const next = !notifOpen;
                      setNotifOpen(next);
                      setMenuOpen(false);

                      if (next) {
                        await loadNotifications(true);
                      }
                    }}
                    className={cn(
                      "relative inline-flex items-center justify-center rounded-2xl border bg-white/80 p-2.5 text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md focus:outline-none focus:ring-2",
                      hasUnreadDriverLateAlert
                        ? "border-red-300 ring-red-500/20"
                        : "border-slate-200 focus:ring-sky-500/20"
                    )}
                    aria-label="Notifications"
                    type="button"
                  >
                    {hasUnreadDriverLateAlert ? (
                      <AlertTriangle size={18} className="text-red-600" />
                    ) : (
                      <Bell size={18} />
                    )}

                    {unreadCount > 0 && (
                      <span
                        className={cn(
                          "absolute -right-1 -top-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-xs font-extrabold text-white",
                          hasUnreadDriverLateAlert ? "bg-red-600" : "bg-rose-600"
                        )}
                      >
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {notifOpen && (
                    <div className="absolute right-0 mt-3 w-[360px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
                      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                        <p className="text-sm font-extrabold text-slate-900">
                          Notifications
                        </p>

                        <button
                          onClick={markAllRead}
                          className="text-xs font-extrabold text-slate-700 hover:text-slate-900"
                          type="button"
                        >
                          Mark all read
                        </button>
                      </div>

                      <div className="max-h-[420px] overflow-auto p-2">
                        {notifLoading ? (
                          <div className="p-3 text-sm font-semibold text-slate-600">
                            Loading...
                          </div>
                        ) : notifications.length === 0 ? (
                          <div className="p-6 text-sm font-semibold text-slate-600">
                            No notifications.
                          </div>
                        ) : (
                          notifications.map((n) => {
                            const isDriverLate = isDriverLateAlert(n);
                            const isOwnerLate = isOwnerLateStartNotification(n);

                            return (
                              <div
                                key={n.id}
                                className={cn(
                                  "mb-2 flex gap-3 rounded-2xl px-3 py-3 transition hover:bg-slate-50",
                                  isDriverLate && !n.read && "border border-red-200 bg-red-50",
                                  isDriverLate && n.read && "border border-red-100 bg-red-50/50",
                                  isOwnerLate && !n.read && "border border-amber-200 bg-amber-50",
                                  isOwnerLate && n.read && "border border-amber-100 bg-amber-50/50",
                                  !isDriverLate && !isOwnerLate && !n.read && "bg-blue-50/40"
                                )}
                              >
                                <div
                                  className={cn(
                                    "mt-1 flex h-7 w-7 items-center justify-center rounded-full",
                                    isDriverLate && "bg-red-100 text-red-600",
                                    isOwnerLate && "bg-amber-100 text-amber-600",
                                    !isDriverLate && !isOwnerLate && "bg-slate-100 text-slate-500"
                                  )}
                                >
                                  {isDriverLate ? (
                                    <AlertTriangle size={14} />
                                  ) : isOwnerLate ? (
                                    <Clock3 size={14} />
                                  ) : (
                                    <Bell size={14} />
                                  )}
                                </div>

                                <div className="min-w-0 flex-1">
                                  <div className="flex items-start justify-between gap-2">
                                    <p
                                      className={cn(
                                        "truncate text-sm font-extrabold",
                                        isDriverLate && "text-red-700",
                                        isOwnerLate && "text-amber-700",
                                        !isDriverLate && !isOwnerLate && "text-slate-900"
                                      )}
                                    >
                                      {n.title}
                                    </p>

                                    {!n.read && !isDriverLate && (
                                      <button
                                        onClick={() => markRead(n.id)}
                                        className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-extrabold text-slate-700 hover:bg-slate-50"
                                        title="Mark as read"
                                        type="button"
                                      >
                                        <Check size={12} />
                                        Read
                                      </button>
                                    )}
                                  </div>

                                  <p
                                    className={cn(
                                      "mt-1 text-sm font-semibold",
                                      isDriverLate && "text-red-700",
                                      isOwnerLate && "text-amber-700",
                                      !isDriverLate && !isOwnerLate && "text-slate-600"
                                    )}
                                  >
                                    {n.message}
                                  </p>

                                  {isDriverLate && (
                                    <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-extrabold text-red-700">
                                      <AlertTriangle size={12} />
                                      Alerte de retard
                                    </div>
                                  )}

                                  {isOwnerLate && (
                                    <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-extrabold text-amber-700">
                                      <Clock3 size={12} />
                                      Démarrage tardif
                                    </div>
                                  )}

                                  <div className="mt-2 flex items-center justify-between">
                                    <span className="text-xs font-semibold text-slate-500">
                                      {formatDateTime(n.createdAt)}
                                    </span>

                                    {n.missionId && (
                                      <button
                                        onClick={() => {
                                          setNotifOpen(false);
                                          router.push(openAllRoute());
                                        }}
                                        className={cn(
                                          "rounded-full px-3 py-1 text-[11px] font-extrabold text-white",
                                          isDriverLate
                                            ? "bg-red-600 hover:bg-red-700"
                                            : isOwnerLate
                                            ? "bg-amber-600 hover:bg-amber-700"
                                            : "bg-slate-900 hover:bg-slate-800"
                                        )}
                                        type="button"
                                      >
                                        Open
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>

                      <div className="border-t border-slate-200 px-4 py-3">
                        <button
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-extrabold text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                          onClick={() => {
                            setNotifOpen(false);
                            router.push(openAllRoute());
                          }}
                          type="button"
                        >
                          Voir tout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => {
                    setMenuOpen((v) => !v);
                    setNotifOpen(false);
                  }}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/80 px-3 py-2 shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                  aria-label="User menu"
                  type="button"
                >
                  <div className="relative grid h-9 w-9 place-items-center rounded-2xl bg-slate-900 text-white">
                    <span className="text-xs font-extrabold">
                      {initials(user?.firstName, user?.lastName)}
                    </span>
                  </div>

                  <div className="hidden text-left leading-tight md:block">
                    <div className="text-sm font-extrabold text-slate-900">
                      {displayName}
                    </div>
                    <div className="mt-0.5 flex items-center gap-2">
                      <span
                        className={cn(
                          "rounded-full border px-2 py-0.5 text-[11px] font-extrabold capitalize",
                          badge
                        )}
                      >
                        {roleLabel(roleName || user?.role)}
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
                      <p className="text-sm font-extrabold text-slate-900">
                        {displayName}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-slate-600">
                        {user?.email}
                      </p>

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
                        type="button"
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
                        type="button"
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
                        type="button"
                      >
                        <Settings size={16} className="text-slate-500" />
                        Paramètres
                      </button>
                    </div>

                    <div className="border-t border-slate-200 p-2">
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-extrabold text-rose-700 transition hover:bg-rose-50"
                        type="button"
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
    </>
  );
}
