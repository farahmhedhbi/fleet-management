package com.example.fleet_backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/**
 * ✅ ForgotPasswordRequest
 *
 * DTO utilisé lorsqu’un utilisateur demande
 * la réinitialisation de son mot de passe.
 *
 * Utilisé dans :
 * - PasswordResetController.forgotPassword(...)
 * - PasswordResetService.createResetTokenAndSendEmail(...)
 *
 * Requête JSON attendue :
 * {
 *   "email": "user@fleet.com"
 * }
 *
 * Validation automatique via @Valid.
 */
public class ForgotPasswordRequest {

    /**
     * ✅ Email utilisateur
     *
     * - Obligatoire
     * - Doit être au format email valide
     */
    @NotBlank
    @Email
    private String email;

    // =========================
    // GETTERS & SETTERS
    // =========================

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }
}