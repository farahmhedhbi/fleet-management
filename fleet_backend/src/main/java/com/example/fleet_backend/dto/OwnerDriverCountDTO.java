package com.example.fleet_backend.dto;

public class OwnerDriverCountDTO {

    private Long ownerId;
    private long driversCount;

    public OwnerDriverCountDTO() {
    }

    public OwnerDriverCountDTO(Long ownerId, long driversCount) {
        this.ownerId = ownerId;
        this.driversCount = driversCount;
    }

    public Long getOwnerId() {
        return ownerId;
    }

    public void setOwnerId(Long ownerId) {
        this.ownerId = ownerId;
    }

    public long getDriversCount() {
        return driversCount;
    }

    public void setDriversCount(long driversCount) {
        this.driversCount = driversCount;
    }
}