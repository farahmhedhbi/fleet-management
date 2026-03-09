"use client";

import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import DriverForm from "@/components/forms/DriverForm";

export default function NewDriverPage() {
  return (
    <ProtectedRoute
      requiredRoles={["ROLE_OWNER", "ROLE_ADMIN"]}
      requireOwnerActive
    >
      <div className="min-h-screen bg-slate-50 px-6 py-8">
        <DriverForm />
      </div>
    </ProtectedRoute>
  );
}