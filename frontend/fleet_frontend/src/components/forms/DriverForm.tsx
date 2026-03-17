"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import {
  Save,
  X,
  User,
  Mail,
  Phone,
  IdCard,
  Calendar,
  Shield,
  ArrowLeft,
  Info,
} from "lucide-react";
import { driverService } from "@/lib/services/driverService";
import type { DriverDTO, DriverStatus } from "@/types/driver";
import type { CreateDriverByOwnerRequest } from "@/types/auth";

interface DriverFormProps {
  driver?: DriverDTO & { id?: number };
  isEdit?: boolean;
}

type FormErrors = Partial<
  Record<
    | "firstName"
    | "lastName"
    | "email"
    | "phone"
    | "licenseNumber"
    | "licenseExpiry"
    | "ecoScore"
    | "status",
    string
  >
>;

function toDateInputValue(value?: string | null) {
  if (!value) return "";
  return value.split("T")[0];
}

export default function DriverForm({
  driver,
  isEdit = false,
}: DriverFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<DriverDTO>({
    firstName: driver?.firstName || "",
    lastName: driver?.lastName || "",
    email: driver?.email || "",
    phone: driver?.phone || "",
    licenseNumber: driver?.licenseNumber || "",
    licenseExpiry: driver?.licenseExpiry || "",
    ecoScore: driver?.ecoScore ?? 0,
    status: driver?.status || "ACTIVE",
  });

  const [errors, setErrors] = useState<FormErrors>({});

  const statusOptions: DriverStatus[] = useMemo(
    () => ["ACTIVE", "INACTIVE", "ON_LEAVE", "SUSPENDED"],
    []
  );

  function validateForm(values: DriverDTO) {
    const nextErrors: FormErrors = {};

    if (!values.firstName?.trim()) {
      nextErrors.firstName = "Le prénom est obligatoire.";
    } else if (values.firstName.trim().length < 2) {
      nextErrors.firstName = "Le prénom doit contenir au moins 2 caractères.";
    }

    if (!values.lastName?.trim()) {
      nextErrors.lastName = "Le nom est obligatoire.";
    } else if (values.lastName.trim().length < 2) {
      nextErrors.lastName = "Le nom doit contenir au moins 2 caractères.";
    }

    if (!values.email?.trim()) {
      nextErrors.email = "L’email est obligatoire.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
      nextErrors.email = "Veuillez saisir une adresse email valide.";
    }

    if (!values.phone?.trim()) {
      nextErrors.phone = "Le numéro de téléphone est obligatoire.";
    } else if (!/^[+]?[0-9\s\-()]{6,20}$/.test(values.phone.trim())) {
      nextErrors.phone = "Veuillez saisir un numéro de téléphone valide.";
    }

    if (!values.licenseNumber?.trim()) {
      nextErrors.licenseNumber = "Le numéro de permis est obligatoire.";
    } else if (values.licenseNumber.trim().length < 4) {
      nextErrors.licenseNumber =
        "Le numéro de permis doit contenir au moins 4 caractères.";
    }

    if (!values.licenseExpiry?.trim()) {
      nextErrors.licenseExpiry =
        "La date d’expiration du permis est obligatoire.";
    } else {
      const expiry = new Date(values.licenseExpiry);
      const today = new Date();

      if (Number.isNaN(expiry.getTime())) {
        nextErrors.licenseExpiry = "Date d’expiration invalide.";
      } else {
        today.setHours(0, 0, 0, 0);
        expiry.setHours(0, 0, 0, 0);

        if (expiry <= today) {
          nextErrors.licenseExpiry =
            "La date d’expiration doit être supérieure à aujourd’hui.";
        }
      }
    }

    if (isEdit) {
      if (
        values.ecoScore !== undefined &&
        values.ecoScore !== null &&
        (values.ecoScore < 0 || values.ecoScore > 100)
      ) {
        nextErrors.ecoScore = "Le score écologique doit être entre 0 et 100.";
      }

      if (!values.status) {
        nextErrors.status = "Le statut est obligatoire.";
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value, type } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "number"
          ? value === ""
            ? 0
            : Number(value)
          : value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: undefined,
    }));
  }

  function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value ? `${value}T00:00:00` : "",
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: undefined,
    }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const ok = validateForm(formData);
    if (!ok) {
      toast.error("Merci de corriger les erreurs du formulaire.");
      return;
    }

    setLoading(true);

    try {
      if (isEdit && driver?.id) {
        const payload: DriverDTO = {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone?.trim() || "",
          licenseNumber: formData.licenseNumber.trim(),
          licenseExpiry: formData.licenseExpiry || undefined,
          ecoScore: formData.ecoScore ?? 0,
          status: formData.status || "ACTIVE",
        };

        await driverService.update(driver.id, payload);
        toast.success("Conducteur mis à jour avec succès.");
      } else {
        const payload: CreateDriverByOwnerRequest = {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone?.trim() || "",
          licenseNumber: formData.licenseNumber.trim(),
          licenseExpiry: formData.licenseExpiry || null,
        };

        await driverService.create(payload);
        toast.success(
          "Conducteur créé avec succès. Un email contenant les identifiants temporaires a été envoyé. Le conducteur devra changer son mot de passe à la première connexion."
        );
      }

      router.push("/drivers");
      router.refresh();
    } catch (error: any) {
      const rawMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.response?.data?.details ||
        error?.message ||
        "Erreur lors de l’enregistrement.";

      const lower = String(rawMessage).toLowerCase();

      if (
        lower.includes("email already exists") ||
        lower.includes("email already used")
      ) {
        setErrors((prev) => ({
          ...prev,
          email: "Cet email existe déjà.",
        }));
        toast.error("Cet email existe déjà.");
      } else if (lower.includes("phone already exists")) {
        setErrors((prev) => ({
          ...prev,
          phone: "Ce numéro de téléphone existe déjà.",
        }));
        toast.error("Ce numéro de téléphone existe déjà.");
      } else if (
        lower.includes("license number already exists") ||
        lower.includes("license number already used")
      ) {
        setErrors((prev) => ({
          ...prev,
          licenseNumber: "Ce numéro de permis existe déjà.",
        }));
        toast.error("Ce numéro de permis existe déjà.");
      } else {
        toast.error(String(rawMessage));
      }
    } finally {
      setLoading(false);
    }
  }

  function FieldError({ value }: { value?: string }) {
    if (!value) return null;
    return <p className="mt-2 text-sm text-red-600">{value}</p>;
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={() => router.push("/drivers")}
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
        <form onSubmit={handleSubmit} className="p-8">
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
                <div>
                  <label
                    htmlFor="firstName"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Prénom *
                  </label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      value={formData.firstName}
                      onChange={handleChange}
                      className={`w-full rounded-xl border py-3 pl-10 pr-4 outline-none transition focus:ring-2 focus:ring-blue-500 ${
                        errors.firstName ? "border-red-300" : "border-gray-300"
                      }`}
                      placeholder="Farah"
                    />
                  </div>
                  <FieldError value={errors.firstName} />
                </div>

                <div>
                  <label
                    htmlFor="lastName"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Nom *
                  </label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      value={formData.lastName}
                      onChange={handleChange}
                      className={`w-full rounded-xl border py-3 pl-10 pr-4 outline-none transition focus:ring-2 focus:ring-blue-500 ${
                        errors.lastName ? "border-red-300" : "border-gray-300"
                      }`}
                      placeholder="Ben Ali"
                    />
                  </div>
                  <FieldError value={errors.lastName} />
                </div>
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
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Email *
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full rounded-xl border py-3 pl-10 pr-4 outline-none transition focus:ring-2 focus:ring-blue-500 ${
                        errors.email ? "border-red-300" : "border-gray-300"
                      }`}
                      placeholder="driver@email.com"
                    />
                  </div>
                  <FieldError value={errors.email} />
                </div>

                <div>
                  <label
                    htmlFor="phone"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Téléphone *
                  </label>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone || ""}
                      onChange={handleChange}
                      className={`w-full rounded-xl border py-3 pl-10 pr-4 outline-none transition focus:ring-2 focus:ring-blue-500 ${
                        errors.phone ? "border-red-300" : "border-gray-300"
                      }`}
                      placeholder="+216 12 345 678"
                    />
                  </div>
                  <FieldError value={errors.phone} />
                </div>
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
                <div>
                  <label
                    htmlFor="licenseNumber"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Numéro de permis *
                  </label>
                  <div className="relative">
                    <IdCard className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <input
                      id="licenseNumber"
                      name="licenseNumber"
                      type="text"
                      value={formData.licenseNumber}
                      onChange={handleChange}
                      className={`w-full rounded-xl border py-3 pl-10 pr-4 outline-none transition focus:ring-2 focus:ring-blue-500 ${
                        errors.licenseNumber
                          ? "border-red-300"
                          : "border-gray-300"
                      }`}
                      placeholder="DL123456"
                    />
                  </div>
                  <FieldError value={errors.licenseNumber} />
                </div>

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
                      onChange={handleDateChange}
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
                      onChange={handleChange}
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
                      onChange={handleChange}
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
                onClick={() => router.push("/drivers")}
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