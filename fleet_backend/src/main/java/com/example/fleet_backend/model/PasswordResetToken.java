package com.example.fleet_backend.model;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * ✅ Entité PasswordResetToken
 *
 * Cette entité gère :
 * - Les tokens de réinitialisation de mot de passe
 * - Les tokens d’activation de compte
 *
 * Table : password_reset_tokens
 *
 * Utilisée par :
 * - PasswordResetService
 * - EmailService
 *
 * Sécurité :
 * - Token unique
 * - Expiration
 * - Usage unique (used)
 */
@Entity
@Table(name = "password_reset_tokens")
public class PasswordResetToken {

    /**
     * ✅ Clé primaire auto-générée
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * ✅ Token unique (UUID généralement)
     *
     * Exemple :
     * 8d3f7c8e-9c41-4b6a-9e1e-cc4f5f9a3f32
     *
     * Contrainte :
     * - unique
     * - non null
     */
    @Column(nullable = false, unique = true)
    private String token;

    /**
     * ✅ Relation OneToOne avec User
     *
     * - Un utilisateur ne peut avoir qu’un seul token actif
     * - unique = true garantit cela en base
     *
     * JoinColumn :
     * - user_id en base
     */
    @OneToOne
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    /**
     * ✅ Date d’expiration du token
     *
     * Utilise Instant (UTC) pour éviter problèmes de fuseau horaire.
     *
     * Exemple :
     * - Reset password → 15 minutes
     * - Activation → 24 heures
     */
    @Column(nullable = false)
    private Instant expiresAt;

    /**
     * ✅ Indique si le token a déjà été utilisé
     *
     * Sécurité :
     * - Empêche réutilisation du même lien
     */
    @Column(nullable = false)
    private boolean used = false;

    // =========================
    // GETTERS & SETTERS
    // =========================

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(Instant expiresAt) {
        this.expiresAt = expiresAt;
    }

    public boolean isUsed() {
        return used;
    }

    public void setUsed(boolean used) {
        this.used = used;
    }
}