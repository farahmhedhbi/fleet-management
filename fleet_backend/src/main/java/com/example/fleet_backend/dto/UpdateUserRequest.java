package com.example.fleet_backend.dto;

/**
 * ✅ UpdateUserRequest
 *
 * DTO utilisé pour modifier un utilisateur existant.
 *
 * Caractéristiques :
 * - Tous les champs sont optionnels
 * - Seuls les champs non-null sont mis à jour
 * - Gestion spéciale si role = ROLE_DRIVER
 */
public class UpdateUserRequest {

    /**
     * 🔹 Prénom (optionnel)
     */
    public String firstName;

    /**
     * 🔹 Nom (optionnel)
     */
    public String lastName;

    /**
     * 🔹 Email (optionnel)
     * ⚠ Doit rester unique en base
     */
    public String email;

    /**
     * 🔹 Nouveau mot de passe (optionnel)
     * Si fourni → sera encodé (BCrypt) dans AdminService
     */
    public String password;

    /**
     * 🔹 Nouveau rôle (optionnel)
     * Exemple : ROLE_ADMIN, ROLE_OWNER, ROLE_DRIVER
     */
    public String role;

    /**
     * 🔹 Numéro de permis (optionnel)
     *
     * ⚠ IMPORTANT :
     * Requis si role = ROLE_DRIVER
     * Utilisé pour créer ou mettre à jour le profil Driver.
     */
    public String licenseNumber;

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

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getLicenseNumber() {
        return licenseNumber;
    }

    public void setLicenseNumber(String licenseNumber) {
        this.licenseNumber = licenseNumber;
    }
}