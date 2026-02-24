package com.example.fleet_backend.dto;

import java.time.LocalDateTime;

/**
 * ✅ UserAdminDTO
 *
 * DTO spécifique pour l’interface ADMIN.
 *
 * Différence avec UserDTO :
 * - Contient des informations sensibles à usage interne admin
 * - Inclut l’état du compte (enabled)
 * - Inclut la dernière connexion (lastLoginAt)
 *
 * Utilisé principalement dans :
 * - AdminUserService
 * - Page "Comptes actifs"
 * - Gestion activation/désactivation
 */
public class UserAdminDTO {

    /**
     * ✅ Identifiant utilisateur
     */
    public Long id;

    /**
     * ✅ Informations personnelles
     */
    public String firstName;
    public String lastName;
    public String email;

    /**
     * ✅ Rôle (ex: ROLE_ADMIN, ROLE_OWNER, ROLE_DRIVER)
     */
    public String role;

    /**
     * ✅ Statut du compte
     * true  → actif
     * false → désactivé
     */
    public boolean enabled;

    /**
     * ✅ Date de dernière connexion réussie
     */
    public LocalDateTime lastLoginAt;
}