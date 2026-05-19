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
  Search,
  CheckCheck,
  CarFront,
} from "lucide-react";
import { toast } from "react-toastify";
import { useAuth } from "@/contexts/authContext";
import { notificationService } from "@/lib/services/notificationService";
import type { Notification } from "@/types/notification";

interface NavbarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

function cn(...classes: (string | false | undefined | null)[]) {
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
  return d.toLocaleString("fr-FR");
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
  return (
    notification?.title?.trim().toLowerCase() ===
    "mission démarrée en retard"
  );
}

function sortByNewest(list: Notification[]) {
  return [...list].sort((a, b) => toTs(b.createdAt) - toTs(a.createdAt));
}

function getLatestDriverLateUnread(list: Notification[]) {
  return (
    sortByNewest(
      list.filter(
        (n) => isDriverLateAlert(n) && !n.read && typeof n.id === "number"
      )
    )[0] ?? null
  );
}

function getNotificationStyle(n: Notification) {
  if (isDriverLateAlert(n)) {
    return {
      card: n.read
        ? "border-red-100 bg-red-50/50"
        : "border-red-200 bg-red-50 shadow-sm",
      icon: "bg-red-100 text-red-600",
      title: "text-red-700",
      badge: "bg-red-100 text-red-700",
      button: "bg-red-600 hover:bg-red-700",
      label: "Alerte retard",
      iconNode: <AlertTriangle size={15} />,
    };
  }

  if (isOwnerLateStartNotification(n)) {
    return {
      card: n.read
        ? "border-amber-100 bg-amber-50/50"
        : "border-amber-200 bg-amber-50 shadow-sm",
      icon: "bg-amber-100 text-amber-600",
      title: "text-amber-700",
      badge: "bg-amber-100 text-amber-700",
      button: "bg-amber-600 hover:bg-amber-700",
      label: "Démarrage tardif",
      iconNode: <Clock3 size={15} />,
    };
  }

  return {
    card: n.read
      ? "border-slate-100 bg-white"
      : "border-blue-100 bg-blue-50/70 shadow-sm",
    icon: "bg-slate-100 text-slate-500",
    title: "text-slate-900",
    badge: "bg-slate-100 text-slate-600",
    button: "bg-slate-900 hover:bg-slate-800",
    label: "Notification",
    iconNode: <Bell size={15} />,
  };
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
  const [notifQuery, setNotifQuery] = useState("");

  const isMountedRef = useRef(true);
  const alreadyPlayedIdsRef = useRef<Set<number>>(new Set());

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

  const roleBadgeClass = useMemo(() => {
    const r = roleLabel(roleName || (user?.role as any));

    if (r.includes("admin"))
      return "bg-violet-50 text-violet-700 border-violet-200";
    if (r.includes("owner"))
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (r.includes("driver"))
      return "bg-sky-50 text-sky-700 border-sky-200";

    return "bg-slate-50 text-slate-700 border-slate-200";
  }, [roleName, user?.role]);

  const openAllRoute = useCallback(() => {
    return isDriver ? "/my-missions" : "/missions";
  }, [isDriver]);

  const openNotificationTarget = useCallback(
    (notification: Notification) => {
      setNotifOpen(false);

      if (notification.vehicleId && notification.missionId) {
        router.push("/owner/gps");
        return;
      }

      if (notification.vehicleId) {
        router.push(`/vehicles/${notification.vehicleId}/obd`);
        return;
      }

      router.push(openAllRoute());
    },
    [openAllRoute, router]
  );

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

      const newLateUnread = sortByNewest(
        list.filter(
          (n) =>
            (isDriverLateAlert(n) || isOwnerLateStartNotification(n)) &&
            !n.read &&
            typeof n.id === "number" &&
            !alreadyPlayedIdsRef.current.has(n.id)
        )
      );

      if (newLateUnread.length > 0) {
        newLateUnread.forEach((n) => alreadyPlayedIdsRef.current.add(n.id));

        const latest = newLateUnread[0];

        if (isDriverLateAlert(latest)) {
          playLateAlertSound();
          toast.error(latest.message || "Alerte de retard de mission", {
            autoClose: 6000,
          });
        } else {
          toast.warn(latest.message || "Mission démarrée en retard", {
            autoClose: 6000,
          });
        }
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
    } catch {
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
        if (!isMountedRef.current) return;

        setNotifications([]);
        setUnreadCount(0);
        setFloatingAlert(null);

        if (showErrorToast) {
          toast.error(
            e?.response?.data?.message ||
              e?.message ||
              "Failed to load notifications"
          );
        }
      } finally {
        if (isMountedRef.current) setNotifLoading(false);
      }
    },
    [canSeeNotifs, loadUnreadCount, processSpecialNotifications]
  );

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

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
      toast.error(
        e?.response?.data?.message || e?.message || "Mark all read failed"
      );
    }
  };

  const filteredNotifications = useMemo(() => {
    const q = notifQuery.trim().toLowerCase();

    if (!q) return notifications;

    return notifications.filter((n) => {
      return (
        n.title?.toLowerCase().includes(q) ||
        n.message?.toLowerCase().includes(q) ||
        String(n.vehicleId ?? "").includes(q) ||
        String(n.missionId ?? "").includes(q)
      );
    });
  }, [notifications, notifQuery]);

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 shadow-sm backdrop-blur-xl">
        <div className="flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 lg:hidden"
              type="button"
            >
              {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
            </button>

            <div className="flex items-center gap-3">
              <div className="hidden h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg md:flex">
                <CarFront size={22} />
              </div>

              <div>
                <p className="text-sm font-black tracking-tight text-slate-950">
                  Fleet Management
                </p>
                <p className="text-xs font-semibold text-slate-500">
                  Vehicle operations dashboard
                </p>
              </div>
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
                  className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
                  type="button"
                >
                  <Bell size={19} />

                  {unreadCount > 0 && (
                    <span className="absolute -right-1.5 -top-1.5 inline-flex min-w-[22px] items-center justify-center rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-black text-white ring-2 ring-white">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <div className="absolute right-0 mt-3 w-[430px] max-w-[94vw] overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl">
                    <div className="bg-gradient-to-r from-slate-950 to-slate-800 px-5 py-4 text-white">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-base font-black">Notifications</p>
                          <p className="text-xs font-semibold text-slate-300">
                            {unreadCount} non lue(s)
                          </p>
                        </div>

                        <button
                          onClick={markAllRead}
                          className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-3 py-2 text-xs font-black text-white ring-1 ring-white/20 transition hover:bg-white/20"
                          type="button"
                        >
                          <CheckCheck size={14} />
                          Tout lire
                        </button>
                      </div>

                      <div className="relative mt-4">
                        <Search
                          size={16}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                          value={notifQuery}
                          onChange={(e) => setNotifQuery(e.target.value)}
                          placeholder="Chercher notification..."
                          className="w-full rounded-2xl border border-white/10 bg-white/10 py-2.5 pl-9 pr-3 text-sm font-semibold text-white placeholder:text-slate-400 outline-none focus:bg-white/15"
                        />
                      </div>
                    </div>

                    <div className="max-h-[460px] overflow-auto bg-slate-50 p-3">
                      {notifLoading ? (
                        <div className="rounded-2xl bg-white p-5 text-sm font-bold text-slate-600">
                          Loading...
                        </div>
                      ) : filteredNotifications.length === 0 ? (
                        <div className="rounded-2xl bg-white p-6 text-center text-sm font-bold text-slate-600">
                          No notifications.
                        </div>
                      ) : (
                        filteredNotifications.map((n) => {
                          const style = getNotificationStyle(n);
                          const canOpen = Boolean(n.vehicleId || n.missionId);

                          return (
                            <div
                              key={n.id}
                              className={cn(
                                "mb-3 rounded-3xl border p-4 transition hover:bg-white",
                                style.card
                              )}
                            >
                              <div className="flex gap-3">
                                <div
                                  className={cn(
                                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl",
                                    style.icon
                                  )}
                                >
                                  {style.iconNode}
                                </div>

                                <div className="min-w-0 flex-1">
                                  <div className="flex items-start justify-between gap-2">
                                    <p
                                      className={cn(
                                        "line-clamp-1 text-sm font-black",
                                        style.title
                                      )}
                                    >
                                      {n.title}
                                    </p>

                                    {!n.read && (
                                      <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-blue-600" />
                                    )}
                                  </div>

                                  <p className="mt-1 line-clamp-2 text-sm font-semibold text-slate-600">
                                    {n.message}
                                  </p>

                                  <div className="mt-3 flex flex-wrap items-center gap-2">
                                    <span
                                      className={cn(
                                        "rounded-full px-2.5 py-1 text-[11px] font-black",
                                        style.badge
                                      )}
                                    >
                                      {style.label}
                                    </span>

                                    <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-slate-500 ring-1 ring-slate-200">
                                      {formatDateTime(n.createdAt)}
                                    </span>
                                  </div>

                                  <div className="mt-3 flex items-center justify-end gap-2">
                                    {!n.read && (
                                      <button
                                        onClick={() => markRead(n.id)}
                                        className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 transition hover:bg-slate-50"
                                        type="button"
                                      >
                                        <Check size={13} />
                                        Read
                                      </button>
                                    )}

                                    {canOpen && (
                                      <button
                                        onClick={() => openNotificationTarget(n)}
                                        className={cn(
                                          "rounded-xl px-3 py-2 text-xs font-black text-white transition",
                                          style.button
                                        )}
                                        type="button"
                                      >
                                        Open
                                      </button>
                                    )}
                                  </div>
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
                className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-2.5 py-2 shadow-sm transition hover:bg-slate-50 md:px-3"
                type="button"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-900 to-slate-700 text-sm font-black text-white shadow-sm">
                  {initials(user?.firstName, user?.lastName)}
                </div>

                <div className="hidden text-left md:block">
                  <p className="max-w-[150px] truncate text-sm font-black text-slate-900">
                    {displayName}
                  </p>
                  <span
                    className={cn(
                      "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-black capitalize",
                      roleBadgeClass
                    )}
                  >
                    {roleLabel(roleName)}
                  </span>
                </div>

                <ChevronDown size={16} className="text-slate-500" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-3 w-72 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl">
                  <div className="bg-slate-950 px-4 py-4 text-white">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-sm font-black">
                        {initials(user?.firstName, user?.lastName)}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-black">
                          {displayName}
                        </p>
                        <p className="text-xs font-semibold capitalize text-slate-300">
                          {roleLabel(roleName)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-2">
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        router.push("/");
                      }}
                      className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                      type="button"
                    >
                      <LayoutDashboard size={17} />
                      Dashboard
                    </button>

                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        router.push("/profile");
                      }}
                      className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                      type="button"
                    >
                      <User size={17} />
                      Profile
                    </button>

                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        router.push("/settings");
                      }}
                      className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                      type="button"
                    >
                      <Settings size={17} />
                      Settings
                    </button>

                    <div className="my-2 border-t border-slate-100" />

                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-black text-rose-600 transition hover:bg-rose-50"
                      type="button"
                    >
                      <LogOut size={17} />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {floatingAlert && isDriver && (
        <div className="fixed bottom-5 right-5 z-[60] w-[380px] max-w-[92vw] overflow-hidden rounded-[28px] border border-red-200 bg-white shadow-2xl">
          <div className="bg-red-600 px-5 py-3 text-white">
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} />
              <p className="text-sm font-black">Alerte urgente</p>
            </div>
          </div>

          <div className="p-5">
            <p className="text-sm font-black text-red-700">
              {floatingAlert.title}
            </p>

            <p className="mt-1 text-sm font-semibold text-slate-700">
              {floatingAlert.message}
            </p>

            <p className="mt-2 text-xs font-bold text-slate-500">
              {formatDateTime(floatingAlert.createdAt)}
            </p>

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => {
                  setFloatingAlert(null);
                  router.push("/my-missions");
                }}
                className="rounded-xl bg-red-600 px-4 py-2 text-xs font-black text-white transition hover:bg-red-700"
                type="button"
              >
                Ouvrir
              </button>

              <button
                onClick={async () => {
                  await markRead(floatingAlert.id);
                  setFloatingAlert(null);
                }}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-700 transition hover:bg-slate-50"
                type="button"
              >
                Marquer comme lu
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}