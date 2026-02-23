"use client";

import { useEffect, useMemo, useState } from "react";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { useAuth } from "@/contexts/authContext";
import { driverService } from "@/lib/services/driverService";
import {
  User as UserIcon,
  Mail,
  Phone,
  ShieldCheck,
  Calendar,
  Hash,
  KeyRound,
} from "lucide-react";

function formatDate(date?: string) {
  if (!date) return "—";
  const d = new Date(date);
  return isNaN(d.getTime()) ? date : d.toLocaleString();
}

function roleLabel(role?: string) {
  return (role || "—").replace("ROLE_", "");
}

export default function ProfilePage() {
  const { user } = useAuth();

  const isDriver = useMemo(() => user?.role === "ROLE_DRIVER", [user?.role]);
  const [driverMe, setDriverMe] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        if (isDriver) {
          const d = await driverService.me();
          setDriverMe(d);
        }
      } catch {
        setDriverMe(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [isDriver]);

  // ✅ valeurs affichées (inscription)
  const firstName = isDriver ? (driverMe?.firstName ?? user?.firstName) : user?.firstName;
  const lastName  = isDriver ? (driverMe?.lastName ?? user?.lastName) : user?.lastName;
  const email     = isDriver ? (driverMe?.email ?? user?.email) : user?.email;
  const phone     = isDriver ? (driverMe?.phone ?? "—") : ((user as any)?.phone ?? "—"); // si phone pas dans user type
  const role      = user?.role;

  // ✅ driver extra field
  const licenseNumber =
    isDriver ? (driverMe?.licenseNumber ?? driverMe?.licenceNumber ?? "—") : undefined;

  return (
    <ProtectedRoute requiredRoles={["ROLE_ADMIN", "ROLE_OWNER", "ROLE_DRIVER"]}>
      <div className="p-8">
        <div className="max-w-4xl mx-auto rounded-2xl border border-slate-200 bg-white shadow-lg overflow-hidden">
          {/* Header */}
          <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-white/10 p-2">
                <UserIcon className="h-6 w-6" />
              </div>
              <div>
                <div className="text-2xl font-extrabold">My Profile</div>
                <div className="text-sm text-white/80">
                  Informations saisies lors de la création du compte
                </div>
              </div>

              <div className="ml-auto inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-extrabold">
                <ShieldCheck className="h-4 w-4" />
                {roleLabel(role)}
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-6">
            {loading ? (
              <div className="animate-pulse space-y-3">
                <div className="h-14 rounded-2xl bg-slate-200" />
                <div className="h-14 rounded-2xl bg-slate-200" />
                <div className="h-14 rounded-2xl bg-slate-200" />
              </div>
            ) : !user ? (
              <div className="text-slate-700">Unable to load profile.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <Card icon={<UserIcon className="h-4 w-4" />} label="FIRST NAME" value={firstName || "—"} />
                <Card icon={<UserIcon className="h-4 w-4" />} label="LAST NAME" value={lastName || "—"} />
                <Card icon={<Mail className="h-4 w-4" />} label="EMAIL" value={email || "—"} />
                
                <Card icon={<ShieldCheck className="h-4 w-4" />} label="ROLE" value={roleLabel(role)} />
           

                {/* ✅ فقط للـ DRIVER */}
                {isDriver && (
                  <Card
                    icon={<KeyRound className="h-4 w-4" />}
                    label="LICENSE NUMBER"
                    value={licenseNumber}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

function Card({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: any;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <div className="flex items-center gap-2 text-xs font-extrabold text-slate-600">
        {icon} {label}
      </div>
      <div className="mt-1 text-lg font-extrabold text-slate-900">
        {value ?? "—"}
      </div>
    </div>
  );
}
