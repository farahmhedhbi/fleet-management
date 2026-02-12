package com.example.fleet_backend.security;

import com.example.fleet_backend.service.UserDetailsImpl;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;

/**
 * Classe utilitaire (helper) pour éviter de répéter du code partout:
 * - récupérer l'id de l'utilisateur connecté
 * - vérifier s'il possède un rôle
 */
public class AuthUtil {

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

    /**
     * Vérifie si l'utilisateur a un rôle donné.
     *
     * On construit le format Spring Security "ROLE_XXX"
     * Exemple: roleNoPrefix="admin" -> wanted="ROLE_ADMIN"
     *
     * @param roleNoPrefix rôle sans "ROLE_" (ex: "ADMIN", "OWNER")
     * @return true si l'utilisateur possède ce rôle
     */
    public static boolean hasRole(Authentication auth, String roleNoPrefix) {

        // Standard Spring Security: les rôles sont généralement préfixés par "ROLE_"
        String wanted = "ROLE_" + roleNoPrefix.toUpperCase();

        // auth.getAuthorities() contient toutes les permissions/roles de l'utilisateur
        for (GrantedAuthority a : auth.getAuthorities()) {
            if (wanted.equals(a.getAuthority())) return true;
        }
        return false;
    }

    /**
     * Raccourci pratique: vérifie si l'utilisateur est ADMIN.
     */
    public static boolean isAdmin(Authentication auth) {
        return hasRole(auth, "ADMIN");
    }
}
