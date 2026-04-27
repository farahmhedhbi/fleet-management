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

                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers(
                                "/api/auth/forgot-password",
                                "/api/auth/reset-password"
                        ).permitAll()

                        .requestMatchers(HttpMethod.POST, "/api/gps/ingest").permitAll()
                        .requestMatchers("/api/simulator/**").permitAll()
                        .requestMatchers("/api/places/**").permitAll()
                        .requestMatchers("/ws/**").permitAll()
                        .requestMatchers("/ws-native/**").permitAll()

                        .requestMatchers(HttpMethod.GET, "/uploads/**").permitAll()

                        .requestMatchers(HttpMethod.GET, "/api/gps/**")
                        .hasAnyAuthority("ROLE_ADMIN", "ROLE_OWNER", "ROLE_DRIVER")

                        .requestMatchers("/api/events/**")
                        .hasAnyAuthority("ROLE_ADMIN", "ROLE_OWNER", "ROLE_DRIVER")

                        .requestMatchers("/api/missions/**")
                        .hasAnyAuthority("ROLE_ADMIN", "ROLE_OWNER", "ROLE_DRIVER")

                        .requestMatchers(HttpMethod.GET, "/api/vehicles/**")
                        .hasAnyAuthority("ROLE_ADMIN", "ROLE_OWNER", "ROLE_DRIVER")

                        .requestMatchers("/api/drivers/me")
                        .hasAuthority("ROLE_DRIVER")

                        .requestMatchers("/api/drivers/**")
                        .hasAuthority("ROLE_OWNER")

                        .requestMatchers(HttpMethod.POST, "/api/vehicles/**")
                        .hasAnyAuthority("ROLE_OWNER")

                        .requestMatchers(HttpMethod.PUT, "/api/vehicles/**")
                        .hasAnyAuthority("ROLE_OWNER")

                        .requestMatchers(HttpMethod.DELETE, "/api/vehicles/**")
                        .hasAnyAuthority("ROLE_OWNER")

                        .requestMatchers("/api/admin/**")
                        .hasAuthority("ROLE_ADMIN")

                        .requestMatchers("/api/auth/me").authenticated()

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