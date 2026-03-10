package com.example.fleet_backend.dto;

public class OwnerVehicleCountDTO {
    private Long ownerId;
    private long vehiclesCount;

    public OwnerVehicleCountDTO() {
    }

    public OwnerVehicleCountDTO(Long ownerId, long vehiclesCount) {
        this.ownerId = ownerId;
        this.vehiclesCount = vehiclesCount;
    }

    public Long getOwnerId() {
        return ownerId;
    }

    public void setOwnerId(Long ownerId) {
        this.ownerId = ownerId;
    }

    public long getVehiclesCount() {
        return vehiclesCount;
    }

    public void setVehiclesCount(long vehiclesCount) {
        this.vehiclesCount = vehiclesCount;
    }
}