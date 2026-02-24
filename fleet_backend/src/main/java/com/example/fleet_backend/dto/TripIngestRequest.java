package com.example.fleet_backend.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

/**
 * ✅ TripIngestRequest
 *
 * DTO utilisé pour l’ingestion sécurisée des données de trajets
 * via une API REST (ex: GPS/OBD, client externe).
 *
 * Différence avec TripPayload :
 * - Validation plus stricte (@Positive au lieu de @PositiveOrZero)
 * - Destiné aux entrées temps réel
 *
 * Format attendu :
 * {
 *   "vehicle_id": 1,
 *   "driver_id": 2,
 *   "distance": 120,
 *   "duration": 90,
 *   "date": "2026-02-01"
 * }
 */
public class TripIngestRequest {

    /**
     * ✅ ID du véhicule
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
     * Strictement positive (> 0)
     */
    @NotNull
    @Positive
    private Integer distance;

    /**
     * ✅ Durée du trajet
     * Strictement positive (> 0)
     */
    @NotNull
    @Positive
    private Integer duration;

    /**
     * ✅ Date du trajet
     * Format attendu : "YYYY-MM-DD"
     *
     * Validation fine du format possible plus tard
     * (ex: @Pattern ou transformation en LocalDate)
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