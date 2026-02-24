package com.example.fleet_backend.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

/**
 * ✅ TripPayload
 *
 * DTO utilisé pour recevoir des données de trajet (Trip)
 * depuis :
 * - API externe (ex: GPS/OBD)
 * - Requête REST JSON
 *
 * Ce DTO est destiné à être stocké d'abord en RawData
 * avant transformation métier (Sprint 2).
 *
 * Validation via Jakarta Validation (@Valid dans Controller).
 */
public class TripPayload {

    /**
     * ✅ ID du véhicule concerné
     * Obligatoire
     */
    @NotNull
    private Long vehicle_id;

    /**
     * ✅ ID du conducteur
     * Obligatoire
     */
    @NotNull
    private Long driver_id;

    /**
     * ✅ Distance parcourue
     * >= 0
     */
    @NotNull
    @PositiveOrZero
    private Integer distance;

    /**
     * ✅ Durée du trajet
     * >= 0
     */
    @NotNull
    @PositiveOrZero
    private Integer duration;

    /**
     * ✅ Date du trajet
     *
     * Gardée en String volontairement :
     * - Permet stockage brut
     * - Validation plus stricte prévue dans Sprint 2
     *
     * Format attendu (exemple) :
     * "2026-02-01"
     */
    @NotNull
    private String date;

    // =========================
    // GETTERS & SETTERS
    // =========================

    public Long getVehicle_id() { return vehicle_id; }
    public void setVehicle_id(Long vehicle_id) { this.vehicle_id = vehicle_id; }

    public Long getDriver_id() { return driver_id; }
    public void setDriver_id(Long driver_id) { this.driver_id = driver_id; }

    public Integer getDistance() { return distance; }
    public void setDistance(Integer distance) { this.distance = distance; }

    public Integer getDuration() { return duration; }
    public void setDuration(Integer duration) { this.duration = duration; }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }
}