// src/lib/api.ts
import axios, { AxiosError } from "axios";
import { clearAuthCookies } from "@/lib/utils/cookies";

const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export const api = axios.create({
  baseURL,
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const isPublicAuthEndpoint =
      config.url?.includes("/api/auth/login") ||
      config.url?.includes("/api/auth/register") ||
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

api.interceptors.response.use(
  (res) => res,
  (error: AxiosError<any>) => {
    const status = error.response?.status;
    const data = error.response?.data;

    if (typeof window !== "undefined") {
      const path = window.location.pathname;

      if (status === 403 && data?.mustChangePassword) {
        if (!path.startsWith("/change-password")) {
          window.location.href = "/change-password";
        }
        return Promise.reject(error);
      }

      if (status === 401) {
        const isAuthRecoveryPage =
          path.startsWith("/forgot-password") ||
          path.startsWith("/reset-password");

        if (!isAuthRecoveryPage) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          clearAuthCookies();

          if (!path.startsWith("/login")) {
            window.location.href = "/login";
          }
        }
      }
    }

    return Promise.reject(error);
  }
);