// src/lib/utils/cookies.ts
export function setAuthCookies(token: string, role: string) {
  // cookies lisibles par middleware (pas httpOnly car set côté client)
  document.cookie = `token=${encodeURIComponent(token)}; Path=/; SameSite=Lax`;
  document.cookie = `role=${encodeURIComponent(role)}; Path=/; SameSite=Lax`;
}

export function clearAuthCookies() {
  document.cookie = "token=; Path=/; Max-Age=0; SameSite=Lax";
  document.cookie = "role=; Path=/; Max-Age=0; SameSite=Lax";
}