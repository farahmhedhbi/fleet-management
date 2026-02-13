export function setAuthCookies(token: string, role: string) {
  // 7 jours (tu peux changer)
  const maxAge = 60 * 60 * 24 * 7;

  document.cookie = `token=${token}; path=/; max-age=${maxAge}`;
  document.cookie = `role=${role}; path=/; max-age=${maxAge}`;
}

export function clearAuthCookies() {
  document.cookie = `token=; path=/; max-age=0`;
  document.cookie = `role=; path=/; max-age=0`;
}
