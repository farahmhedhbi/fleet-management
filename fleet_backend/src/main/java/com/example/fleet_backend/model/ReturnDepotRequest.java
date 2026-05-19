package com.example.fleet_backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "return_depot_requests")
public class ReturnDepotRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
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

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ReturnDepotStatus status = ReturnDepotStatus.SUGGESTED;

    private LocalDateTime suggestedAt;
    private LocalDateTime acceptedAt;
    private LocalDateTime startedAt;
    private LocalDateTime arrivedAt;

    @PrePersist
    public void onCreate() {
        if (suggestedAt == null) suggestedAt = LocalDateTime.now();
        if (status == null) status = ReturnDepotStatus.SUGGESTED;
    }

    public Long getId() { return id; }

    public Long getMissionId() { return missionId; }
    public void setMissionId(Long missionId) { this.missionId = missionId; }

    public Long getVehicleId() { return vehicleId; }
    public void setVehicleId(Long vehicleId) { this.vehicleId = vehicleId; }

    public Long getDriverId() { return driverId; }
    public void setDriverId(Long driverId) { this.driverId = driverId; }

    public Double getDepotLatitude() { return depotLatitude; }
    public void setDepotLatitude(Double depotLatitude) { this.depotLatitude = depotLatitude; }

    public Double getDepotLongitude() { return depotLongitude; }
    public void setDepotLongitude(Double depotLongitude) { this.depotLongitude = depotLongitude; }

    public Double getCurrentLatitude() { return currentLatitude; }
    public void setCurrentLatitude(Double currentLatitude) { this.currentLatitude = currentLatitude; }

    public Double getCurrentLongitude() { return currentLongitude; }
    public void setCurrentLongitude(Double currentLongitude) { this.currentLongitude = currentLongitude; }

    public Double getDistanceMeters() { return distanceMeters; }
    public void setDistanceMeters(Double distanceMeters) { this.distanceMeters = distanceMeters; }

    public Integer getEtaMinutes() { return etaMinutes; }
    public void setEtaMinutes(Integer etaMinutes) { this.etaMinutes = etaMinutes; }

    public ReturnDepotStatus getStatus() { return status; }
    public void setStatus(ReturnDepotStatus status) { this.status = status; }

    public LocalDateTime getSuggestedAt() { return suggestedAt; }
    public void setSuggestedAt(LocalDateTime suggestedAt) { this.suggestedAt = suggestedAt; }

    public LocalDateTime getAcceptedAt() { return acceptedAt; }
    public void setAcceptedAt(LocalDateTime acceptedAt) { this.acceptedAt = acceptedAt; }

    public LocalDateTime getStartedAt() { return startedAt; }
    public void setStartedAt(LocalDateTime startedAt) { this.startedAt = startedAt; }

    public LocalDateTime getArrivedAt() { return arrivedAt; }
    public void setArrivedAt(LocalDateTime arrivedAt) { this.arrivedAt = arrivedAt; }
}