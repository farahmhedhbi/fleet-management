package com.example.fleet_backend.model;

import jakarta.persistence.*;

/**
 * ✅ Entité Role
 *
 * Représente un rôle système attribué aux utilisateurs.
 *
 * Table : roles
 *
 * Cette entité est utilisée par :
 * - User (ManyToOne)
 * - Spring Security (via UserDetailsImpl)
 * - AuthService (normalisation des rôles)
 *
 * Chaque rôle est stocké sous forme de String en base :
 * Exemple : "ROLE_ADMIN"
 */
@Entity
@Table(name = "roles")
public class Role {

    /**
     * ✅ Clé primaire auto-générée
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * ✅ Nom du rôle
     *
     * - Unique
     * - Obligatoire
     * - Longueur max 20 caractères
     *
     * Exemples :
     * ROLE_ADMIN
     * ROLE_OWNER
     * ROLE_DRIVER
     * ROLE_API_CLIENT
     */
    @Column(name = "name", length = 20, unique = true, nullable = false)
    private String name;

    /**
     * Constructeur vide requis par JPA
     */
    public Role() {}

    /**
     * Constructeur avec String
     */
    public Role(String name) {
        this.name = name;
    }

    /**
     * Constructeur avec Enum
     * Permet d'utiliser directement Role.ERole
     */
    public Role(ERole name) {
        this.name = name.name();
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

    /**
     * Retourne le nom du rôle (String)
     */
    public String getName() {
        return name;
    }

    /**
     * Définit le nom via String
     */
    public void setName(String name) {
        this.name = name;
    }

    /**
     * Définit le nom via Enum
     */
    public void setName(ERole name) {
        this.name = name.name();
    }

    /**
     * ✅ Enum interne représentant les rôles disponibles dans le système.
     *
     * Important :
     * - Toujours garder le préfixe ROLE_
     * - Compatible avec Spring Security
     */
    public enum ERole {
        ROLE_DRIVER,
        ROLE_OWNER,
        ROLE_ADMIN,
        ROLE_API_CLIENT
    }
}