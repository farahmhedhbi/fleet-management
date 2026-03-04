package com.example.fleet_backend.dto;

/**
 * ✅ AdminInviteUserRequest
 *
 * DTO utilisé lorsqu'un ADMIN invite un nouvel utilisateur
 * dans la plateforme (Owner ou Driver).
 *
 * Utilisé dans :
 * AdminService.inviteUser(...)
 *
 * Flux :
 * 1️⃣ Admin crée un utilisateur sans mot de passe
 * 2️⃣ Un mot de passe temporaire est généré
 * 3️⃣ Un email d’activation est envoyé
 * 4️⃣ L’utilisateur définit son propre mot de passe
 */
public class AdminInviteUserRequest {

    /**
     * Prénom du nouvel utilisateur
     */
    public String firstName;

    /**
     * Nom du nouvel utilisateur
     */
    public String lastName;

    /**
     * Email (servira d'identifiant unique)
     * ⚠ Doit être unique en base
     */
    public String email;


    public String role;



    // =========================
    // GETTERS & SETTERS
    // =========================

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


}