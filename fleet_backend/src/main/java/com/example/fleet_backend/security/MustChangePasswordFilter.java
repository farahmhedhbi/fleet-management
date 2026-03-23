package com.example.fleet_backend.security;

import com.example.fleet_backend.model.User;
import com.example.fleet_backend.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class MustChangePasswordFilter extends OncePerRequestFilter {

    private final UserRepository userRepository;

    public MustChangePasswordFilter(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String path = request.getRequestURI();

        if (path.startsWith("/uploads/")) {
            filterChain.doFilter(request, response);
            return;
        }

        boolean allowed =
                path.startsWith("/api/auth/login") ||
                        path.startsWith("/api/auth/me") ||
                        path.startsWith("/api/auth/change-password") ||
                        path.startsWith("/api/auth/forgot-password") ||
                        path.startsWith("/api/auth/reset-password");

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication != null
                && authentication.isAuthenticated()
                && authentication.getName() != null
                && !"anonymousUser".equals(authentication.getName())) {

            User user = userRepository.findByEmail(authentication.getName()).orElse(null);

            if (user != null && user.isMustChangePassword() && !allowed) {
                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.setContentType("application/json");
                response.setCharacterEncoding("UTF-8");
                response.getWriter().write("""
                    {
                      "error": "PASSWORD_CHANGE_REQUIRED",
                      "message": "Vous devez changer votre mot de passe avant d'accéder à cette fonctionnalité.",
                      "mustChangePassword": true
                    }
                """);
                return;
            }
        }

        filterChain.doFilter(request, response);
    }
}