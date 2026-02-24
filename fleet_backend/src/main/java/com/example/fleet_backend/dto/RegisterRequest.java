package com.example.fleet_backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * ✅ RegisterRequest
 *
 * DTO utilisé pour l’inscription d’un nouvel utilisateur.
 *
 * Utilisé dans :
 * - AuthController.register(...)
 * - AuthService.registerUser(...)
 *
 * Requête JSON attendue :
 * {
 *   "email": "driver@fleet.com",
 *   "password": "driver123",
 *   "firstName": "John",
 *   "lastName": "Driver",
 *   "phone": "12345678",
 *   "role": "DRIVER",
 *   "licenseNumber": "TN-DR-0001"
 * }
 */
public class RegisterRequest {

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
     * - Minimum 6 caractères
     * ⚠ Peut être renforcé à 8+ pour plus de sécurité
     */
    @NotBlank
    @Size(min = 6)
    private String password;

    /**
     * ✅ Prénom
     */
    @NotBlank
    private String firstName;

    /**
     * ✅ Nom
     */
    @NotBlank
    private String lastName;

    /**
     * 🔹 Téléphone (optionnel)
     */
    private String phone;

    /**
     * ✅ Rôle demandé
     * Valeurs attendues :
     * ADMIN, OWNER, DRIVER
     *
     * Sera normalisé en ROLE_ADMIN etc.
     */
    @NotBlank
    private String role;

    /**
     * 🔹 Numéro de permis
     *
     * ⚠ Obligatoire si role = DRIVER
     * Validé côté service (AuthService)
     */
    private String licenseNumber;

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

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
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