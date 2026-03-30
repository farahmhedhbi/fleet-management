package com.example.fleet_backend.dto;

import java.time.LocalDateTime;

public class GpsIncomingDTO {
    private Long vehicleId;
    private Double latitude;
    private Double longitude;
    private Double speed;
    private boolean engineOn;
    private LocalDateTime timestamp;
    private String routeId;
    private String routeSource;

    public GpsIncomingDTO() {}

    public Long getVehicleId() {
        return vehicleId;
    }

    public void setVehicleId(Long vehicleId) {
        this.vehicleId = vehicleId;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public Double getSpeed() {
        return speed;
    }

    public void setSpeed(Double speed) {
        this.speed = speed;
    }

    public boolean isEngineOn() {
        return engineOn;
    }

    public void setEngineOn(boolean engineOn) {
        this.engineOn = engineOn;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public String getRouteId() {
        return routeId;
    }

    public void setRouteId(String routeId) {
        this.routeId = routeId;
    }

    public String getRouteSource() {
        return routeSource;
    }

    public void setRouteSource(String routeSource) {
        this.routeSource = routeSource;
    }
}