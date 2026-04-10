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

function toTs(value?: string | null) {
  if (!value) return 0;
  const t = new Date(value).getTime();
  return Number.isNaN(t) ? 0 : t;
}

function isDriverLateAlert(notification: Notification) {
  return notification?.title?.trim().toLowerCase() === "retard de mission";
}

function isOwnerLateStartNotification(notification: Notification) {
  return notification?.title?.trim().toLowerCase() === "mission démarrée en retard";
}

function sortByNewest(list: Notification[]) {
  return [...list].sort((a, b) => toTs(b.createdAt) - toTs(a.createdAt));
}

function getLatestDriverLateUnread(list: Notification[]) {
  const lateUnread = list.filter(
    (n) => isDriverLateAlert(n) && !n.read && typeof n.id === "number"
  );
  const sorted = sortByNewest(lateUnread);
  return sorted[0] ?? null;
}

function getLatestOwnerLateUnread(list: Notification[]) {
  const lateUnread = list.filter(
    (n) =>
      isOwnerLateStartNotification(n) &&
      !n.read &&
      typeof n.id === "number"
  );
  const sorted = sortByNewest(lateUnread);
  return sorted[0] ?? null;
}

export default function Navbar({ sidebarOpen, setSidebarOpen }: NavbarProps) {
  const { user, logout } = useAuth();
  const router = useRouter();

  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
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
      const latestDriverLate = getLatestDriverLateUnread(list);

      setFloatingAlert(latestDriverLate);

      const newDriverLateUnread = sortByNewest(
        list.filter(
          (n) =>
            isDriverLateAlert(n) &&
            !n.read &&
            typeof n.id === "number" &&
            !alreadyPlayedIdsRef.current.has(n.id)
        )
      );

      if (newDriverLateUnread.length > 0) {
        newDriverLateUnread.forEach((n) => alreadyPlayedIdsRef.current.add(n.id));
        playLateAlertSound();

        const latest = newDriverLateUnread[0];
        toast.error(latest.message || "Alerte de retard de mission", {
          autoClose: 6000,
        });
      }

      const newOwnerLateUnread = sortByNewest(
        list.filter(
          (n) =>
            isOwnerLateStartNotification(n) &&
            !n.read &&
            typeof n.id === "number" &&
            !alreadyPlayedIdsRef.current.has(n.id)
        )
      );

      if (newOwnerLateUnread.length > 0) {
        newOwnerLateUnread.forEach((n) => alreadyPlayedIdsRef.current.add(n.id));

        const latest = newOwnerLateUnread[0];
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
        const safeList = Array.isArray(list) ? sortByNewest(list) : [];

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

    void loadUnreadCount();
    void loadNotifications(false);

    const timer = window.setInterval(() => {
      void loadUnreadCount();
      void loadNotifications(false);
    }, 15000);

    return () => window.clearInterval(timer);
  }, [canSeeNotifs, loadUnreadCount, loadNotifications]);

  useEffect(() => {
    if (!canSeeNotifs) return;

    const timer = window.setInterval(() => {
      const latestLateUnread = getLatestDriverLateUnread(notifications);

      if (latestLateUnread) {
        setFloatingAlert(latestLateUnread);
        playLateAlertSound();
      } else {
        setFloatingAlert(null);
      }
    }, 60000);

    return () => window.clearInterval(timer);
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

      await loadNotifications(false);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e?.message || "Mark all read failed");
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 lg:hidden"
              type="button"
            >
              {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
            </button>

            <div>
              <p className="text-sm font-bold text-slate-900">Fleet Management</p>
              <p className="text-xs text-slate-500">Dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {canSeeNotifs && (
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => {
                    setNotifOpen((v) => !v);
                    if (!notifOpen) void loadNotifications(true);
                  }}
                  className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  type="button"
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 inline-flex min-w-[20px] items-center justify-center rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-extrabold text-white">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <div className="absolute right-0 mt-2 w-[380px] max-w-[92vw] rounded-3xl border border-slate-200 bg-white shadow-2xl">
                    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                      <div>
                        <p className="text-sm font-extrabold text-slate-900">Notifications</p>
                        <p className="text-xs font-semibold text-slate-500">
                          {unreadCount} non lue(s)
                        </p>
                      </div>

                      <button
                        onClick={markAllRead}
                        className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-extrabold text-slate-700 hover:bg-slate-50"
                        type="button"
                      >
                        Tout lire
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
                  </div>
                )}
              </div>
            )}

            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 hover:bg-slate-50"
                type="button"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-sm font-extrabold text-white">
                  {initials(user?.firstName, user?.lastName)}
                </div>
                <div className="hidden text-left md:block">
                  <p className="text-sm font-extrabold text-slate-900">{displayName}</p>
                  <span className={cn("inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold", badge)}>
                    {roleLabel(roleName)}
                  </span>
                </div>
                <ChevronDown size={16} className="text-slate-500" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-3xl border border-slate-200 bg-white p-2 shadow-2xl">
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      router.push("/");
                    }}
                    className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    type="button"
                  >
                    <LayoutDashboard size={16} />
                    Dashboard
                  </button>

                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      router.push("/profile");
                    }}
                    className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    type="button"
                  >
                    <User size={16} />
                    Profile
                  </button>

                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      router.push("/settings");
                    }}
                    className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    type="button"
                  >
                    <Settings size={16} />
                    Settings
                  </button>

                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-semibold text-rose-600 hover:bg-rose-50"
                    type="button"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {floatingAlert && isDriver && (
        <div className="fixed bottom-5 right-5 z-[60] w-[360px] max-w-[92vw] rounded-3xl border border-red-200 bg-white p-4 shadow-2xl">
          <div className="flex items-start gap-3">
            <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600">
              <AlertTriangle size={18} />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-extrabold text-red-700">{floatingAlert.title}</p>
              <p className="mt-1 text-sm font-semibold text-slate-700">{floatingAlert.message}</p>
              <p className="mt-2 text-xs font-semibold text-slate-500">
                {formatDateTime(floatingAlert.createdAt)}
              </p>

              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => {
                    setFloatingAlert(null);
                    router.push("/my-missions");
                  }}
                  className="rounded-xl bg-red-600 px-3 py-2 text-xs font-extrabold text-white hover:bg-red-700"
                  type="button"
                >
                  Ouvrir
                </button>

                <button
                  onClick={async () => {
                    await markRead(floatingAlert.id);
                    setFloatingAlert(null);
                  }}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-extrabold text-slate-700 hover:bg-slate-50"
                  type="button"
                >
                  Marquer comme lu
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}