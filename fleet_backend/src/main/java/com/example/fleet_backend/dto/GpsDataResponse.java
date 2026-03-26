package com.example.fleet_backend.dto;

import com.example.fleet_backend.model.GpsData;

import java.time.LocalDateTime;

public class GpsDataResponse {

    private Long id;
    private Long vehicleId;
    private Double latitude;
    private Double longitude;
    private Double speed;
    private Boolean engineOn;
    private LocalDateTime timestamp;

    public GpsDataResponse() {
    }

    public GpsDataResponse(GpsData gpsData) {
        this.id = gpsData.getId();
        this.vehicleId = gpsData.getVehicle().getId();
        this.latitude = gpsData.getLatitude();
        this.longitude = gpsData.getLongitude();
        this.speed = gpsData.getSpeed();
        this.engineOn = gpsData.getEngineOn();
        this.timestamp = gpsData.getTimestamp();
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

    public Boolean getEngineOn() {
        return engineOn;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }
}