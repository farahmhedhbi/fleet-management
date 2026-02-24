package com.example.fleet_backend.controller;

import com.example.fleet_backend.service.PasswordResetService;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * ✅ PasswordResetController
 *
 * Gère le flux complet de réinitialisation de mot de passe.
 *
 * Base URL : /api/auth
 *
 * Flux :
 * 1️⃣ L'utilisateur demande "Mot de passe oublié"
 * 2️⃣ Un token sécurisé est généré et envoyé par email
 * 3️⃣ L'utilisateur clique sur le lien
 * 4️⃣ Il définit un nouveau mot de passe
 */
@RestController
@RequestMapping("/api/auth")
public class PasswordResetController {

    private final PasswordResetService passwordResetService;

    // Injection par constructeur (bonne pratique)
    public PasswordResetController(PasswordResetService passwordResetService) {
        this.passwordResetService = passwordResetService;
    }

    /**
     * ✅ Étape 1 : Demande de réinitialisation
     *
     * POST /api/auth/forgot-password
     *
     * - Vérifie si l’email existe
     * - Génère un token UUID
     * - Envoie un email avec lien sécurisé
     *
     * ⚠ Important sécurité :
     * On retourne toujours le même message,
     * même si l’email n’existe pas (anti-enumeration attack).
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody ForgotPasswordRequest req) {

        // Logs debug (à retirer en production)
        System.out.println("FORGOT request email=" + req.getEmail());

        try {
            passwordResetService.createResetTokenAndSendEmail(req.getEmail());
            System.out.println("FORGOT: user FOUND -> email sent");
        } catch (Exception e) {
            // On ne révèle pas si l’utilisateur existe ou non
            System.out.println("FORGOT: user NOT FOUND or error -> " + e.getMessage());
        }

        return ResponseEntity.ok(
                Map.of("message", "Si l'email existe, un lien a été envoyé.")
        );
    }

    /**
     * ✅ Étape 2 : Réinitialisation effective du mot de passe
     *
     * POST /api/auth/reset-password
     *
     * Reçoit :
     * - token (UUID)
     * - newPassword
     *
     * Le service vérifie :
     * - token valide
     * - non expiré
     * - non utilisé
     *
     * Puis :
     * - encode le mot de passe (BCrypt)
     * - active le compte si nécessaire
     * - supprime le token
     */
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest req) {
        passwordResetService.resetPassword(req.token, req.newPassword);
        return ResponseEntity.ok(
                Map.of("message", "Mot de passe réinitialisé.")
        );
    }

    /**
     * 📩 Classe interne pour forgot-password
     *
     * Validation :
     * - email obligatoire
     * - format email valide
     */
    public static class ForgotPasswordRequest {

        @Email
        @NotBlank
        public String email;

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }
    }

    /**
     * 🔐 Classe interne pour reset-password
     *
     * Validation :
     * - token obligatoire
     * - nouveau mot de passe obligatoire
     *
     * (La taille minimale est validée dans le service ou DTO global)
     */
    public static class ResetPasswordRequest {

        @NotBlank
        public String token;

        @NotBlank
        public String newPassword;
    }
}