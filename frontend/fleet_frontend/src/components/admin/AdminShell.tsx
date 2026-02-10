"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, ShieldCheck, Car } from "lucide-react";

function cn(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

const items = [
  { href: "/admin/owners", label: "Owners & Vehicles", icon: Car },
  { href: "/admin/users", label: "Users Management", icon: Users },
];

export function AdminShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-semibold text-slate-700 shadow-sm">
            <ShieldCheck className="h-4 w-4" />
            Admin
          </div>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">
            {title}
          </h1>
          {subtitle ? <p className="mt-1 text-slate-600">{subtitle}</p> : null}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {items.map((it) => {
          const active = pathname.startsWith(it.href);
          const Icon = it.icon;
          return (
            <Link
              key={it.href}
              href={it.href}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold shadow-sm transition",
                active
                  ? "border-slate-300 bg-slate-900 text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              )}
            >
              <Icon className="h-4 w-4" />
              {it.label}
            </Link>
          );
        })}
      </div>

      {children}
    </div>
  );
}
