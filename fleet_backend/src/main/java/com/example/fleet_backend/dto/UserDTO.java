package com.example.fleet_backend.dto;

import com.example.fleet_backend.model.User;
import java.time.LocalDateTime;

/**
 * ✅ UserDTO
 *
 * Data Transfer Object utilisé pour exposer les informations
 * d’un utilisateur au frontend.
 *
 * Objectif :
 * - Ne pas exposer l'entité User directement
 * - Ne jamais exposer le password
 * - Envoyer uniquement les données nécessaires
 */
public class UserDTO {

    private Long id;
    private String firstName;
    private String lastName;
    private String email;

    /**
     * ✅ Rôle sous forme String
     * Exemple : ROLE_OWNER
     */
    private String role;

    /**
     * ✅ Date de création du compte
     */
    private LocalDateTime createdAt;

    public UserDTO() {}

    /**
     * ✅ Constructeur de mapping Entity → DTO
     */
    public UserDTO(User u) {
        this.id = u.getId();
        this.firstName = u.getFirstName();
        this.lastName = u.getLastName();
        this.email = u.getEmail();
        this.role = u.getRoleName(); // méthode utilitaire de User
        this.createdAt = u.getCreatedAt();
    }

    // =========================
    // GETTERS & SETTERS
    // =========================

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}