package com.example.fleet_backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/**
 * ✅ AuthRequest
 *
 * DTO utilisé lors de la connexion (login).
 * Il contient les informations envoyées par le frontend
 * pour authentifier un utilisateur.
 *
 * Utilisé dans :
 * AuthController.login(...)
 * AuthService.authenticateUser(...)
 *
 * Exemple JSON attendu :
 * {
 *   "email": "user@fleet.com",
 *   "password": "password123"
 * }
 */
public class AuthRequest {

    /**
     * 📧 Email utilisateur
     *
     * - Obligatoire
     * - Doit être un email valide
     * - Sert d'identifiant principal (username)
     */
    @NotBlank(message = "Email is required")
    @Email(message = "Email should be valid")
    private String email;

    /**
     * 🔐 Mot de passe utilisateur
     *
     * - Obligatoire
     * - Vérifié par Spring Security
     * - Comparé au password encodé en base (BCrypt)
     */
    @NotBlank(message = "Password is required")
    private String password;

    public AuthRequest() {}

    /**
     * Constructeur utilisé lors de la création manuelle
     * (tests, mock, etc.)
     */
    public AuthRequest(String email, String password) {
        this.email = email;
        this.password = password;
    }

    // =========================
    // GETTERS & SETTERS
    // =========================

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    /**
     * ⚠ Le password ne doit jamais être loggé
     * ni retourné dans une réponse API.
     */
    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}