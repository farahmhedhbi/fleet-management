import { api } from "@/lib/api";

export const passwordResetService = {
  forgotPassword(email: string) {
    return api.post("/api/auth/forgot-password", { email });
  },

  // ✅ payload clair
  resetPassword(token: string, newPassword: string) {
    return api.post("/reset-password", {
      token,
      // ⚠️ si ton backend attend "password", remplace la ligne suivante par: password: newPassword
      newPassword,
    });
  },
};
