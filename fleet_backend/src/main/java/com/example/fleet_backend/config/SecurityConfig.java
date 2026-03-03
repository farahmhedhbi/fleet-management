package com.example.fleet_backend.config;

import com.example.fleet_backend.security.AuthEntryPointJwt;
import com.example.fleet_backend.security.AuthTokenFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 *  SecurityConfig
 *
 * Configuration centrale de Spring Security.
 *
 * Gère :
 * - JWT Authentication
 * - Autorisation par rôles
 * - Désactivation sessions (STATELESS)
 * - Gestion erreurs 401
 * - Configuration endpoints protégés
 */
@Configuration
@EnableMethodSecurity(prePostEnabled = true) // Active @PreAuthorize
public class SecurityConfig {

    private final AuthTokenFilter authTokenFilter;
    private final AuthEntryPointJwt unauthorizedHandler;

    // Injection des composants sécurité
    public SecurityConfig(AuthTokenFilter authTokenFilter,
                          AuthEntryPointJwt unauthorizedHandler) {
        this.authTokenFilter = authTokenFilter;
        this.unauthorizedHandler = unauthorizedHandler;
    }

    /**
     * Configuration principale du filtre de sécurité
     */
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

        http
                // Autorise CORS
                .cors(Customizer.withDefaults())

                // Désactive CSRF (car API stateless JWT)
                .csrf(csrf -> csrf.disable())

                //  Pas de session serveur (JWT uniquement)
                .sessionManagement(sm ->
                        sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )

                //  Gestion des erreurs 401 personnalisée
                .exceptionHandling(ex ->
                        ex.authenticationEntryPoint(unauthorizedHandler)
                )

                // ==============================
                //  Configuration des accès
                // ==============================
                .authorizeHttpRequests(auth -> auth

                        //  Preflight CORS (important pour frontend)
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // ==========================
                        // AUTH PUBLIC
                        // ==========================
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers(
                                "/api/auth/forgot-password",
                                "/api/auth/reset-password"
                        ).permitAll()

                        // ==========================
                        // 🚗 DRIVER
                        // ==========================
                        .requestMatchers(HttpMethod.GET,
                                "/api/drivers/me")
                        .hasAuthority("ROLE_DRIVER")

                        // ==========================
                        // 🚙 VEHICLES READ
                        // ==========================
                        .requestMatchers(HttpMethod.GET,
                                "/api/vehicles/**")
                        .hasAnyAuthority(
                                "ROLE_DRIVER",
                                "ROLE_OWNER",
                                "ROLE_ADMIN"
                        )

                        // ==========================
                        // 👤 DRIVERS MANAGEMENT
                        // ==========================
                        .requestMatchers("/api/drivers/**")
                        .hasAnyAuthority(
                                "ROLE_OWNER",
                                "ROLE_ADMIN"
                        )

                        // ==========================
                        // 🚘 VEHICLES WRITE
                        // ==========================
                        .requestMatchers(HttpMethod.POST,
                                "/api/vehicles/**")
                        .hasAuthority("ROLE_OWNER")

                        .requestMatchers(HttpMethod.PUT,
                                "/api/vehicles/**")
                        .hasAuthority("ROLE_OWNER")

                        .requestMatchers(HttpMethod.DELETE,
                                "/api/vehicles/**")
                        .hasAuthority("ROLE_OWNER")

                        // ==========================
                        // 👑 ADMIN ZONE
                        // ==========================
                        .requestMatchers("/api/admin/**")
                        .hasAuthority("ROLE_ADMIN")

                        .requestMatchers("/api/auth/me").authenticated()
                        // ==========================
                        // 🔒 Tout le reste sécurisé
                        // ==========================
                        .anyRequest().authenticated()
                );

        // ✅ Ajout du filtre JWT avant filtre username/password
        http.addFilterBefore(
                authTokenFilter,
                UsernamePasswordAuthenticationFilter.class
        );

        return http.build();
    }

    /**
     * ✅ AuthenticationManager
     * Utilisé par AuthService pour login
     */
    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration cfg) throws Exception {
        return cfg.getAuthenticationManager();
    }

    /**
     * ✅ PasswordEncoder
     * BCrypt recommandé en production.
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}