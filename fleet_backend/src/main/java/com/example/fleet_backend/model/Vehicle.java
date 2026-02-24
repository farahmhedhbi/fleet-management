package com.example.fleet_backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * ✅ Entité Vehicle
 *
 * Représente un véhicule dans le système de gestion de flotte.
 *
 * Cette classe est mappée à la table "vehicles" en base de données.
 *
 * Relations principales :
 * - ManyToOne vers Driver (conducteur assigné)
 * - ManyToOne vers User (owner/propriétaire du véhicule)
 *
 * Contient :
 * - Informations d’identification (registrationNumber, vin)
 * - Caractéristiques techniques (fuelType, transmission)
 * - État métier (status, mileage)
 * - Données maintenance
 * - Audit (createdAt, updatedAt)
 */
@Entity
@Table(name = "vehicles")
public class Vehicle {

    /**
     * ✅ Clé primaire auto-générée
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * ✅ Numéro d'immatriculation
     * - Obligatoire
     * - Unique
     */
    @Column(name = "registration_number", nullable = false, unique = true)
    private String registrationNumber;

    /**
     * ✅ Marque du véhicule (ex: Toyota, BMW)
     */
    @Column(name = "brand", nullable = false)
    private String brand;

    /**
     * ✅ Modèle du véhicule
     */
    @Column(name = "model", nullable = false)
    private String model;

    /**
     * ✅ Année de fabrication
     */
    @Column(name = "year", nullable = false)
    private Integer year;

    /**
     * ✅ Couleur (optionnel)
     */
    @Column(name = "color")
    private String color;

    /**
     * ✅ VIN (Vehicle Identification Number)
     * - Unique si présent
     */
    @Column(name = "vin", unique = true)
    private String vin;

    /**
     * ✅ Type de carburant
     * Enum stocké en STRING en base
     */
    @Column(name = "fuel_type")
    @Enumerated(EnumType.STRING)
    private FuelType fuelType;

    /**
     * ✅ Type de transmission
     */
    @Column(name = "transmission")
    @Enumerated(EnumType.STRING)
    private TransmissionType transmission;

    /**
     * ✅ Statut métier du véhicule
     * Exemple : AVAILABLE, IN_USE, UNDER_MAINTENANCE
     */
    @Column(name = "status")
    @Enumerated(EnumType.STRING)
    private VehicleStatus status;

    /**
     * ✅ Kilométrage actuel
     */
    @Column(name = "mileage")
    private Double mileage;

    /**
     * ✅ Date dernière maintenance
     */
    @Column(name = "last_maintenance_date")
    private LocalDateTime lastMaintenanceDate;

    /**
     * ✅ Date prochaine maintenance prévue
     */
    @Column(name = "next_maintenance_date")
    private LocalDateTime nextMaintenanceDate;

    /**
     * ✅ Conducteur assigné
     *
     * ManyToOne :
     * - Plusieurs véhicules peuvent être assignés à un même driver
     *
     * FetchType.EAGER :
     * - Le driver est chargé automatiquement avec le véhicule
     */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "driver_id")
    private Driver driver;

    /**
     * ✅ Owner (propriétaire du véhicule)
     *
     * ManyToOne :
     * - Un owner peut posséder plusieurs véhicules
     *
     * FetchType.LAZY :
     * - L'owner est chargé seulement si nécessaire
     *
     * nullable = false :
     * - Chaque véhicule doit obligatoirement appartenir à un owner
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    /**
     * ✅ Date création (audit)
     */
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    /**
     * ✅ Date dernière mise à jour (audit)
     */
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /**
     * Constructeur vide requis par JPA
     */
    public Vehicle() {}

    /**
     * Constructeur pratique pour création rapide
     */
    public Vehicle(String registrationNumber, String brand, String model, Integer year) {
        this.registrationNumber = registrationNumber;
        this.brand = brand;
        this.model = model;
        this.year = year;
    }

    /**
     * ✅ Méthode appelée automatiquement avant INSERT en base.
     *
     * - Initialise createdAt
     * - Initialise updatedAt
     * - Définit status par défaut = AVAILABLE
     * - Définit mileage par défaut = 0.0
     */
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();

        if (status == null) {
            status = VehicleStatus.AVAILABLE;
        }
        if (mileage == null) {
            mileage = 0.0;
        }
    }

    /**
     * ✅ Méthode appelée automatiquement avant UPDATE.
     *
     * Met à jour updatedAt.
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

    public String getRegistrationNumber() { return registrationNumber; }
    public void setRegistrationNumber(String registrationNumber) { this.registrationNumber = registrationNumber; }

    public String getBrand() { return brand; }
    public void setBrand(String brand) { this.brand = brand; }

    public String getModel() { return model; }
    public void setModel(String model) { this.model = model; }

    public Integer getYear() { return year; }
    public void setYear(Integer year) { this.year = year; }

    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }

    public String getVin() { return vin; }
    public void setVin(String vin) { this.vin = vin; }

    public FuelType getFuelType() { return fuelType; }
    public void setFuelType(FuelType fuelType) { this.fuelType = fuelType; }

    public TransmissionType getTransmission() { return transmission; }
    public void setTransmission(TransmissionType transmission) { this.transmission = transmission; }

    public VehicleStatus getStatus() { return status; }
    public void setStatus(VehicleStatus status) { this.status = status; }

    public Double getMileage() { return mileage; }
    public void setMileage(Double mileage) { this.mileage = mileage; }

    public LocalDateTime getLastMaintenanceDate() { return lastMaintenanceDate; }
    public void setLastMaintenanceDate(LocalDateTime lastMaintenanceDate) { this.lastMaintenanceDate = lastMaintenanceDate; }

    public LocalDateTime getNextMaintenanceDate() { return nextMaintenanceDate; }
    public void setNextMaintenanceDate(LocalDateTime nextMaintenanceDate) { this.nextMaintenanceDate = nextMaintenanceDate; }

    public Driver getDriver() { return driver; }
    public void setDriver(Driver driver) { this.driver = driver; }

    public User getOwner() { return owner; }
    public void setOwner(User owner) { this.owner = owner; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    // =========================
    // ENUMS
    // =========================

    /**
     * Types de carburant supportés.
     */
    public enum FuelType {
        GASOLINE, DIESEL, ELECTRIC, HYBRID, LPG
    }

    /**
     * Types de transmission.
     */
    public enum TransmissionType {
        MANUAL, AUTOMATIC, SEMI_AUTOMATIC
    }

    /**
     * Statuts métier du véhicule.
     */
    public enum VehicleStatus {
        AVAILABLE,
        IN_USE,
        UNDER_MAINTENANCE,
        OUT_OF_SERVICE,
        RESERVED
    }
}