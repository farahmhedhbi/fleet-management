package com.example.fleet_backend.config;

import com.example.fleet_backend.security.AuthEntryPointJwt;
import com.example.fleet_backend.security.AuthTokenFilter;
import com.example.fleet_backend.security.MustChangePasswordFilter;
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


@Configuration
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    private final AuthTokenFilter authTokenFilter;
    private final AuthEntryPointJwt unauthorizedHandler;
    private final MustChangePasswordFilter mustChangePasswordFilter;

    public SecurityConfig(AuthTokenFilter authTokenFilter,
                          AuthEntryPointJwt unauthorizedHandler,
                          MustChangePasswordFilter mustChangePasswordFilter) {
        this.authTokenFilter = authTokenFilter;
        this.unauthorizedHandler = unauthorizedHandler;
        this.mustChangePasswordFilter = mustChangePasswordFilter;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

        http
                .cors(Customizer.withDefaults())
                .csrf(csrf -> csrf.disable())
                .sessionManagement(sm ->
                        sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .exceptionHandling(ex ->
                        ex.authenticationEntryPoint(unauthorizedHandler)
                )
                .authorizeHttpRequests(auth -> auth

                        // Preflight CORS
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // AUTH PUBLIC
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers(
                                "/api/auth/forgot-password",
                                "/api/auth/reset-password"
                        ).permitAll()

                        // FICHIERS STATIQUES UPLOADÉS
                        .requestMatchers(HttpMethod.GET, "/uploads/**").permitAll()

                        // VEHICLES READ
                        .requestMatchers(HttpMethod.GET, "/api/vehicles/**")
                        .hasAnyAuthority(
                                "ROLE_OWNER"
                        )

                        // DRIVER : son propre profil
                        .requestMatchers(HttpMethod.GET, "/api/drivers/me")
                        .hasAuthority("ROLE_DRIVER")

                        // OWNER : gestion de ses drivers
                        .requestMatchers("/api/drivers/**")
                        .hasAuthority("ROLE_OWNER")

                        // VEHICLES WRITE
                        .requestMatchers(HttpMethod.POST, "/api/vehicles/**")
                        .hasAnyAuthority("ROLE_OWNER")

                        .requestMatchers(HttpMethod.PUT, "/api/vehicles/**")
                        .hasAnyAuthority("ROLE_OWNER")

                        .requestMatchers(HttpMethod.DELETE, "/api/vehicles/**")
                        .hasAnyAuthority("ROLE_OWNER")

                        // ADMIN ZONE
                        .requestMatchers("/api/admin/**")
                        .hasAuthority("ROLE_ADMIN")

                        .requestMatchers("/api/auth/me").authenticated()
                        .requestMatchers("/api/gps/**").permitAll()

                        // Tout le reste sécurisé
                        .anyRequest().authenticated()
                );

        http.addFilterBefore(
                authTokenFilter,
                UsernamePasswordAuthenticationFilter.class
        );

        http.addFilterAfter(
                mustChangePasswordFilter,
                AuthTokenFilter.class
        );

        return http.build();
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration cfg) throws Exception {
        return cfg.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}