"use client";

import { FormEvent, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { useAuth } from "@/contexts/authContext";
import LoginView from "./LoginView";

export type TestAccount = {
  role: string;
  email: string;
  pass: string;
  color: string;
  chip: string;
};

export default function LoginPage() {
  const [email, setEmail] = useState("admin@fleet.com");
  const [password, setPassword] = useState("admin123");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();

  const testAccounts = useMemo<TestAccount[]>(
    () => [
      {
        role: "Admin",
        email: "admin@fleet.com",
        pass: "admin123",
        color: "text-sky-700",
        chip: "bg-sky-50 border-sky-200",
      },
      {
        role: "Owner",
        email: "owner@fleet.com",
        pass: "owner123",
        color: "text-emerald-700",
        chip: "bg-emerald-50 border-emerald-200",
      },
      {
        role: "Driver",
        email: "driver@fleet.com",
        pass: "driver123",
        color: "text-violet-700",
        chip: "bg-violet-50 border-violet-200",
      },
    ],
    []
  );

  const handleFillTestAccount = (account: TestAccount) => {
    setEmail(account.email);
    setPassword(account.pass);
    toast.info(`Loaded ${account.role} account`);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const result = await login({ email, password });
      if (result.success) {
        if (result.mustChangePassword) {
          toast.info("Vous devez changer votre mot de passe avant de continuer.");
        } else {
          toast.success("Login successful!");
        }
      } else {
        toast.error(result.message || "Invalid credentials");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(error?.message || "An error occurred during login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoginView
      email={email}
      password={password}
      showPassword={showPassword}
      loading={loading}
      testAccounts={testAccounts}
      onEmailChange={setEmail}
      onPasswordChange={setPassword}
      onToggleShowPassword={() => setShowPassword((v) => !v)}
      onFillTestAccount={handleFillTestAccount}
      onSubmit={handleSubmit}
    />
  );
}