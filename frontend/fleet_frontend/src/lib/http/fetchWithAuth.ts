export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const headers = new Headers(options.headers || {});
  // content-type par défaut si pas présent
  if (!headers.get("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  // ✅ ajouter Authorization
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return fetch(url, { ...options, headers });
}
