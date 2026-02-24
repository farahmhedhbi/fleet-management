package com.example.fleet_backend.security;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * ✅ AuthEntryPointJwt
 *
 * Composant Spring Security qui gère le cas:
 * 👉 un utilisateur tente d’accéder à une ressource protégée
 *    alors qu’il n’est PAS authentifié.
 *
 * Exemple de causes:
 * - pas de header Authorization
 * - token JWT manquant
 * - token invalide / expiré
 *
 * Rôle:
 * - retourner une réponse HTTP 401 Unauthorized au client
 * - loguer l’erreur côté serveur pour debug
 *
 * @Component:
 * - Bean Spring injecté dans la configuration Security (SecurityFilterChain)
 * - utilisé via exceptionHandling().authenticationEntryPoint(...)
 */
@Component
public class AuthEntryPointJwt implements AuthenticationEntryPoint {

    /**
     * ✅ Logger
     * - utile pour tracer les erreurs d’accès non autorisé
     */
    private static final Logger logger = LoggerFactory.getLogger(AuthEntryPointJwt.class);

    /**
     * ✅ Méthode appelée automatiquement par Spring Security
     * lorsqu'une requête non authentifiée vise un endpoint protégé.
     *
     * En pratique:
     * - Spring Security détecte l'absence d'authentification
     * - Il déclenche AuthenticationEntryPoint
     * - Cette méthode construit la réponse HTTP 401
     *
     * @param request requête HTTP entrante
     * @param response réponse HTTP sortante
     * @param authException exception de type AuthenticationException
     */
    @Override
    public void commence(HttpServletRequest request,
                         HttpServletResponse response,
                         AuthenticationException authException)
            throws IOException, ServletException {

        // ✅ Log l'erreur côté serveur (utile pour debug / audit)
        logger.error("Unauthorized error: {}", authException.getMessage());

        // ✅ Réponse HTTP 401
        // Le frontend recevra 401 et pourra rediriger vers /login ou afficher un message
        response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Error: Unauthorized");
    }
}