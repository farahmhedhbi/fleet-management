package com.example.fleet_backend.config;

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

    public SecurityConfig(AuthTokenFilter authTokenFilter) {
        this.authTokenFilter = authTokenFilter;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .cors(Customizer.withDefaults())
                .csrf(csrf -> csrf.disable())
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth

                        // ✅ preflight
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // ✅ auth
                        .requestMatchers("/api/auth/**").permitAll()


                        // ✅ DRIVER: profile
                        .requestMatchers(HttpMethod.GET, "/api/drivers/me").hasAuthority("ROLE_DRIVER")

                        // ✅ VEHICLES READ
                        .requestMatchers(HttpMethod.GET, "/api/vehicles/**")
                        .hasAnyAuthority("ROLE_DRIVER", "ROLE_OWNER", "ROLE_ADMIN")

                        // ✅ ADMIN management
                        .requestMatchers("/api/admin/**").hasAuthority("ROLE_ADMIN")
                        // ✅ DRIVERS MANAGE
                        .requestMatchers("/api/drivers/**")
                        .hasAnyAuthority("ROLE_OWNER", "ROLE_ADMIN")

                        // ✅ VEHICLES WRITE
                        .requestMatchers(HttpMethod.POST, "/api/vehicles/**")
                        .hasAnyAuthority("ROLE_OWNER")
                        .requestMatchers(HttpMethod.PUT, "/api/vehicles/**")
                        .hasAnyAuthority("ROLE_OWNER")
                        .requestMatchers(HttpMethod.DELETE, "/api/vehicles/**")
                        .hasAnyAuthority("ROLE_OWNER")

                        // ✅ Sprint 3
                        .requestMatchers("/import/**").hasAuthority("ROLE_ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/data/**")
                        .hasAnyAuthority("ROLE_API_CLIENT", "ROLE_ADMIN")

                        .anyRequest().authenticated()
                );

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
