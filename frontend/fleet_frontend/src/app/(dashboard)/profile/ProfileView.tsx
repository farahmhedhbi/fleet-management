"use client";

import {User as UserIcon,Mail,Phone,ShieldCheck,KeyRound,} from "lucide-react";
interface ProfileViewProps {
  user: any;
  loading: boolean;
  isDriver: boolean;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  role?: string;
  licenseNumber?: string;
  roleLabel: (role?: string) => string;
}

export default function ProfileView({
  user,
  loading,
  isDriver,
  firstName,
  lastName,
  email,
  phone,
  role,
  licenseNumber,
  roleLabel,
}: ProfileViewProps) {
  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto rounded-2xl border border-slate-200 bg-white shadow-lg overflow-hidden">
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
              <Card
                icon={<UserIcon className="h-4 w-4" />}
                label="FIRST NAME"
                value={firstName || "—"}
              />

              <Card
                icon={<UserIcon className="h-4 w-4" />}
                label="LAST NAME"
                value={lastName || "—"}
              />

              <Card
                icon={<Mail className="h-4 w-4" />}
                label="EMAIL"
                value={email || "—"}
              />

              <Card
                icon={<Phone className="h-4 w-4" />}
                label="PHONE"
                value={phone || "—"}
              />

              <Card
                icon={<ShieldCheck className="h-4 w-4" />}
                label="ROLE"
                value={roleLabel(role)}
              />

              {isDriver && (
                <Card
                  icon={<KeyRound className="h-4 w-4" />}
                  label="LICENSE NUMBER"
                  value={licenseNumber || "—"}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
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