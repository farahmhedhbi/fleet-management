package com.example.fleet_backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * ✅ Entité User
 *
 * Représente un utilisateur du système.
 *
 * Responsabilités principales :
 * - Authentification (email + password)
 * - Autorisation (role)
 * - Activation / désactivation de compte (enabled)
 * - Audit (createdAt, updatedAt, lastLoginAt)
 *
 * Table : users
 * Contrainte unique sur email.
 */
@Entity
@Table(name = "users",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = "email") // garantit unicité email en base
        })
public class User {

    /**
     * ✅ Clé primaire auto-générée
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * ✅ Prénom (obligatoire)
     */
    @Column(nullable = false)
    private String firstName;

    /**
     * ✅ Nom (obligatoire)
     */
    @Column(nullable = false)
    private String lastName;

    /**
     * ✅ Email (identifiant principal)
     * - unique
     * - obligatoire
     */
    @Column(nullable = false, unique = true)
    private String email;

    /**
     * ✅ Mot de passe encodé (BCrypt)
     * - jamais stocké en clair
     */
    @Column(nullable = false)
    private String password;

    /**
     * ✅ Relation vers Role
     *
     * ManyToOne :
     * - Plusieurs users peuvent avoir le même rôle.
     *
     * FetchType.EAGER :
     * - Le rôle est chargé immédiatement avec le user
     * - Important pour Spring Security (UserDetailsImpl)
     */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "role_id", nullable = false)
    private Role role;

    /**
     * ✅ Audit - date création
     */
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    /**
     * ✅ Audit - date mise à jour
     */
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /**
     * ✅ Compte activé ou non
     *
     * - true  → utilisateur peut se connecter
     * - false → login bloqué (Spring Security via UserDetailsImpl.isEnabled())
     */
    @Column(nullable = false)
    private boolean enabled = true;

    /**
     * Getter / Setter pour enabled
     */
    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }

    /**
     * ✅ Date de dernière connexion réussie
     *
     * Mise à jour dans AuthService.authenticateUser()
     */
    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;

    public LocalDateTime getLastLoginAt() { return lastLoginAt; }
    public void setLastLoginAt(LocalDateTime lastLoginAt) { this.lastLoginAt = lastLoginAt; }

    /**
     * Constructeur vide requis par JPA
     */
    public User() {}

    /**
     * Constructeur pratique
     */
    public User(String firstName, String lastName, String email, String password, Role role) {
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.password = password;
        this.role = role;
    }

    /**
     * ✅ Méthode appelée automatiquement avant INSERT
     * Initialise createdAt et updatedAt
     */
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    /**
     * ✅ Méthode appelée automatiquement avant UPDATE
     * Met à jour updatedAt
     */
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // =========================
    // GETTERS & SETTERS
    // =========================

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    // =========================
    // MÉTHODES UTILITAIRES RÔLE
    // =========================

    /**
     * ✅ Retourne le nom du rôle sous forme String
     * Exemple: "ROLE_ADMIN"
     */
    public String getRoleName() {
        return role != null ? role.getName() : null;
    }

    /**
     * ✅ Retourne le rôle sous forme d'enum (Role.ERole)
     *
     * Sécurise contre erreurs si role null ou invalide.
     */
    public Role.ERole getRoleEnum() {
        if (role == null || role.getName() == null) {
            return null;
        }
        try {
            return Role.ERole.valueOf(role.getName());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    /**
     * ✅ Vérifie si l'utilisateur possède un rôle spécifique (enum)
     */
    public boolean hasRole(Role.ERole roleEnum) {
        return getRoleEnum() == roleEnum;
    }

    /**
     * ✅ Vérifie si l'utilisateur possède un rôle spécifique (String)
     */
    public boolean hasRole(String roleName) {
        return role != null
                && role.getName() != null
                && role.getName().equals(roleName);
    }
}