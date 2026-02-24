package com.example.fleet_backend.dto;

/**
 * ✅ RegisterResponse
 *
 * DTO retourné après l'inscription réussie d’un utilisateur.
 *
 * Utilisé dans :
 * - AuthController.register(...)
 * - AuthService.registerUser(...)
 *
 * Objectif :
 * - Confirmer la création du compte
 * - Retourner les informations essentielles
 * - Ne jamais exposer le password
 */
public class RegisterResponse {

    /**
     * ✅ Message informatif
     * Exemple :
     * "User registered successfully"
     */
    private String message;

    /**
     * ✅ ID du nouvel utilisateur
     */
    private Long userId;

    /**
     * ✅ Email du compte créé
     */
    private String email;

    /**
     * ✅ Rôle attribué
     * Exemple : ROLE_DRIVER, ROLE_OWNER
     */
    private String role;

    public RegisterResponse() {}

    public RegisterResponse(String message, Long userId, String email, String role) {
        this.message = message;
        this.userId = userId;
        this.email = email;
        this.role = role;
    }

    // =========================
    // GETTERS & SETTERS
    // =========================

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }
}