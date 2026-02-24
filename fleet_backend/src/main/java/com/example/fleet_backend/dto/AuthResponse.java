package com.example.fleet_backend.dto;

/**
 * ✅ AuthResponse
 *
 * DTO retourné après authentification réussie.
 * Il contient le JWT ainsi que les informations essentielles
 * de l'utilisateur connecté.
 *
 * Utilisé dans :
 * AuthService.authenticateUser(...)
 */
public class AuthResponse {

    /**
     * 🔐 Token JWT généré après login
     */
    private String token;

    /**
     * Type du token (toujours "Bearer")
     * Utilisé dans le header HTTP :
     * Authorization: Bearer <token>
     */
    private String type = "Bearer";

    /**
     * ID de l'utilisateur connecté
     */
    private Long id;

    /**
     * Email (sert d'identifiant principal)
     */
    private String email;

    /**
     * Prénom utilisateur
     */
    private String firstName;

    /**
     * Nom utilisateur
     */
    private String lastName;

    /**
     * Rôle de l'utilisateur
     * Exemple : ROLE_ADMIN, ROLE_OWNER, ROLE_DRIVER
     */
    private String role;

    public AuthResponse() {}

    /**
     * Constructeur principal utilisé après login réussi
     */
    public AuthResponse(String token, String type, Long id, String email,
                        String firstName, String lastName, String role) {
        this.token = token;
        this.type = type;
        this.id = id;
        this.email = email;
        this.firstName = firstName;
        this.lastName = lastName;
        this.role = role;
    }

    // =========================
    // GETTERS & SETTERS
    // =========================

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }
}