"use client";

import { FormEvent, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { useAuth } from "@/contexts/authContext";
import RegisterView from "./RegisterView";

export type RegisterFormData = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  role: "ROLE_OWNER";
};

export type OwnerBadge = {
  label: string;
  desc: string;
  badge: string;
};

export default function RegisterPage() {
  const { register } = useAuth();

  const [formData, setFormData] = useState<RegisterFormData>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
    role: "ROLE_OWNER",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  const ownerBadge = useMemo<OwnerBadge>(
    () => ({
      label: "Owner",
      desc: "Gestion flotte, conducteurs, véhicules et reporting",
      badge: "bg-emerald-50 border-emerald-200 text-emerald-700",
    }),
    []
  );

  const onChange = (key: keyof RegisterFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const validate = () => {
    if (
      !formData.firstName.trim() ||
      !formData.lastName.trim() ||
      !formData.email.trim() ||
      !formData.password.trim()
    ) {
      toast.error("Veuillez remplir tous les champs obligatoires.");
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      toast.error("Veuillez saisir une adresse email valide.");
      return false;
    }

    if (formData.password.trim().length < 6) {
      toast.error("Le mot de passe doit contenir au moins 6 caractères.");
      return false;
    }

    if (formData.phone.trim() && !/^[+]?[0-9\s\-()]{6,20}$/.test(formData.phone.trim())) {
      toast.error("Veuillez saisir un numéro de téléphone valide.");
      return false;
    }

    if (!accepted) {
      toast.error("Veuillez accepter les conditions d’utilisation.");
      return false;
    }

    return true;
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);

    try {
      const result = await register({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        phone: formData.phone.trim(),
        role: "ROLE_OWNER",
      });

      if (!result.success) {
        toast.error(result.message || "Échec de l'inscription");
        return;
      }

      toast.success("Compte créé avec succès.");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Une erreur est survenue pendant l'inscription."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <RegisterView
      formData={formData}
      showPassword={showPassword}
      accepted={accepted}
      loading={loading}
      ownerBadge={ownerBadge}
      onChange={onChange}
      onToggleShowPassword={() => setShowPassword((v) => !v)}
      onAcceptedChange={setAccepted}
      onSubmit={onSubmit}
    />
  );
}