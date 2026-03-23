"use client";

import Link from "next/link";
import type { Driver } from "@/types/driver";
import {
  Plus,
  Search,
  RefreshCcw,
  Trash2,
  Edit,
  Eye,
  Users,
  Mail,
  Phone,
  IdCard,
  AlertTriangle,
} from "lucide-react";

function cn(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

interface DriversViewProps {
  isOwner: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  loading: boolean;
  refreshing: boolean;
  search: string;
  setSearch: (value: string) => void;
  filteredDrivers: Driver[];
  selectedDriver: Driver | null;
  setSelectedDriver: (driver: Driver | null) => void;
  deleteId: number | null;
  setDeleteId: (id: number | null) => void;
  onRefresh: () => void;
  onDelete: () => void;
  onEdit: (id: number) => void;
  getStatusClass: (status?: string) => string;
}

export default function DriversView({
  isOwner,
  canCreate,
  canEdit,
  canDelete,
  loading,
  refreshing,
  search,
  setSearch,
  filteredDrivers,
  selectedDriver,
  setSelectedDriver,
  deleteId,
  setDeleteId,
  onRefresh,
  onDelete,
  onEdit,
  getStatusClass,
}: DriversViewProps) {
  return (
    <div className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              {isOwner ? "Mes conducteurs" : "Gestion des conducteurs"}
            </h1>
            <p className="mt-1 text-slate-600">
              {isOwner
                ? "Liste des conducteurs que vous avez créés."
                : "Liste complète des conducteurs."}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <RefreshCcw
                className={refreshing ? "h-4 w-4 animate-spin" : "h-4 w-4"}
              />
              Actualiser
            </button>

            {canCreate && (
              <Link
                href="/drivers/new"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                Créer un conducteur
              </Link>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-700">
              <Users className="h-4 w-4" />
              {filteredDrivers.length} conducteur(s)
            </div>

            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher par nom, email, téléphone, permis..."
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm font-medium text-slate-800 outline-none transition focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="p-5">
            {loading ? (
              <div className="space-y-3 animate-pulse">
                <div className="h-16 rounded-2xl bg-slate-200" />
                <div className="h-16 rounded-2xl bg-slate-200" />
                <div className="h-16 rounded-2xl bg-slate-200" />
              </div>
            ) : filteredDrivers.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-14 text-center">
                <Users className="mb-3 h-10 w-10 text-slate-400" />
                <h3 className="text-lg font-bold text-slate-900">
                  Aucun conducteur trouvé
                </h3>
                <p className="mt-1 max-w-xl text-sm text-slate-600">
                  {isOwner
                    ? "Aucun conducteur ne vous est actuellement associé. Créez votre premier conducteur pour l’afficher ici."
                    : "Aucun conducteur disponible pour le moment."}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredDrivers.map((driver) => (
                  <div
                    key={driver.id}
                    className="flex flex-col gap-4 rounded-2xl border border-slate-200 p-4 transition hover:shadow-sm lg:flex-row lg:items-center lg:justify-between"
                  >
                    <div className="flex items-start gap-4">
                      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-600 text-white">
                        <Users className="h-5 w-5" />
                      </div>

                      <div className="space-y-2">
                        <div>
                          <h3 className="text-lg font-extrabold text-slate-900">
                            {driver.firstName} {driver.lastName}
                          </h3>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span
                              className={cn(
                                "inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold",
                                getStatusClass(driver.status)
                              )}
                            >
                              {driver.status || "ACTIVE"}
                            </span>
                          </div>
                        </div>

                        <div className="grid gap-2 text-sm text-slate-600 md:grid-cols-3">
                          <div className="inline-flex items-center gap-2">
                            <Mail className="h-4 w-4 text-slate-400" />
                            {driver.email || "—"}
                          </div>

                          <div className="inline-flex items-center gap-2">
                            <Phone className="h-4 w-4 text-slate-400" />
                            {driver.phone || "—"}
                          </div>

                          <div className="inline-flex items-center gap-2">
                            <IdCard className="h-4 w-4 text-slate-400" />
                            {driver.licenseNumber || "—"}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => setSelectedDriver(driver)}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        <Eye className="h-4 w-4" />
                        Voir
                      </button>

                      {canEdit && driver.id && (
                        <button
                          onClick={() => onEdit(driver.id!)}
                          className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-extrabold text-blue-700 hover:bg-blue-100"
                        >
                          <Edit size={14} />
                          Modifier
                        </button>
                      )}

                      {canDelete && (
                        <button
                          onClick={() => setDeleteId(driver.id ?? null)}
                          className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-3 py-2 text-sm font-bold text-white transition hover:bg-rose-700"
                        >
                          <Trash2 className="h-4 w-4" />
                          Supprimer
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {selectedDriver && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-900">
                    {selectedDriver.firstName} {selectedDriver.lastName}
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Détails du conducteur
                  </p>
                </div>

                <button
                  onClick={() => setSelectedDriver(null)}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Fermer
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <InfoRow label="Email" value={selectedDriver.email} />
                <InfoRow label="Téléphone" value={selectedDriver.phone} />
                <InfoRow
                  label="Numéro de permis"
                  value={selectedDriver.licenseNumber}
                />
                <InfoRow
                  label="Expiration permis"
                  value={selectedDriver.licenseExpiry?.split("T")[0] || "—"}
                />
                <InfoRow
                  label="Statut"
                  value={selectedDriver.status || "ACTIVE"}
                />
                <InfoRow
                  label="Eco score"
                  value={
                    selectedDriver.ecoScore !== undefined &&
                    selectedDriver.ecoScore !== null
                      ? String(selectedDriver.ecoScore)
                      : "—"
                  }
                />
              </div>
            </div>
          </div>
        )}

        {deleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-rose-100 p-3">
                  <AlertTriangle className="h-5 w-5 text-rose-600" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">
                    Confirmer la suppression
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">
                    Cette action supprimera le conducteur sélectionné.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-2">
                <button
                  onClick={() => setDeleteId(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  onClick={onDelete}
                  className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white hover:bg-rose-700"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-slate-900">
        {value || "—"}
      </div>
    </div>
  );
}