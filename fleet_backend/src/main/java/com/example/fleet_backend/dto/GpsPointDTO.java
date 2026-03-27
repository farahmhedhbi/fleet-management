package com.example.fleet_backend.dto;

import java.time.LocalDateTime;

public class GpsPointDTO {
    private Long id;
    private Long vehicleId;
    private Double latitude;
    private Double longitude;
    private Double speed;
    private boolean engineOn;
    private LocalDateTime timestamp;
    private String routeId;
    private String routeSource;

    public GpsPointDTO() {
    }

    public GpsPointDTO(Long id,
                       Long vehicleId,
                       Double latitude,
                       Double longitude,
                       Double speed,
                       boolean engineOn,
                       LocalDateTime timestamp,
                       String routeId,
                       String routeSource) {
        this.id = id;
        this.vehicleId = vehicleId;
        this.latitude = latitude;
        this.longitude = longitude;
        this.speed = speed;
        this.engineOn = engineOn;
        this.timestamp = timestamp;
        this.routeId = routeId;
        this.routeSource = routeSource;
    }

    public Long getId() {
        return id;
    }

    public Long getVehicleId() {
        return vehicleId;
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

    public boolean isEngineOn() {
        return engineOn;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public String getRouteId() {
        return routeId;
    }

    public String getRouteSource() {
        return routeSource;
    }
}