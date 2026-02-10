"use client";

import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { driverService } from "@/lib/services/driverService";
import { User, Mail, Phone, Leaf } from "lucide-react";
import type { Driver } from "@/types/driver";

export default function ProfilePage() {
  const [me, setMe] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const d = await driverService.me();
        setMe(d);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <ProtectedRoute requiredRoles={["ROLE_DRIVER"]}>
      <div className="p-8">
        <div className="max-w-3xl mx-auto rounded-2xl border border-slate-200 bg-white shadow-lg overflow-hidden">
          <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-white/10 p-2">
                <User className="h-6 w-6" />
              </div>
              <div>
                <div className="text-2xl font-extrabold">My Profile</div>
                <div className="text-sm text-white/80">Driver information</div>
              </div>
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="animate-pulse space-y-3">
                <div className="h-5 w-48 bg-slate-200 rounded" />
                <div className="h-4 w-72 bg-slate-200 rounded" />
                <div className="h-4 w-64 bg-slate-200 rounded" />
              </div>
            ) : !me ? (
              <div className="text-slate-700">Unable to load profile.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div className="text-xs font-extrabold text-slate-600">NAME</div>
                  <div className="mt-1 text-lg font-extrabold text-slate-900">
                    {(me as any).firstName} {(me as any).lastName}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-slate-600">
                    <Mail className="h-4 w-4" /> EMAIL
                  </div>
                  <div className="mt-1 text-lg font-extrabold text-slate-900">{(me as any).email}</div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-slate-600">
                    <Phone className="h-4 w-4" /> PHONE
                  </div>
                  <div className="mt-1 text-lg font-extrabold text-slate-900">{(me as any).phone || "—"}</div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-slate-600">
                    <Leaf className="h-4 w-4" /> ECO SCORE
                  </div>
                  <div className="mt-1 text-lg font-extrabold text-slate-900">{(me as any).ecoScore ?? "—"}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
