"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "lucide-react";
import { useAuth } from "@/contexts/authContext";

type NavItem = {
  name: string;
  href: string;
  icon: any;
  show: boolean;
};

function cn(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export default function Sidebar() {
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
    { name: "Vehicles", href: "/vehicles", icon: Car, show: isOwner || isAdmin },
    { name: "Drivers", href: "/drivers", icon: Users, show: isOwner || isAdmin },

    // ✅ ADMIN only (Sprint 3)
    { name: "Import CSV", href: "/ingestion/import-csv", icon: Upload, show: isAdmin },
    { name: "Ingestion API", href: "/ingestion/api-test", icon: Webhook, show: isAdmin },

    { name: "Reports", href: "/reports", icon: BarChart3, show: isOwner || isAdmin },

    { name: "Schedule", href: "/schedule", icon: Calendar, show: true },
    { name: "Documents", href: "/documents", icon: FileText, show: true },

    { name: "Settings", href: "/settings", icon: Settings, show: isAdmin },
  ];

  return (
    <aside className="h-full w-72 border-r border-slate-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="p-6">
        <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-5 text-white shadow-xl">
          <div className="text-lg font-bold tracking-tight">Fleet Management</div>
          <div className="mt-1 text-xs text-slate-200">
            {isAdmin ? "Admin Panel" : isOwner ? "Owner Portal" : "Driver Portal"}
          </div>
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
  );
}
