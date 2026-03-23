"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { useAuth } from "@/contexts/authContext";
import { driverService } from "@/lib/services/driverService";
import type { Driver } from "@/types/driver";

import DriversView from "./DriversView";

function cn(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function DriversPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const isAdmin = user?.role === "ROLE_ADMIN";
  const isOwner = user?.role === "ROLE_OWNER";

  const canCreate = isAdmin || isOwner;
  const canEdit = isAdmin || isOwner;
  const canDelete = isAdmin || isOwner;

  async function loadDrivers() {
    try {
      setRefreshing(true);
      setLoading(true);

      const data = await driverService.getAll();
      setDrivers(Array.isArray(data) ? data : []);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          "Erreur lors du chargement des conducteurs."
      );
      setDrivers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadDrivers();
  }, []);

  const filteredDrivers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return drivers;

    return drivers.filter((d) => {
      return (
        String(d.firstName || "").toLowerCase().includes(q) ||
        String(d.lastName || "").toLowerCase().includes(q) ||
        String(d.email || "").toLowerCase().includes(q) ||
        String(d.phone || "").toLowerCase().includes(q) ||
        String(d.licenseNumber || "").toLowerCase().includes(q)
      );
    });
  }, [drivers, search]);

  async function handleDelete() {
    if (!deleteId) return;

    try {
      await driverService.delete(deleteId);
      toast.success("Conducteur supprimé avec succès.");
      setDeleteId(null);
      await loadDrivers();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          "Impossible de supprimer ce conducteur."
      );
    }
  }

  function getStatusClass(status?: string) {
    switch (status) {
      case "ACTIVE":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "INACTIVE":
        return "bg-gray-100 text-gray-700 border-gray-200";
      case "ON_LEAVE":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "SUSPENDED":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  }

  return (
    <ProtectedRoute
      requiredRoles={["ROLE_OWNER", "ROLE_ADMIN"]}
      requireOwnerActive
    >
      <DriversView
        isOwner={isOwner}
        canCreate={canCreate}
        canEdit={canEdit}
        canDelete={canDelete}
        loading={loading}
        refreshing={refreshing}
        search={search}
        setSearch={setSearch}
        filteredDrivers={filteredDrivers}
        selectedDriver={selectedDriver}
        setSelectedDriver={setSelectedDriver}
        deleteId={deleteId}
        setDeleteId={setDeleteId}
        onRefresh={loadDrivers}
        onDelete={handleDelete}
        onEdit={(id) => router.push(`/drivers/edit/${id}`)}
        getStatusClass={getStatusClass}
      />
    </ProtectedRoute>
  );
}