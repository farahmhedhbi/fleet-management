package com.example.fleet_backend.security;

import org.springframework.security.core.Authentication;


public class AuthUtil {
    private AuthUtil() {}
    public static String email(Authentication auth) {
        if (auth == null) return null;
        return auth.getName();
    }

    public static Long userId(Authentication auth) {

        if (auth == null) return null;

        Object principal = auth.getPrincipal();

        if (principal instanceof UserDetailsImpl u) {
            return u.getId();
        }
        return null;
    }

    public static boolean hasRole(Authentication auth, String role) {

        if (auth == null || auth.getAuthorities() == null) return false;

        String r = role == null ? "" : role.trim().toUpperCase();
        if (r.isEmpty()) return false;

        if (!r.startsWith("ROLE_")) r = "ROLE_" + r;

        final String expected = r;

        return auth.getAuthorities().stream()
                .anyMatch(a -> expected.equals(a.getAuthority()));
    }

    public static boolean isAdmin(Authentication auth) {
        return hasRole(auth, "ADMIN");
    }

    public static boolean isOwner(Authentication auth) {
        return hasRole(auth, "OWNER");
    }

    public static boolean isDriver(Authentication auth) {
        return hasRole(auth, "DRIVER");
    }
}