package com.example.fleet_backend.dto;

import java.time.LocalDateTime;

public class GpsDataRequest {

    private Long vehicleId;
    private Double latitude;
    private Double longitude;
    private Double speed;
    private Boolean engineOn;
    private LocalDateTime timestamp;

    public GpsDataRequest() {
    }

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

    public Boolean getEngineOn() {
        return engineOn;
    }

    public void setEngineOn(Boolean engineOn) {
        this.engineOn = engineOn;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
}