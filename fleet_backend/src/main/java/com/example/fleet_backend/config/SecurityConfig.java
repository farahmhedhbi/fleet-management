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

@Configuration
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    private final AuthTokenFilter authTokenFilter;
    private final AuthEntryPointJwt unauthorizedHandler;

    public SecurityConfig(AuthTokenFilter authTokenFilter, AuthEntryPointJwt unauthorizedHandler) {
        this.authTokenFilter = authTokenFilter;
        this.unauthorizedHandler = unauthorizedHandler;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .cors(Customizer.withDefaults())
                .csrf(csrf -> csrf.disable())
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // ✅ IMPORTANT : renvoyer 401 quand pas authentifié
                .exceptionHandling(ex -> ex.authenticationEntryPoint(unauthorizedHandler))

                .authorizeHttpRequests(auth -> auth
                        // ✅ Preflight CORS
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // ✅ Auth Sprint 1
                        .requestMatchers("/api/auth/**").permitAll()

                        // ✅ DRIVER
                        .requestMatchers(HttpMethod.GET, "/api/drivers/me").hasAuthority("ROLE_DRIVER")

                        // ✅ Vehicles READ
                        .requestMatchers(HttpMethod.GET, "/api/vehicles/**")
                        .hasAnyAuthority("ROLE_DRIVER", "ROLE_OWNER", "ROLE_ADMIN")

                        // ✅ Drivers manage (Owner/Admin)
                        .requestMatchers("/api/drivers/**")
                        .hasAnyAuthority("ROLE_OWNER", "ROLE_ADMIN")

                        // ✅ Vehicles WRITE (Owner)
                        .requestMatchers(HttpMethod.POST, "/api/vehicles/**").hasAuthority("ROLE_OWNER")
                        .requestMatchers(HttpMethod.PUT, "/api/vehicles/**").hasAuthority("ROLE_OWNER")
                        .requestMatchers(HttpMethod.DELETE, "/api/vehicles/**").hasAuthority("ROLE_OWNER")

                        // ✅ Admin CRUD users / roles / supervision
                        .requestMatchers("/api/admin/**").hasAuthority("ROLE_ADMIN")

                        // ✅ Tout le reste protégé
                        .anyRequest().authenticated()
                );

        // ✅ Filtre JWT
        http.addFilterBefore(authTokenFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration cfg) throws Exception {
        return cfg.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
