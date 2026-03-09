"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, ShieldCheck, Car } from "lucide-react";

function cn(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}



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
          
        </div>
      </div>

      

      {children}
    </div>
  );
}
