package com.example.fleet_backend.controller;

import com.example.fleet_backend.service.PasswordResetService;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class PasswordResetController {

    private final PasswordResetService passwordResetService;

    public PasswordResetController(PasswordResetService passwordResetService) {
        this.passwordResetService = passwordResetService;
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody ForgotPasswordRequest req) {
        System.out.println("FORGOT request email=" + req.getEmail());
        try {
            passwordResetService.createResetTokenAndSendEmail(req.getEmail());
            System.out.println("FORGOT: user FOUND -> email sent");
        } catch (Exception e) {
            System.out.println("FORGOT: user NOT FOUND or error -> " + e.getMessage());
        }
        return ResponseEntity.ok(Map.of("message", "Si l'email existe, un lien a été envoyé."));
    }


    // 2) user clique lien -> frontend envoie token + newPassword
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest req) {
        passwordResetService.resetPassword(req.token, req.newPassword);
        return ResponseEntity.ok(Map.of("message", "Mot de passe réinitialisé."));
    }

    public static class ForgotPasswordRequest {
        @Email @NotBlank public String email;

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }
    }

    public static class ResetPasswordRequest {
        @NotBlank public String token;
        @NotBlank public String newPassword;
    }
}
