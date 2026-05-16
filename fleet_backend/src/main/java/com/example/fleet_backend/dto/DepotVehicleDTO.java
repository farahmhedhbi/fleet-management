package com.example.fleet_backend.dto;

import com.example.fleet_backend.model.DepotVehicleStatus;

public class DepotVehicleDTO {

    private Long vehicleId;

    private String plateNumber;

    private Double latitude;

    private Double longitude;

    private DepotVehicleStatus status;

    private Double distanceFromDepotKm;

    public Long getVehicleId() {
        return vehicleId;
    }

    public void setVehicleId(Long vehicleId) {
        this.vehicleId = vehicleId;
    }

    public String getPlateNumber() {
        return plateNumber;
    }

    public void setPlateNumber(String plateNumber) {
        this.plateNumber = plateNumber;
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

    public DepotVehicleStatus getStatus() {
        return status;
    }

    public void setStatus(DepotVehicleStatus status) {
        this.status = status;
    }

    public Double getDistanceFromDepotKm() {
        return distanceFromDepotKm;
    }

    public void setDistanceFromDepotKm(Double distanceFromDepotKm) {
        this.distanceFromDepotKm = distanceFromDepotKm;
    }
}