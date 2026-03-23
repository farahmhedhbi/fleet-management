"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { driverService } from "@/lib/services/driverService";
import type { DriverDTO, DriverStatus } from "@/types/driver";
import type { CreateDriverByOwnerRequest } from "@/types/auth";

import DriverFormView from "./DriverFormView";

export interface DriverFormProps {
  driver?: DriverDTO & { id?: number };
  isEdit?: boolean;
}

export type FormErrors = Partial<
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

export function toDateInputValue(value?: string | null) {
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

  return (
    <DriverFormView
      isEdit={isEdit}
      loading={loading}
      formData={formData}
      errors={errors}
      statusOptions={statusOptions}
      onChange={handleChange}
      onDateChange={handleDateChange}
      onSubmit={handleSubmit}
      onCancel={() => router.push("/drivers")}
    />
  );
}