"use client";

import { useMemo, useState, ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

import { RegisterRequest } from "@/types/auth";
import { useAuth } from "@/contexts/authContext";
import RegisterView from "./RegisterView";

export type RoleOption = {
  value: "ROLE_DRIVER" | "ROLE_OWNER" | "ROLE_ADMIN";
  label: string;
  desc: string;
  badge: string;
};

export default function RegisterPage() {
  // ✅ State formulaire
  const [formData, setFormData] = useState<RegisterRequest>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
    role: "ROLE_DRIVER",
    licenseNumber: "",
  });

  // ✅ UI states
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // ✅ Services
  const { register } = useAuth();
  const router = useRouter();

  // ✅ Options roles (pour l’UI)
  const roles: RoleOption[] = useMemo(
    () => [
      {
        value: "ROLE_DRIVER",
        label: "Driver",
        desc: "Accès missions & suivi",
        badge: "bg-sky-50 border-sky-200 text-sky-700",
      },
      {
        value: "ROLE_OWNER",
        label: "Owner",
        desc: "Vue flotte & reporting",
        badge: "bg-emerald-50 border-emerald-200 text-emerald-700",
      },
      {
        value: "ROLE_ADMIN",
        label: "Admin",
        desc: "Gestion complète",
        badge: "bg-violet-50 border-violet-200 text-violet-700",
      },
    ],
    []
  );

  // ✅ Handle change inputs/select
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      // petit bonus: si on change le rôle, on reset licenseNumber si pas DRIVER
      if (name === "role") {
        const nextRole = value as RegisterRequest["role"];
        return {
          ...prev,
          role: nextRole,
          licenseNumber: nextRole === "ROLE_DRIVER" ? prev.licenseNumber ?? "" : "",
        };
      }

      return { ...prev, [name]: value as any };
    });
  };

  // ✅ Submit logique (validation + API)
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (formData.role === "ROLE_DRIVER" && (!formData.licenseNumber || !formData.licenseNumber.trim())) {
      toast.error("License Number obligatoire pour Driver");
      return;
    }

    setLoading(true);
    try {
      // ✅ payload : on enlève licenseNumber si pas DRIVER (optionnel mais propre)
      const payload: RegisterRequest =
        formData.role === "ROLE_DRIVER"
          ? formData
          : ({ ...formData, licenseNumber: undefined } as RegisterRequest);

      const result = await register(payload);

      if (result.success) {
        toast.success("Registration successful!");
        router.push("/dashboard");
      } else {
        toast.error(result.message || "Registration failed");
      }
    } catch {
      toast.error("An error occurred during registration");
    } finally {
      setLoading(false);
    }
  };

  // ✅ on passe tout au composant UI
  return (
    <RegisterView
      formData={formData}
      roles={roles}
      showPassword={showPassword}
      setShowPassword={setShowPassword}
      loading={loading}
      onChange={handleChange}
      onSubmit={handleSubmit}
    />
  );
}