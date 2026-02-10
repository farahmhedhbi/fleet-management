package com.example.fleet_backend.security;

import com.example.fleet_backend.service.UserDetailsImpl;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;

public class AuthUtil {

    public static Long userId(Authentication auth) {
        Object principal = auth.getPrincipal();
        if (principal instanceof UserDetailsImpl u) return u.getId();
        return null;
    }

    public static boolean hasRole(Authentication auth, String roleNoPrefix) {
        String wanted = "ROLE_" + roleNoPrefix.toUpperCase();
        for (GrantedAuthority a : auth.getAuthorities()) {
            if (wanted.equals(a.getAuthority())) return true;
        }
        return false;
    }

    public static boolean isAdmin(Authentication auth) {
        return hasRole(auth, "ADMIN");
    }
}
