package com.example.fleet_backend.controller;

import com.example.fleet_backend.dto.*;
import com.example.fleet_backend.model.User;
import com.example.fleet_backend.security.UserDetailsImpl;
import com.example.fleet_backend.service.AuthService;
import com.example.fleet_backend.service.PasswordResetService;
import com.example.fleet_backend.service.UserService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    private final AuthService authService;
    private final PasswordResetService passwordResetService;
    private final UserService userService;

    public AuthController(AuthService authService,
                          PasswordResetService passwordResetService,
                          UserService userService) {
        this.authService = authService;
        this.passwordResetService = passwordResetService;
        this.userService = userService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody AuthRequest authRequest) {
        try {
            logger.info("Login attempt for email: {}", authRequest.getEmail());
            AuthResponse response = authService.authenticateUser(authRequest);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Login error: {}", e.getMessage(), e);
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            error.put("error", "Authentication failed");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody RegisterRequest registerRequest) {
        try {
            logger.info("Register attempt for email: {}, role: {}",
                    registerRequest.getEmail(), registerRequest.getRole());

            // ✅ Normaliser le rôle
            String normalizedRole = authService.normalizeRoleNamePublic(registerRequest.getRole());

            // 🚫 BLOQUER création admin via register public
            if ("ROLE_ADMIN".equals(normalizedRole)) {
                return ResponseEntity.badRequest().body(Map.of(
                        "error", "FORBIDDEN_ROLE",
                        "message", "Impossible de créer un compte ADMIN via inscription."
                ));
            }

            // 🚗 Si DRIVER → licenseNumber obligatoire
            if ("ROLE_DRIVER".equals(normalizedRole)) {
                if (registerRequest.getLicenseNumber() == null ||
                        registerRequest.getLicenseNumber().trim().isEmpty()) {
                    throw new IllegalArgumentException("licenseNumber is required for DRIVER");
                }
            }

            authService.registerUser(
                    registerRequest.getFirstName(),
                    registerRequest.getLastName(),
                    registerRequest.getEmail(),
                    registerRequest.getPassword(),
                    normalizedRole,                 // ✅ envoyer le rôle normalisé
                    registerRequest.getLicenseNumber()
            );

            // Auto-login
            AuthResponse response = authService.authenticateUser(
                    new AuthRequest(registerRequest.getEmail(), registerRequest.getPassword())
            );

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            logger.error("Registration validation error: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of(
                    "message", e.getMessage(),
                    "error", "Validation failed"
            ));
        } catch (RuntimeException e) {
            logger.error("Registration error: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of(
                    "message", e.getMessage(),
                    "error", "Registration failed"
            ));
        } catch (Exception e) {
            logger.error("Unexpected registration error: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "message", "Internal server error",
                    "error", e.getMessage()
            ));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(Authentication authentication) {

        if (authentication == null || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getPrincipal())) {
            return ResponseEntity.status(401).body(Map.of(
                    "error", "UNAUTHORIZED",
                    "message", "Not authenticated"
            ));
        }

        // ✅ fiable même si principal n'est pas UserDetailsImpl
        String email = authentication.getName();

        // ✅ au cas où auth.getName() ne serait pas l'email (rare), fallback:
        if (email == null || email.isBlank()) {
            Object principal = authentication.getPrincipal();
            if (principal instanceof org.springframework.security.core.userdetails.User springUser) {
                email = springUser.getUsername();
            } else if (principal instanceof String s) {
                email = s;
            }
        }

        if (email == null || email.isBlank()) {
            return ResponseEntity.status(401).body(Map.of(
                    "error", "UNAUTHORIZED",
                    "message", "Invalid principal"
            ));
        }

        User u = userService.getByEmail(email); // doit exister

        // ✅ HashMap accepte null (contrairement à Map.of)
        java.util.Map<String, Object> body = new java.util.HashMap<>();
        body.put("id", u.getId());
        body.put("email", u.getEmail());
        body.put("firstName", u.getFirstName());
        body.put("lastName", u.getLastName());
        body.put("role", u.getRoleName());

        body.put("subscriptionStatus", u.getSubscriptionStatus());
        body.put("trialStartAt", u.getTrialStartAt());
        body.put("trialEndAt", u.getTrialEndAt());
        body.put("paidUntil", u.getPaidUntil());

        return ResponseEntity.ok(body);
    }



    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody ChangePasswordRequest req, Authentication auth) {
        userService.changePassword(auth.getName(), req.oldPassword, req.newPassword);
        return ResponseEntity.ok(Map.of("message", "Mot de passe changé."));
    }

    public static class ChangePasswordRequest {
        public String oldPassword;
        public String newPassword;
    }
}