package com.example.fleet_backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;



@Entity
@Table(name = "users",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = "email")
        })
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String firstName;

    @Column(nullable = false)
    private String lastName;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "role_id", nullable = false)
    private Role role;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(nullable = false)
    private boolean enabled = true;

    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }

    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;

    public LocalDateTime getLastLoginAt() { return lastLoginAt; }
    public void setLastLoginAt(LocalDateTime lastLoginAt)
    { this.lastLoginAt = lastLoginAt; }

    public User() {}

    public User(String firstName, String lastName, String email, String password, Role role) {
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.password = password;
        this.role = role;
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum SubscriptionStatus {
        TRIAL, ACTIVE, EXPIRED
    }

    @Column(name = "trial_start_at")
    private LocalDateTime trialStartAt;

    @Column(name = "trial_end_at")
    private LocalDateTime trialEndAt;

    @Column(name = "paid_until")
    private LocalDateTime paidUntil;

    @Enumerated(EnumType.STRING)
    @Column(name = "subscription_status", length = 20, nullable = false)
    private SubscriptionStatus subscriptionStatus = SubscriptionStatus.TRIAL;

    /**
     * ✅ Numéro de téléphone
     * Utilisé pour contact + envoi SMS
     */
    @Column(name = "phone", unique = true)
    private String phone;

    /**
     * ✅ Force le changement du mot de passe à la première connexion
     *
     * true  -> l'utilisateur doit changer son mot de passe
     * false -> accès normal
     */
    @Column(name = "must_change_password", nullable = false)
    private boolean mustChangePassword = false;

    // getters/setters

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public boolean isMustChangePassword() {
        return mustChangePassword;
    }

    public void setMustChangePassword(boolean mustChangePassword) {
        this.mustChangePassword = mustChangePassword;
    }

    public LocalDateTime getTrialStartAt() { return trialStartAt; }
    public void setTrialStartAt(LocalDateTime trialStartAt) { this.trialStartAt = trialStartAt; }

    public LocalDateTime getTrialEndAt() { return trialEndAt; }
    public void setTrialEndAt(LocalDateTime trialEndAt) { this.trialEndAt = trialEndAt; }

    public LocalDateTime getPaidUntil() { return paidUntil; }
    public void setPaidUntil(LocalDateTime paidUntil) { this.paidUntil = paidUntil; }

    public SubscriptionStatus getSubscriptionStatus() { return subscriptionStatus; }
    public void setSubscriptionStatus(SubscriptionStatus subscriptionStatus) { this.subscriptionStatus = subscriptionStatus; }

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

    public String getRoleName() {
        return role != null ? role.getName() : null;
    }

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


    public boolean hasRole(Role.ERole roleEnum) {
        return getRoleEnum() == roleEnum;
    }

    public boolean hasRole(String roleName) {
        return role != null
                && role.getName() != null
                && role.getName().equals(roleName);
    }
}