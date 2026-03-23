"use client";

import { useEffect, useState } from "react";
import { adminService } from "@/lib/services/adminService";
import type { User } from "@/types/user";
import { toast } from "react-toastify";
import AdminOwnersView from "./AdminOwnersView";

type OwnerWithCount = User & {
  driversCount?: number;
  vehiclesCount?: number;
};

export default function AdminOwnersPage() {
  const [owners, setOwners] = useState<OwnerWithCount[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      setLoading(true);
      const ownersData = await adminService.listOwners();

      const withCounts = await Promise.all(
        (ownersData || []).map(async (owner) => {
          try {
            const [driversRes, vehiclesRes] = await Promise.all([
              adminService.countDriversByOwner(owner.id),
              adminService.countVehiclesByOwner(owner.id),
            ]);

            return {
              ...owner,
              driversCount: driversRes.driversCount ?? 0,
              vehiclesCount: vehiclesRes.vehiclesCount ?? 0,
            };
          } catch {
            return {
              ...owner,
              driversCount: 0,
              vehiclesCount: 0,
            };
          }
        })
      );

      setOwners(withCounts);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Erreur chargement owners");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <AdminOwnersView
      owners={owners}
      loading={loading}
      onRefresh={load}
    />
  );
}