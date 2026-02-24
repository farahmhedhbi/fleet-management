package com.example.fleet_backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

/**
 * ✅ Entité Driver
 *
 * Représente le profil métier d’un conducteur.
 *
 * ⚠️ Important :
 * - Un Driver est différent d’un User.
 * - User = authentification / sécurité
 * - Driver = profil métier (permis, score éco, véhicules assignés)
 *
 * Table : drivers
 */
@Entity
@Table(name = "drivers")
public class Driver {

    /**
     * ✅ Clé primaire auto-générée
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * ✅ Prénom du conducteur
     */
    @Column(name = "first_name", nullable = false)
    private String firstName;

    /**
     * ✅ Nom du conducteur
     */
    @Column(name = "last_name", nullable = false)
    private String lastName;

    /**
     * ✅ Email (lié au User.email)
     * - unique
     * - utilisé pour retrouver le driver connecté
     */
    @Column(name = "email", nullable = false, unique = true)
    private String email;

    /**
     * ✅ Numéro de téléphone (optionnel)
     */
    @Column(name = "phone")
    private String phone;

    /**
     * ✅ Numéro de permis (obligatoire)
     * - unique
     */
    @Column(name = "license_number", nullable = false, unique = true)
    private String licenseNumber;

    /**
     * ✅ Date d’expiration du permis
     */
    @Column(name = "license_expiry")
    private LocalDateTime licenseExpiry;

    /**
     * ✅ Score éco-conduite
     *
     * Utilisé pour :
     * - KPI
     * - Dashboard
     * - Gamification
     */
    @Column(name = "eco_score")
    private Double ecoScore;

    /**
     * ✅ Statut du conducteur
     */
    @Column(name = "status")
    @Enumerated(EnumType.STRING)
    private DriverStatus status;

    /**
     * ✅ Relation OneToMany avec Vehicle
     *
     * - Un driver peut avoir plusieurs véhicules
     * - mappedBy = "driver" correspond à Vehicle.driver
     * - Cascade.ALL → attention : suppression driver supprime véhicules liés
     * - FetchType.LAZY → performance optimisée
     */
    @OneToMany(mappedBy = "driver", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Vehicle> vehicles;

    /**
     * ✅ Audit
     */
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /**
     * Constructeur vide requis par JPA
     */
    public Driver() {}

    /**
     * Constructeur pratique
     */
    public Driver(String firstName, String lastName, String email, String licenseNumber) {
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.licenseNumber = licenseNumber;
    }

    /**
     * ✅ Avant insertion en base
     * - Initialise dates
     * - Définit status par défaut = ACTIVE
     * - Définit ecoScore par défaut = 0
     */
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();

        if (status == null) {
            status = DriverStatus.ACTIVE;
        }

        if (ecoScore == null) {
            ecoScore = 0.0;
        }
    }

    /**
     * ✅ Avant update
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

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getLicenseNumber() { return licenseNumber; }
    public void setLicenseNumber(String licenseNumber) { this.licenseNumber = licenseNumber; }

    public LocalDateTime getLicenseExpiry() { return licenseExpiry; }
    public void setLicenseExpiry(LocalDateTime licenseExpiry) { this.licenseExpiry = licenseExpiry; }

    public Double getEcoScore() { return ecoScore; }
    public void setEcoScore(Double ecoScore) { this.ecoScore = ecoScore; }

    public DriverStatus getStatus() { return status; }
    public void setStatus(DriverStatus status) { this.status = status; }

    public List<Vehicle> getVehicles() { return vehicles; }
    public void setVehicles(List<Vehicle> vehicles) { this.vehicles = vehicles; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    /**
     * ✅ Enum représentant les états possibles d’un conducteur
     */
    public enum DriverStatus {
        ACTIVE,
        INACTIVE,
        ON_LEAVE,
        SUSPENDED
    }
}