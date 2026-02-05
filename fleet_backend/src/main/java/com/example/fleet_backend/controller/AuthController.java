package com.example.fleet_backend.controller;

import com.example.fleet_backend.dto.AuthRequest;
import com.example.fleet_backend.dto.AuthResponse;
import com.example.fleet_backend.dto.RegisterRequest;
import com.example.fleet_backend.service.AuthService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    @Autowired
    private AuthService authService;

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

            var user = authService.registerUser(
                    registerRequest.getFirstName(),
                    registerRequest.getLastName(),
                    registerRequest.getEmail(),
                    registerRequest.getPassword(),
                    registerRequest.getRole()
            );

            // Après l'inscription, authentifier l'utilisateur et retourner un token
            AuthRequest authRequest = new AuthRequest(
                    registerRequest.getEmail(),
                    registerRequest.getPassword()
            );

            AuthResponse response = authService.authenticateUser(authRequest);
            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            logger.error("Registration error: {}", e.getMessage(), e);
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            error.put("error", "Registration failed");
            return ResponseEntity.badRequest().body(error);
        } catch (Exception e) {
            logger.error("Unexpected registration error: {}", e.getMessage(), e);
            Map<String, String> error = new HashMap<>();
            error.put("message", "Internal server error");
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser() {
        // Cette route sera sécurisée par le filteur JWT
        return ResponseEntity.ok("User info endpoint");
    }
}