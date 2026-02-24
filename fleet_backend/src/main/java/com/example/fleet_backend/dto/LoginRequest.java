package com.example.fleet_backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/**
 * ✅ LoginRequest
 *
 * DTO utilisé pour l’authentification utilisateur.
 *
 * Utilisé dans :
 * - AuthController.authenticate(...)
 * - AuthService.authenticateUser(...)
 *
 * Requête JSON attendue :
 * {
 *   "email": "admin@fleet.com",
 *   "password": "admin123"
 * }
 *
 * Validation automatique via @Valid dans le Controller.
 */
public class LoginRequest {

    /**
     * ✅ Email utilisateur
     * - Obligatoire
     * - Format email valide
     */
    @NotBlank
    @Email
    private String email;

    /**
     * ✅ Mot de passe
     * - Obligatoire
     */
    @NotBlank
    private String password;

    // =========================
    // GETTERS & SETTERS
    // =========================

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}