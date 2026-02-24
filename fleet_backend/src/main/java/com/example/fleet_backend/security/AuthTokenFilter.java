package com.example.fleet_backend.security;

import com.example.fleet_backend.service.UserDetailsServiceImpl;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;

import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * ✅ AuthTokenFilter (JWT Filter)
 *
 * Filtre de sécurité exécuté à chaque requête HTTP (une seule fois par requête)
 * grâce à OncePerRequestFilter.
 *
 * Rôle:
 * - Lire le header Authorization
 * - Extraire le token JWT
 * - Valider le token (signature + expiration + format)
 * - Charger l’utilisateur depuis la DB
 * - Remplir le SecurityContext pour que Spring considère la requête authentifiée
 *
 * 📌 Sans ce filtre:
 * - Le backend ne saura pas quel user fait la requête
 * - Les @PreAuthorize / hasRole(...) ne fonctionneront pas correctement
 */
@Component // Rend ce filtre injectable dans Spring (il sera ajouté à la chaîne de filtres)
public class AuthTokenFilter extends OncePerRequestFilter {

    /**
     * ✅ Logger
     * Permet de tracer les erreurs d’authentification (debug + prod)
     */
    private static final Logger logger = LoggerFactory.getLogger(AuthTokenFilter.class);

    /**
     * ✅ JwtUtil:
     * - Valider le token
     * - Extraire le username/email depuis le token
     */
    @Autowired
    private JwtUtil jwtUtil;

    /**
     * ✅ UserDetailsServiceImpl:
     * - Charger l’utilisateur depuis la base (UserDetails + authorities/roles)
     * - Utilisé par Spring Security pour reconstruire l'identité complète
     */
    @Autowired
    private UserDetailsServiceImpl userDetailsService;

    /**
     * ✅ Méthode principale du filtre (appelée à chaque requête)
     *
     * Étapes:
     * 1) Extraire JWT du header
     * 2) Valider JWT
     * 3) Extraire email (subject)
     * 4) Charger UserDetails (roles/authorities)
     * 5) Créer Authentication
     * 6) Mettre Authentication dans SecurityContext
     * 7) Continuer filter chain
     */
    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        try {
            // 1️⃣ Extraire le JWT depuis le header "Authorization"
            String jwt = parseJwt(request);

            // 2️⃣ Vérifier token existe + valide
            if (jwt != null && jwtUtil.validateJwtToken(jwt)) {

                // 3️⃣ Extraire email depuis token (subject)
                String email = jwtUtil.getUserNameFromJwtToken(jwt);

                // 4️⃣ Charger UserDetails depuis DB (avec roles/authorities)
                UserDetails userDetails = userDetailsService.loadUserByUsername(email);

                /**
                 * 5️⃣ Créer Authentication object
                 *
                 * - principal: userDetails (identité)
                 * - credentials: null (pas besoin du password, token déjà validé)
                 * - authorities: rôles/permissions
                 */
                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                                userDetails,
                                null,
                                userDetails.getAuthorities()
                        );

                /**
                 * 6️⃣ Ajouter détails liés à la requête
                 * Exemple:
                 * - IP
                 * - Session ID
                 * - User agent
                 */
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                /**
                 * 7️⃣ Mettre dans le SecurityContext
                 * => Spring sait maintenant que l’utilisateur est authentifié
                 * => @PreAuthorize, hasRole, etc. vont fonctionner
                 */
                SecurityContextHolder.getContext().setAuthentication(authentication);
            }

        } catch (Exception e) {
            /**
             * Si une erreur arrive:
             * - On log
             * - On ne casse pas la requête ici
             * - La config Spring Security gérera (401/403) selon les endpoints
             */
            logger.error("Cannot set user authentication: {}", e.getMessage());
        }

        // 8️⃣ Continuer la chaîne de filtres (obligatoire)
        filterChain.doFilter(request, response);
    }

    /**
     * ✅ Extraire le JWT du header Authorization
     *
     * Format attendu:
     * Authorization: Bearer <token>
     *
     * @return token JWT sans "Bearer " ou null si absent
     */
    private String parseJwt(HttpServletRequest request) {

        // Récupère le header Authorization
        String headerAuth = request.getHeader("Authorization");

        // Vérifier qu'il existe et commence par Bearer
        if (StringUtils.hasText(headerAuth) && headerAuth.startsWith("Bearer ")) {

            // substring(7) supprime "Bearer " (6 lettres + espace)
            return headerAuth.substring(7);
        }

        // Pas de token => requête non authentifiée
        return null;
    }
}