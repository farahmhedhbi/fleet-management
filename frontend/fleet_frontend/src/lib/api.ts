// src/lib/api.ts
import axios, { AxiosError } from "axios";

const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export const api = axios.create({
  baseURL, // => http://localhost:8080
  timeout: 15000,
});

// Attach token
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle errors
api.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => {
    const status = error.response?.status;

    // ✅ 401 = pas connecté / token expiré => logout
    if (status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // évite boucle si déjà sur login
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }

    // ✅ 403 = connecté mais interdit => NE PAS logout (sinon owner => retour login)
    return Promise.reject(error);
  }
);
