import {
  DispatchSuggestionDTO,
  SmartAssignmentRequest,
  SmartDailyPlanningRequest,
} from "@/types/dispatch";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

function getToken() {
  return localStorage.getItem("token");
}

async function request<T>(url: string, body: unknown): Promise<T> {
  const token = getToken();

  const res = await fetch(`${API_URL}${url}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Erreur serveur");
  }

  return res.json();
}

export async function smartAssignment(
  payload: SmartAssignmentRequest
): Promise<DispatchSuggestionDTO> {
  return request<DispatchSuggestionDTO>(
    "/api/owner/dispatch/smart-assignment",
    payload
  );
}

export async function smartDailyPlanning(
  payload: SmartDailyPlanningRequest
): Promise<DispatchSuggestionDTO> {
  return request<DispatchSuggestionDTO>(
    "/api/owner/dispatch/daily-planning",
    payload
  );
}

export async function confirmDailyPlanning(
  suggestion: DispatchSuggestionDTO
): Promise<any[]> {
  return request<any[]>("/api/owner/dispatch/confirm-daily-planning", {
    suggestion,
  });
}