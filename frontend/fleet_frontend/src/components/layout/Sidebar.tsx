"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { Dispatch, SetStateAction } from "react";
import {
  Home,
  Car,
  Users,
  Upload,
  Webhook,
  BarChart3,
  Calendar,
  FileText,
  Settings,
  X,
  Shield,
} from "lucide-react";
import { useAuth } from "@/contexts/authContext";

type SidebarProps = {
  sidebarOpen: boolean;
  setSidebarOpen: Dispatch<SetStateAction<boolean>>;
};

type NavItem = {
  name: string;
  href: string;
  icon: any;
  show: boolean;
};

function cn(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export default function Sidebar({ sidebarOpen, setSidebarOpen }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  const role = user?.role;
  const isAdmin = role === "ROLE_ADMIN";
  const isOwner = role === "ROLE_OWNER";
  const isDriver = role === "ROLE_DRIVER";

  const items: NavItem[] = [
    { name: "Dashboard", href: "/dashboard", icon: Home, show: true },

    // ✅ DRIVER only
    { name: "My Vehicles", href: "/my-vehicles", icon: Car, show: isDriver },
    { name: "Profile", href: "/profile", icon: Users, show: isDriver },

    // ✅ OWNER/ADMIN
    { name: "Vehicles", href: "/vehicles", icon: Car, show: isOwner  },
    { name: "Drivers", href: "/drivers", icon: Users, show: isOwner  },

    // ✅ ADMIN only (Sprint 3)
    { name: "Import CSV", href: "/ingestion/import-csv", icon: Upload, show: isAdmin },
    { name: "Ingestion API", href: "/ingestion/api-test", icon: Webhook, show: isAdmin },
    { name: "Owners", href: "/admin/owners", icon: Users, show: isAdmin },
    { name: "Users Admin", href: "/admin/users", icon: Shield, show: isAdmin },
    { name: "Comptes actifs", href: "/admin/active-accounts", icon: Users, show: isAdmin },
    { name: "Rôles & Permissions", href: "/admin/roles", icon: Shield, show: isAdmin },


    { name: "Reports", href: "/reports", icon: BarChart3, show: isOwner || isAdmin },

    { name: "Schedule", href: "/schedule", icon: Calendar, show: true },
    { name: "Documents", href: "/documents", icon: FileText, show: true },

    { name: "Settings", href: "/settings", icon: Settings, show: isAdmin },
  ];

  return (
    <>
      {/* ✅ Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-full w-72 border-r border-slate-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60",
          "transform transition-transform duration-200 ease-out",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0 lg:z-30 lg:top-16 lg:h-[calc(100%-4rem)]"
        )}
      >
        <div className="p-6">
          {/* ✅ Header mobile (close button) */}
          <div className="mb-4 flex items-center justify-between lg:hidden">
            <div className="font-extrabold text-slate-900">Menu</div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="rounded-xl border border-slate-200 bg-white p-2 text-slate-700 hover:bg-slate-50"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          

          <nav className="mt-6 space-y-2">
            {items
              .filter((it) => it.show)
              .map((it) => {
                const active = pathname === it.href || pathname.startsWith(it.href + "/");
                const Icon = it.icon;

                return (
                  <Link
                    key={it.href}
                    href={it.href}
                    onClick={() => setSidebarOpen(false)} // ✅ ferme sur mobile
                    className={cn(
                      "group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all",
                      active
                        ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md shadow-blue-500/20"
                        : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                    )}
                  >
                    <Icon className={cn("h-5 w-5 transition-transform", !active && "group-hover:scale-110")} />
                    <span>{it.name}</span>
                  </Link>
                );
              })}
          </nav>
        </div>
      </aside>
    </>
  );
}
