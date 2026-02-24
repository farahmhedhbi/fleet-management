package com.example.fleet_backend.security;

import org.springframework.security.core.Authentication;

/**
 * ✅ AuthUtil
 *
 * Classe utilitaire (helper) pour centraliser la logique liée
 * à l'utilisateur connecté via Spring Security.
 *
 * Objectif:
 * - Éviter de répéter le même code dans les services
 * - Simplifier la vérification des rôles
 * - Extraire facilement l’ID ou l’email du user connecté
 *
 * ⚠️ Classe statique (pas un Bean Spring)
 * - Toutes les méthodes sont static
 * - Constructeur privé pour empêcher l'instanciation
 */
public class AuthUtil {

    /**
     * Constructeur privé:
     * Empêche la création d'instance (classe purement utilitaire).
     */
    private AuthUtil() {}

    /**
     * ✅ Retourne l'email de l'utilisateur connecté.
     *
     * auth.getName() correspond à:
     * - username dans Spring Security
     * - dans ton système = email
     *
     * @param auth objet Authentication injecté par Spring
     * @return email ou null si non authentifié
     */
    public static String email(Authentication auth) {
        if (auth == null) return null;
        return auth.getName();
    }

    /**
     * ✅ Retourne l'ID de l'utilisateur connecté.
     *
     * Explication:
     * - auth.getPrincipal() contient l'utilisateur authentifié
     * - Dans ton projet, c'est un UserDetailsImpl
     * - On récupère l'id depuis cet objet
     *
     * Java Pattern Matching:
     * if (principal instanceof UserDetailsImpl u)
     * → cast automatique vers u
     *
     * @param auth Authentication
     * @return id utilisateur ou null si non authentifié
     */
    public static Long userId(Authentication auth) {

        if (auth == null) return null;

        Object principal = auth.getPrincipal();

        // Si le principal est ton UserDetailsImpl custom
        if (principal instanceof UserDetailsImpl u) {
            return u.getId();
        }

        // Sinon (ex: utilisateur anonyme)
        return null;
    }

    /**
     * ✅ Vérifie si l'utilisateur possède un rôle donné.
     *
     * Accepte:
     * - "OWNER"
     * - "ROLE_OWNER"
     *
     * Normalisation:
     * - Trim
     * - Uppercase
     * - Ajoute automatiquement "ROLE_" si absent
     *
     * @param auth Authentication
     * @param role rôle à vérifier
     * @return true si l'utilisateur possède ce rôle
     */
    public static boolean hasRole(Authentication auth, String role) {

        if (auth == null || auth.getAuthorities() == null) return false;

        // Normalisation du rôle demandé
        String r = role == null ? "" : role.trim().toUpperCase();
        if (r.isEmpty()) return false;

        // Ajouter prefix ROLE_ si nécessaire
        if (!r.startsWith("ROLE_")) r = "ROLE_" + r;

        final String expected = r;

        // Vérifier dans les authorities
        return auth.getAuthorities().stream()
                .anyMatch(a -> expected.equals(a.getAuthority()));
    }

    /**
     * ✅ Raccourci: vérifier si l'utilisateur est ADMIN
     */
    public static boolean isAdmin(Authentication auth) {
        return hasRole(auth, "ADMIN");
    }

    /**
     * ✅ Raccourci: vérifier si l'utilisateur est OWNER
     */
    public static boolean isOwner(Authentication auth) {
        return hasRole(auth, "OWNER");
    }

    /**
     * ✅ Raccourci: vérifier si l'utilisateur est DRIVER
     */
    public static boolean isDriver(Authentication auth) {
        return hasRole(auth, "DRIVER");
    }
}