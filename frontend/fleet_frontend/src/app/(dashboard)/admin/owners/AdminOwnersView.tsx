"use client";

import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { AdminOnly } from "@/components/layout/AdminOnly";
import type { User } from "@/types/user";
import {
  RefreshCcw,
  Users,
  Mail,
  BarChart3,
  Car,
} from "lucide-react";

type OwnerWithCount = User & {
  driversCount?: number;
  vehiclesCount?: number;
};

interface Props {
  owners: OwnerWithCount[];
  loading: boolean;
  onRefresh: () => void;
}

export default function AdminOwnersView({
  owners,
  loading,
  onRefresh,
}: Props) {
  return (
    <ProtectedRoute requiredRoles={["ROLE_ADMIN"]}>
      <AdminOnly>
        <div className="min-h-screen bg-slate-50 px-6 py-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-4 py-2 text-xs font-extrabold text-violet-700">
                  <Users size={14} />
                  ADMIN
                </div>
                <h1 className="mt-3 text-3xl font-extrabold text-slate-900">
                  Owners
                </h1>
               
              </div>

              <button
                onClick={onRefresh}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-extrabold text-slate-700 shadow-sm hover:bg-slate-50"
              >
                <RefreshCcw size={16} />
                Actualiser
              </button>
            </div>

            {loading ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center font-bold text-slate-600">
                Chargement...
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {owners.map((owner) => (
                  <div
                    key={owner.id}
                    className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <h3 className="text-lg font-extrabold text-slate-900">
                      {owner.firstName} {owner.lastName}
                    </h3>

                    <div className="mt-4 flex items-center gap-2 text-sm text-slate-700">
                      <Mail size={16} className="text-slate-400" />
                      <span className="font-medium">{owner.email}</span>
                    </div>

                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
                        <div className="flex items-center gap-2 text-xs font-extrabold text-blue-700">
                          <BarChart3 size={14} />
                          DRIVERS COUNT
                        </div>
                        <div className="mt-2 text-2xl font-extrabold text-slate-900">
                          {owner.driversCount ?? 0}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                        <div className="flex items-center gap-2 text-xs font-extrabold text-emerald-700">
                          <Car size={14} />
                          VEHICLES COUNT
                        </div>
                        <div className="mt-2 text-2xl font-extrabold text-slate-900">
                          {owner.vehiclesCount ?? 0}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </AdminOnly>
    </ProtectedRoute>
  );
}