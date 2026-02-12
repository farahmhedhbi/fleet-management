package com.example.fleet_backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.List;

@Configuration
public class CorsConfig {
    // Annotation qui indique que cette méthode crée un Bean Spring
    // Ce Bean sera automatiquement enregistré dans le contexte Spring
    @Bean
    public CorsFilter corsFilter() {
        // Création d’un objet de configuration CORS
        CorsConfiguration config = new CorsConfiguration();
        // Autorise l’envoi des cookies, tokens et informations d’authentification
        // IMPORTANT pour JWT si tu utilises Authorization header
        config.setAllowCredentials(true);

        // Définit les origines autorisées à accéder au backend
        // Ici on autorise uniquement le frontend Next.js en local
        config.setAllowedOrigins(List.of("http://localhost:3000"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowedMethods(List.of("GET","POST","PUT","DELETE","OPTIONS"));
        config.setExposedHeaders(List.of("Authorization"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return new CorsFilter(source);
    }
}
