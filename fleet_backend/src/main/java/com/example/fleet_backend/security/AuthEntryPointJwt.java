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

@Component // Bean Spring : sera injecté dans la config Security
public class AuthEntryPointJwt implements AuthenticationEntryPoint {

    private static final Logger logger = LoggerFactory.getLogger(AuthEntryPointJwt.class);

    /**
     * Méthode appelée automatiquement quand un utilisateur essaye d'accéder à une ressource protégée
     * sans être authentifié (pas de token / token invalide).
     *
     * Le rôle principal de cette classe est de renvoyer un code HTTP 401 au client.
     */
    @Override
    public void commence(HttpServletRequest request,
                         HttpServletResponse response,
                         AuthenticationException authException)
            throws IOException, ServletException {

        // Log l'erreur côté serveur (utile pour debug)
        logger.error("Unauthorized error: {}", authException.getMessage());

        // Réponse HTTP : 401 Unauthorized
        response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Error: Unauthorized");
    }
}
