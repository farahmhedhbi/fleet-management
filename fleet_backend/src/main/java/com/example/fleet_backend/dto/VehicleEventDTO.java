package com.example.fleet_backend.dto;

import java.time.LocalDateTime;

public class VehicleEventDTO {
    private Long id;
    private Long vehicleId;
    private Long missionId;
    private String eventType;
    private String severity;
    private String message;
    private Double latitude;
    private Double longitude;
    private Double speed;
    private LocalDateTime createdAt;
    private boolean acknowledged;

    public VehicleEventDTO() {}

    public VehicleEventDTO(Long id, Long vehicleId, Long missionId, String eventType,
                           String severity, String message, Double latitude,
                           Double longitude, Double speed, LocalDateTime createdAt,
                           boolean acknowledged) {
        this.id = id;
        this.vehicleId = vehicleId;
        this.missionId = missionId;
        this.eventType = eventType;
        this.severity = severity;
        this.message = message;
        this.latitude = latitude;
        this.longitude = longitude;
        this.speed = speed;
        this.createdAt = createdAt;
        this.acknowledged = acknowledged;
    }

    public Long getId() {
        return id;
    }

    public Long getVehicleId() {
        return vehicleId;
    }

    public Long getMissionId() {
        return missionId;
    }

    public String getEventType() {
        return eventType;
    }

    public String getSeverity() {
        return severity;
    }

    public String getMessage() {
        return message;
    }

    public Double getLatitude() {
        return latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public Double getSpeed() {
        return speed;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public boolean isAcknowledged() {
        return acknowledged;
    }
}