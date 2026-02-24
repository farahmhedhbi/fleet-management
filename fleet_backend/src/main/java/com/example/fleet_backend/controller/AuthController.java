package com.example.fleet_backend.controller;

import com.example.fleet_backend.dto.*;
import com.example.fleet_backend.service.AuthService;
import com.example.fleet_backend.service.PasswordResetService;
import com.example.fleet_backend.security.UserDetailsImpl;
import com.example.fleet_backend.service.UserService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * ✅ AuthController
 *
 * Gère :
 * - Login JWT
 * - Register
 * - Récupération utilisateur connecté
 * - Changement mot de passe
 *
 * Base URL : /api/auth
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final Logger logger =
            LoggerFactory.getLogger(AuthController.class);

    @Autowired
    private AuthService authService;

    @Autowired
    private final PasswordResetService passwordResetService;

    @Autowired
    private final UserService userService;

    public AuthController(PasswordResetService passwordResetService,
                          UserService userService) {
        this.passwordResetService = passwordResetService;
        this.userService = userService;
    }

    /**
     * ✅ LOGIN
     *
     * POST /api/auth/login
     *
     * - Vérifie email + password
     * - Génère JWT
     * - Retourne AuthResponse (token + infos user)
     */
    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(
            @Valid @RequestBody AuthRequest authRequest) {

        try {
            logger.info("Login attempt for email: {}",
                    authRequest.getEmail());

            AuthResponse response =
                    authService.authenticateUser(authRequest);

            return ResponseEntity.ok(response);

        } catch (Exception e) {

            // ⚠ En cas d’erreur, on retourne 401
            logger.error("Login error: {}", e.getMessage(), e);

            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            error.put("error", "Authentication failed");

            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(error);
        }
    }

    /**
     * ✅ REGISTER
     *
     * POST /api/auth/register
     *
     * - Normalise le rôle
     * - Vérifie licenseNumber si DRIVER
     * - Crée user
     * - Auto-login après inscription
     */
    @PostMapping("/register")
    public ResponseEntity<?> registerUser(
            @Valid @RequestBody RegisterRequest registerRequest) {

        try {

            logger.info("Register attempt for email: {}, role: {}",
                    registerRequest.getEmail(),
                    registerRequest.getRole());

            // 🔁 Normalisation rôle (DRIVER → ROLE_DRIVER)
            String normalizedRole =
                    authService.normalizeRoleNamePublic(
                            registerRequest.getRole());

            // 🚗 Si DRIVER → licenseNumber obligatoire
            if ("ROLE_DRIVER".equals(normalizedRole)) {
                if (registerRequest.getLicenseNumber() == null ||
                        registerRequest.getLicenseNumber().trim().isEmpty()) {
                    throw new IllegalArgumentException(
                            "licenseNumber is required for DRIVER");
                }
            }

            // 🔐 Création utilisateur
            authService.registerUser(
                    registerRequest.getFirstName(),
                    registerRequest.getLastName(),
                    registerRequest.getEmail(),
                    registerRequest.getPassword(),
                    registerRequest.getRole(),
                    registerRequest.getLicenseNumber()
            );

            // 🔑 Auto-login après inscription
            AuthRequest authRequest = new AuthRequest(
                    registerRequest.getEmail(),
                    registerRequest.getPassword()
            );

            AuthResponse response =
                    authService.authenticateUser(authRequest);

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {

            logger.error("Registration validation error: {}",
                    e.getMessage(), e);

            return ResponseEntity.badRequest().body(Map.of(
                    "message", e.getMessage(),
                    "error", "Validation failed"
            ));

        } catch (RuntimeException e) {

            logger.error("Registration error: {}",
                    e.getMessage(), e);

            return ResponseEntity.badRequest().body(Map.of(
                    "message", e.getMessage(),
                    "error", "Registration failed"
            ));

        } catch (Exception e) {

            logger.error("Unexpected registration error: {}",
                    e.getMessage(), e);

            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "message", "Internal server error",
                            "error", e.getMessage()
                    ));
        }
    }

    /**
     * ✅ ME
     *
     * GET /api/auth/me
     *
     * Retourne les informations
     * de l'utilisateur connecté (via JWT).
     */
    @GetMapping("/me")
    public ResponseEntity<?> me(Authentication authentication) {

        if (authentication == null
                || !authentication.isAuthenticated()
                || "anonymousUser"
                .equals(authentication.getPrincipal())) {

            return ResponseEntity.status(401).body(Map.of(
                    "error", "UNAUTHORIZED",
                    "message", "Not authenticated"
            ));
        }

        // Principal = UserDetailsImpl
        UserDetailsImpl user =
                (UserDetailsImpl) authentication.getPrincipal();

        return ResponseEntity.ok(Map.of(
                "id", user.getId(),
                "email", user.getEmail(),
                "firstName", user.getFirstName(),
                "lastName", user.getLastName(),
                "roles", user.getAuthorities()
        ));
    }

    /**
     * ✅ CHANGE PASSWORD
     *
     * POST /api/auth/change-password
     *
     * - Vérifie ancien mot de passe
     * - Encode nouveau mot de passe
     */
    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(
            @RequestBody ChangePasswordRequest req,
            Authentication auth) {

        // auth.getName() = email (JWT subject)
        userService.changePassword(
                auth.getName(),
                req.oldPassword,
                req.newPassword
        );

        return ResponseEntity.ok(
                Map.of("message", "Mot de passe changé."));
    }

    /**
     * 📦 Classe interne pour changement mot de passe
     */
    public static class ChangePasswordRequest {
        public String oldPassword;
        public String newPassword;
    }
}