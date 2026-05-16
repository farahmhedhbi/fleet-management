import type {
  CreateDepotRequest,
  DepotVehicleDTO,
  OwnerDepot,
} from "@/types/depot";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();

  const res = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  if (res.status === 204) {
    return null as T;
  }

  return res.json();
}

export const ownerDepotService = {
  getDepot() {
    return request<OwnerDepot | null>("/api/owner/depot");
  },

  createOrUpdateDepot(payload: CreateDepotRequest) {
    return request<OwnerDepot>("/api/owner/depot", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  disableDepot() {
    return request<void>("/api/owner/depot/disable", {
      method: "POST",
    });
  },

  getDepotVehicles() {
    return request<DepotVehicleDTO[]>("/api/owner/depot/vehicles");
  },
};