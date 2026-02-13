// src/lib/api.ts
import axios, { AxiosError } from "axios";

const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export const api = axios.create({
  baseURL,
  timeout: 15000,
});

// ✅ Attach token (sauf forgot/reset)
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const isPublicAuthEndpoint =
      config.url?.includes("/api/auth/forgot-password") ||
      config.url?.includes("/api/auth/reset-password");

    if (!isPublicAuthEndpoint) {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
  }
  return config;
});

// ✅ Handle errors
api.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => {
    const status = error.response?.status;

    if (status === 401 && typeof window !== "undefined") {
      const path = window.location.pathname;

      // ✅ ne pas forcer redirect sur forgot/reset
      if (path.startsWith("/forgot-password") || path.startsWith("/reset-password")) {
        return Promise.reject(error);
      }

      localStorage.removeItem("token");
      localStorage.removeItem("user");

      if (!path.startsWith("/login")) {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);
