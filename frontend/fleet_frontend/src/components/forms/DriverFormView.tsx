"use client";

import { FormEvent } from "react";
import {Save,X,User,Mail,Phone,IdCard,Calendar,Shield,ArrowLeft,Info,
} from "lucide-react";
import type { DriverDTO, DriverStatus } from "@/types/driver";
import type { FormErrors } from "./DriverForm";
import { toDateInputValue } from "./DriverForm";

interface DriverFormViewProps {
  isEdit: boolean;
  loading: boolean;
  formData: DriverDTO;
  errors: FormErrors;
  statusOptions: DriverStatus[];
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
  onDateChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: FormEvent) => void;
  onCancel: () => void;
}

export default function DriverFormView({
  isEdit,
  loading,
  formData,
  errors,
  statusOptions,
  onChange,
  onDateChange,
  onSubmit,
  onCancel,
}: DriverFormViewProps) {
  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={onCancel}
            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={18} />
            Retour vers les conducteurs
          </button>

          <h1 className="text-3xl font-bold text-gray-900">
            {isEdit ? "Modifier un conducteur" : "Créer un conducteur"}
          </h1>

          <p className="mt-2 text-gray-600">
            {isEdit
              ? "Mettez à jour les informations du conducteur."
              : "Créez un nouveau conducteur. Un mot de passe temporaire sera généré automatiquement."}
          </p>
        </div>

        <div
          className={`rounded-full border px-4 py-2 text-sm font-semibold ${
            isEdit
              ? "border-amber-200 bg-amber-50 text-amber-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {isEdit ? "Mode modification" : "Mode création"}
        </div>
      </div>

      {!isEdit && (
        <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 p-5">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 h-5 w-5 text-blue-600" />
            <div>
              <h3 className="font-semibold text-blue-900">
                Comportement automatique du backend
              </h3>
              <p className="mt-1 text-sm text-blue-800">
                Lors de la création, le backend génère un mot de passe
                temporaire, oblige le conducteur à changer ce mot de passe à la
                première connexion, puis envoie les accès par email.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <form onSubmit={onSubmit} className="p-8">
          <div className="space-y-10">
            <section>
              <div className="mb-6 flex items-center gap-3">
                <div className="rounded-xl bg-blue-100 p-3">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Informations personnelles
                  </h2>
                  <p className="text-sm text-gray-500">
                    Nom et prénom du conducteur
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <FieldInput
                  id="firstName"
                  name="firstName"
                  label="Prénom *"
                  value={formData.firstName}
                  onChange={onChange}
                  error={errors.firstName}
                  placeholder="Farah"
                  icon={<User className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />}
                />

                <FieldInput
                  id="lastName"
                  name="lastName"
                  label="Nom *"
                  value={formData.lastName}
                  onChange={onChange}
                  error={errors.lastName}
                  placeholder="Ben Ali"
                  icon={<User className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />}
                />
              </div>
            </section>

            <section>
              <div className="mb-6 flex items-center gap-3">
                <div className="rounded-xl bg-emerald-100 p-3">
                  <Mail className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Informations de contact
                  </h2>
                  <p className="text-sm text-gray-500">
                    Email et téléphone utilisés pour le compte
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <FieldInput
                  id="email"
                  name="email"
                  type="email"
                  label="Email *"
                  value={formData.email}
                  onChange={onChange}
                  error={errors.email}
                  placeholder="driver@email.com"
                  icon={<Mail className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />}
                />

                <FieldInput
                  id="phone"
                  name="phone"
                  type="tel"
                  label="Téléphone *"
                  value={formData.phone || ""}
                  onChange={onChange}
                  error={errors.phone}
                  placeholder="+216 12 345 678"
                  icon={<Phone className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />}
                />
              </div>
            </section>

            <section>
              <div className="mb-6 flex items-center gap-3">
                <div className="rounded-xl bg-purple-100 p-3">
                  <IdCard className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Informations du permis
                  </h2>
                  <p className="text-sm text-gray-500">
                    Numéro du permis et date d’expiration
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <FieldInput
                  id="licenseNumber"
                  name="licenseNumber"
                  label="Numéro de permis *"
                  value={formData.licenseNumber}
                  onChange={onChange}
                  error={errors.licenseNumber}
                  placeholder="DL123456"
                  icon={<IdCard className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />}
                />

                <div>
                  <label
                    htmlFor="licenseExpiry"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Date d’expiration du permis *
                  </label>
                  <div className="relative">
                    <Calendar className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <input
                      id="licenseExpiry"
                      name="licenseExpiry"
                      type="date"
                      value={toDateInputValue(formData.licenseExpiry)}
                      onChange={onDateChange}
                      className={`w-full rounded-xl border py-3 pl-10 pr-4 outline-none transition focus:ring-2 focus:ring-blue-500 ${
                        errors.licenseExpiry
                          ? "border-red-300"
                          : "border-gray-300"
                      }`}
                    />
                  </div>
                  <FieldError value={errors.licenseExpiry} />
                </div>
              </div>
            </section>

            {isEdit && (
              <section>
                <div className="mb-6 flex items-center gap-3">
                  <div className="rounded-xl bg-orange-100 p-3">
                    <Shield className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Performance et statut
                    </h2>
                    <p className="text-sm text-gray-500">
                      Disponible uniquement en modification
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label
                      htmlFor="ecoScore"
                      className="mb-2 block text-sm font-medium text-gray-700"
                    >
                      Eco Score
                    </label>
                    <input
                      id="ecoScore"
                      name="ecoScore"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={formData.ecoScore ?? 0}
                      onChange={onChange}
                      className={`w-full rounded-xl border px-4 py-3 outline-none transition focus:ring-2 focus:ring-blue-500 ${
                        errors.ecoScore ? "border-red-300" : "border-gray-300"
                      }`}
                      placeholder="0 à 100"
                    />
                    <FieldError value={errors.ecoScore} />
                  </div>

                  <div>
                    <label
                      htmlFor="status"
                      className="mb-2 block text-sm font-medium text-gray-700"
                    >
                      Statut *
                    </label>
                    <select
                      id="status"
                      name="status"
                      value={formData.status || "ACTIVE"}
                      onChange={onChange}
                      className={`w-full rounded-xl border px-4 py-3 outline-none transition focus:ring-2 focus:ring-blue-500 ${
                        errors.status ? "border-red-300" : "border-gray-300"
                      }`}
                    >
                      {statusOptions.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <FieldError value={errors.status} />
                  </div>
                </div>
              </section>
            )}
          </div>

          <div className="mt-12 border-t border-gray-200 pt-8">
            <div className="flex flex-col gap-4 sm:flex-row">
              <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 px-6 py-3 font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
              >
                <X size={18} />
                Annuler
              </button>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save size={18} />
                {loading
                  ? isEdit
                    ? "Mise à jour..."
                    : "Création..."
                  : isEdit
                  ? "Mettre à jour"
                  : "Créer le conducteur"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function FieldInput({
  id,
  name,
  label,
  value,
  onChange,
  error,
  placeholder,
  icon,
  type = "text",
}: {
  id: string;
  name: string;
  label: string;
  value: string | number;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
  error?: string;
  placeholder?: string;
  icon?: React.ReactNode;
  type?: string;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-medium text-gray-700"
      >
        {label}
      </label>
      <div className="relative">
        {icon}
        <input
          id={id}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          className={`w-full rounded-xl border py-3 pl-10 pr-4 outline-none transition focus:ring-2 focus:ring-blue-500 ${
            error ? "border-red-300" : "border-gray-300"
          }`}
          placeholder={placeholder}
        />
      </div>
      <FieldError value={error} />
    </div>
  );
}

function FieldError({ value }: { value?: string }) {
  if (!value) return null;
  return <p className="mt-2 text-sm text-red-600">{value}</p>;
}