"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Users,
  Car,
  Settings,
  BarChart3,
  Calendar,
  FileText,
  LucideIcon,
  ChevronRight,
  Upload,
  Webhook,
} from "lucide-react";
import { useAuth } from "@/contexts/authContext";

interface NavigationItem {
  name: string;
  href: string;
  icon: LucideIcon;
  accessible: boolean;
  badge?: string;
}

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

function cn(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

/**
 * ✅ Normalise le rôle:
 * - "ADMIN" -> "ROLE_ADMIN"
 * - "ROLE_ADMIN" -> "ROLE_ADMIN"
 */
function normalizeRole(role?: string | null) {
  if (!role) return "";
  return role.startsWith("ROLE_") ? role : `ROLE_${role}`;
}

export default function Sidebar({ sidebarOpen, setSidebarOpen }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  const role = normalizeRole(user?.role);
  const isAdmin = role === "ROLE_ADMIN";
  const isOwner = role === "ROLE_OWNER";

  const navigation: NavigationItem[] = [
    { name: "Dashboard", href: "/dashboard", icon: Home, accessible: true },

    // Sprint 2
    { name: "Drivers", href: "/drivers", icon: Users, accessible: isAdmin || isOwner },
    { name: "Vehicles", href: "/vehicles", icon: Car, accessible: isAdmin || isOwner },

    // ✅ Sprint 3 (ajout)
    { name: "Import CSV", href: "/ingestion/import-csv", icon: Upload, accessible: isAdmin || isOwner },
    { name: "Ingestion API", href: "/ingestion/api-test", icon: Webhook, accessible: isAdmin || isOwner },

    { name: "Reports", href: "/reports", icon: BarChart3, accessible: isAdmin || isOwner, badge: "New" },
    { name: "Schedule", href: "/schedule", icon: Calendar, accessible: true },
    { name: "Documents", href: "/documents", icon: FileText, accessible: true },

    { name: "Settings", href: "/settings", icon: Settings, accessible: isAdmin },
  ];

  const filtered = navigation.filter((i) => i.accessible);

  const isActive = (href: string) => pathname === href || pathname?.startsWith(`${href}/`);

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm transition-opacity lg:hidden",
          sidebarOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => setSidebarOpen(false)}
        aria-hidden={!sidebarOpen}
      />

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen w-64 border-r border-slate-200/60 bg-white/80 backdrop-blur-xl transition-transform lg:translate-x-0",
          "pt-16",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-500/25 to-transparent" />

        <div className="flex h-full flex-col px-3 pb-4">
          <div className="mt-6">
            <ul className="mt-3 space-y-1">
              {filtered.map((item) => {
                const active = isActive(item.href);

                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        "group relative flex items-center justify-between gap-3 rounded-2xl px-3 py-3 text-base font-extrabold transition",
                        active
                          ? "bg-slate-900 text-white shadow-sm"
                          : "text-slate-800 hover:bg-slate-100/70"
                      )}
                    >
                      <span className="flex items-center gap-3">
                        <span
                          className={cn(
                            "grid h-9 w-9 place-items-center rounded-xl border transition",
                            active ? "border-white/10 bg-white/10" : "border-slate-200 bg-white"
                          )}
                        >
                          <item.icon size={18} className={cn(active ? "text-white" : "text-slate-700")} />
                        </span>

                        <span className="leading-tight">{item.name}</span>

                        {item.badge ? (
                          <span
                            className={cn(
                              "ml-2 rounded-full px-2 py-0.5 text-[11px] font-extrabold",
                              active
                                ? "bg-white/15 text-white"
                                : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            )}
                          >
                            {item.badge}
                          </span>
                        ) : null}
                      </span>

                      <ChevronRight
                        size={16}
                        className={cn(
                          "opacity-0 transition group-hover:opacity-100",
                          active ? "text-white/80" : "text-slate-400"
                        )}
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </aside>
    </>
  );
}
