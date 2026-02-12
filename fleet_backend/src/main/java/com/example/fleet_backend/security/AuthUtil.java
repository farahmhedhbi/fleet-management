package com.example.fleet_backend.security;

import org.springframework.security.core.Authentication;

/**
 * Classe utilitaire (helper) pour éviter de répéter du code partout:
 * - récupérer l'id de l'utilisateur connecté
 * - vérifier s'il possède un rôle
 */
public class AuthUtil {
    private AuthUtil() {}

    public static String email(Authentication auth) {
        if (auth == null) return null;
        return auth.getName(); // email si UserDetails.username = email
    }

    /**
     * Retourne l'ID de l'utilisateur connecté à partir de Authentication.
     *
     * auth.getPrincipal() contient l'utilisateur "principal" authentifié.
     * Ici, notre principal est une implémentation custom: UserDetailsImpl.
     *
     * @return id utilisateur (Long) ou null si non authentifié / principal différent
     */
    public static Long userId(Authentication auth) {
        Object principal = auth.getPrincipal();

        // Java pattern matching: si principal est UserDetailsImpl, on le cast dans "u"
        if (principal instanceof UserDetailsImpl u) return u.getId();

        // null => pas de userDetails custom (ex: anonymous user)
        return null;
    }

    public static boolean hasRole(Authentication auth, String role) {
        if (auth == null || auth.getAuthorities() == null) return false;

        String r = role == null ? "" : role.trim().toUpperCase();
        if (r.isEmpty()) return false;

        // Accepte "OWNER" ou "ROLE_OWNER"
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
