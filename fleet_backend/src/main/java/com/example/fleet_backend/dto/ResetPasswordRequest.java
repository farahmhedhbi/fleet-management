package com.example.fleet_backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * ✅ ResetPasswordRequest
 *
 * DTO utilisé pour la réinitialisation du mot de passe
 * après réception d’un token valide.
 *
 * Utilisé dans :
 * - PasswordResetController
 * - PasswordResetService.resetPassword(...)
 *
 * Requête attendue :
 * {
 *   "token": "uuid-token",
 *   "newPassword": "NewPassword123"
 * }
 */
public class ResetPasswordRequest {

    /**
     * ✅ Token unique envoyé par email
     *
     * - Obligatoire
     * - Ne doit pas être vide
     */
    @NotBlank
    private String token;

    /**
     * ✅ Nouveau mot de passe
     *
     * Contraintes :
     * - Obligatoire
     * - Minimum 8 caractères
     *
     * ⚠ Peut être renforcé plus tard :
     * - Majuscule
     * - Minuscule
     * - Chiffre
     * - Caractère spécial
     */
    @NotBlank
    @Size(min = 8, message = "Mot de passe minimum 8 caractères")
    private String newPassword;

    // =========================
    // GETTERS & SETTERS
    // =========================

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getNewPassword() {
        return newPassword;
    }

    public void setNewPassword(String newPassword) {
        this.newPassword = newPassword;
    }
}