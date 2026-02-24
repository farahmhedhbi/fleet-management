package com.example.fleet_backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.Arrays;
import java.util.List;

/**
 *  CorsConfig
 *
 * Configuration CORS globale pour permettre au frontend
 * (ex: React / Next.js) de communiquer avec le backend.
 *
 * Important car :
 * - Frontend tourne souvent sur http://localhost:3000
 * - Backend sur http://localhost:8080
 * → Navigateur bloque par défaut (Same-Origin Policy)
 */
@Configuration
public class CorsConfig {

    /**
     *  Origines autorisées
     *
     * Récupéré depuis application.properties :
     * cors.allowed-origins=http://localhost:3000
     *
     * Peut contenir plusieurs URLs séparées par virgule.
     */
    @Value("${cors.allowed-origins:http://localhost:3000}")
    private String allowedOrigins;

    /**
     *  Bean CorsFilter global
     *
     * Appliqué à toutes les routes (/**)
     */
    @Bean
    public CorsFilter corsFilter() {

        CorsConfiguration config = new CorsConfiguration();

        /**
         * Convertit la String (séparée par virgule)
         * en liste d'origines autorisées.
         */
        List<String> origins = Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();

        // Autorise uniquement ces origines
        config.setAllowedOrigins(origins);

        /**
         * Autorise l'envoi de cookies / Authorization header
         * Important pour JWT.
         */
        config.setAllowCredentials(true);

        /**
         * Méthodes HTTP autorisées
         */
        config.setAllowedMethods(
                List.of("GET","POST","PUT","DELETE","OPTIONS")
        );

        /**
         * Headers autorisés côté client
         */
        config.setAllowedHeaders(
                List.of("Authorization","Content-Type")
        );

        /**
         * Headers exposés au frontend
         * Permet de lire Authorization dans la réponse si nécessaire.
         */
        config.setExposedHeaders(
                List.of("Authorization")
        );

        /**
         * Applique la configuration CORS
         * à toutes les routes.
         */
        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration("/**", config);

        return new CorsFilter(source);
    }
}