export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export function getUser() {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("user");
  return raw ? JSON.parse(raw) : null;
}

// Normalize roles : ["ROLE_OWNER"] => ["OWNER"]
export function getNormalizedRoles(user: any): string[] {
  const roles = user?.roles || user?.authorities || [];
  return roles.map((r: any) => {
    const roleStr = typeof r === "string" ? r : r?.authority;
    return roleStr?.replace("ROLE_", "");
  });
}

export function hasRole(user: any, role: string) {
  const roles = getNormalizedRoles(user);
  return roles.includes(role);
}
