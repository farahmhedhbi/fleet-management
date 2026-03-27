import { GpsData, VehicleLiveStatusDTO } from "@/types/gps";

const API_BASE = "http://localhost:8080/api/gps";

function getAuthHeaders(): HeadersInit {
  if (typeof window === "undefined") {
    return {};
  }

  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("jwt") ||
    localStorage.getItem("accessToken");

  return token
    ? {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      }
    : {
        "Content-Type": "application/json",
      };
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = `Erreur ${response.status}`;
    try {
      const text = await response.text();
      if (text?.trim()) {
        message = text;
      }
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export const gpsService = {
  async getLiveFleet(): Promise<VehicleLiveStatusDTO[]> {
    const response = await fetch(`${API_BASE}/live`, {
      method: "GET",
      cache: "no-store",
      headers: getAuthHeaders(),
    });
    return handleResponse<VehicleLiveStatusDTO[]>(response);
  },

  async getVehicleLastPosition(vehicleId: number): Promise<GpsData> {
    const response = await fetch(`${API_BASE}/vehicle/${vehicleId}/last`, {
      method: "GET",
      cache: "no-store",
      headers: getAuthHeaders(),
    });
    return handleResponse<GpsData>(response);
  },

  async getVehicleHistory(vehicleId: number): Promise<GpsData[]> {
    const response = await fetch(`${API_BASE}/vehicle/${vehicleId}/history`, {
      method: "GET",
      cache: "no-store",
      headers: getAuthHeaders(),
    });
    return handleResponse<GpsData[]>(response);
  },
};