package com.example.fleet_backend.dto;

import com.example.fleet_backend.model.ReturnDepotRequest;
import com.example.fleet_backend.model.ReturnDepotStatus;

import java.time.LocalDateTime;

public class ReturnDepotDTO {

    private Long id;
    private Long missionId;
    private Long vehicleId;
    private Long driverId;

    private Double depotLatitude;
    private Double depotLongitude;
    private Double currentLatitude;
    private Double currentLongitude;

    private Double distanceMeters;
    private Integer etaMinutes;

    private ReturnDepotStatus status;

    private LocalDateTime suggestedAt;
    private LocalDateTime acceptedAt;
    private LocalDateTime startedAt;
    private LocalDateTime arrivedAt;

    public ReturnDepotDTO(ReturnDepotRequest r) {
        this.id = r.getId();
        this.missionId = r.getMissionId();
        this.vehicleId = r.getVehicleId();
        this.driverId = r.getDriverId();
        this.depotLatitude = r.getDepotLatitude();
        this.depotLongitude = r.getDepotLongitude();
        this.currentLatitude = r.getCurrentLatitude();
        this.currentLongitude = r.getCurrentLongitude();
        this.distanceMeters = r.getDistanceMeters();
        this.etaMinutes = r.getEtaMinutes();
        this.status = r.getStatus();
        this.suggestedAt = r.getSuggestedAt();
        this.acceptedAt = r.getAcceptedAt();
        this.startedAt = r.getStartedAt();
        this.arrivedAt = r.getArrivedAt();
    }

    public Long getId() { return id; }
    public Long getMissionId() { return missionId; }
    public Long getVehicleId() { return vehicleId; }
    public Long getDriverId() { return driverId; }
    public Double getDepotLatitude() { return depotLatitude; }
    public Double getDepotLongitude() { return depotLongitude; }
    public Double getCurrentLatitude() { return currentLatitude; }
    public Double getCurrentLongitude() { return currentLongitude; }
    public Double getDistanceMeters() { return distanceMeters; }
    public Integer getEtaMinutes() { return etaMinutes; }
    public ReturnDepotStatus getStatus() { return status; }
    public LocalDateTime getSuggestedAt() { return suggestedAt; }
    public LocalDateTime getAcceptedAt() { return acceptedAt; }
    public LocalDateTime getStartedAt() { return startedAt; }
    public LocalDateTime getArrivedAt() { return arrivedAt; }
}