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

@Component // Déclare ce filtre comme un Bean Spring, injecté dans la chaîne de sécurité
public class AuthTokenFilter extends OncePerRequestFilter {

    // Logger pour tracer erreurs et problèmes d'authentification
    private static final Logger logger = LoggerFactory.getLogger(AuthTokenFilter.class);

    @Autowired
    private JwtUtil jwtUtil; // Utilitaire JWT: validate + extraction du username/email

    @Autowired
    private UserDetailsServiceImpl userDetailsService; // Charge l'utilisateur depuis DB (Spring Security)

    /**
     * doFilterInternal est exécutée une seule fois par requête HTTP (OncePerRequestFilter).
     * But: vérifier le token JWT et remplir le SecurityContext si token valide.
     */
    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        try {
            // 1) Extraire le JWT depuis le header Authorization: "Bearer <token>"
            String jwt = parseJwt(request);

            // 2) Vérifier que le token existe et est valide (signature + expiration + format)
            if (jwt != null && jwtUtil.validateJwtToken(jwt)) {

                // 3) Extraire l'identifiant (subject) du token (ici: email)
                String email = jwtUtil.getUserNameFromJwtToken(jwt);

                // 4) Charger les détails utilisateur (roles/authorities) depuis la base via UserDetailsService
                UserDetails userDetails = userDetailsService.loadUserByUsername(email);

                // 5) Créer un objet Authentication que Spring Security va utiliser
                //    - principal: userDetails
                //    - credentials: null (car déjà validé par JWT, pas besoin de mot de passe)
                //    - authorities: roles/permissions
                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                                userDetails,
                                null,
                                userDetails.getAuthorities()
                        );

                // 6) Ajouter des infos liées à la requête (IP, session, user-agent...) comme détails
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                // 7) Stocker l'auth dans le SecurityContext -> Spring saura que l'utilisateur est authentifié
                SecurityContextHolder.getContext().setAuthentication(authentication);
            }

        } catch (Exception e) {
            // Si un problème arrive, on log l'erreur mais on ne casse pas la requête ici.
            // La suite de Spring Security gérera l'accès (403/401 selon config).
            logger.error("Cannot set user authentication: {}", e.getMessage());
        }

        // 8) Continuer la chaîne des filtres (obligatoire)
        filterChain.doFilter(request, response);
    }

    /**
     * Récupère le token depuis le header Authorization.
     * Format attendu: "Bearer <jwt>"
     */
    private String parseJwt(HttpServletRequest request) {
        String headerAuth = request.getHeader("Authorization");

        // Vérifie que le header n'est pas vide et commence par "Bearer "
        if (StringUtils.hasText(headerAuth) && headerAuth.startsWith("Bearer ")) {
            // substring(7) pour enlever "Bearer " (6 lettres + espace)
            return headerAuth.substring(7);
        }

        return null; // pas de token -> utilisateur non authentifié
    }
}
