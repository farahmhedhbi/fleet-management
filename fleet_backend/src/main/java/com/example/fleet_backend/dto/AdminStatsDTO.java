package com.example.fleet_backend.dto;

public class AdminStatsDTO {
    public long ownersCount;

    public long vehiclesCount;
    public long availableVehicles;
    public long inServiceVehicles;
    public long outVehicles;

    public long driversCount;
    public long activeDrivers;

    public long vehiclesNeedingMaintenance;

    public double totalMileage;

    // =========================
    // GETTERS & SETTERS
    // =========================

    public long getOwnersCount() {
        return ownersCount;
    }

    public void setOwnersCount(long ownersCount) {
        this.ownersCount = ownersCount;
    }

    public long getVehiclesCount() {
        return vehiclesCount;
    }

    public void setVehiclesCount(long vehiclesCount) {
        this.vehiclesCount = vehiclesCount;
    }

    public long getAvailableVehicles() {
        return availableVehicles;
    }

    public void setAvailableVehicles(long availableVehicles) {
        this.availableVehicles = availableVehicles;
    }

    public long getInServiceVehicles() {
        return inServiceVehicles;
    }

    public void setInServiceVehicles(long inServiceVehicles) {
        this.inServiceVehicles = inServiceVehicles;
    }

    public long getOutVehicles() {
        return outVehicles;
    }

    public void setOutVehicles(long outVehicles) {
        this.outVehicles = outVehicles;
    }

    public long getDriversCount() {
        return driversCount;
    }

    public void setDriversCount(long driversCount) {
        this.driversCount = driversCount;
    }

    public long getActiveDrivers() {
        return activeDrivers;
    }

    public void setActiveDrivers(long activeDrivers) {
        this.activeDrivers = activeDrivers;
    }

    public long getVehiclesNeedingMaintenance() {
        return vehiclesNeedingMaintenance;
    }

    public void setVehiclesNeedingMaintenance(long vehiclesNeedingMaintenance) {
        this.vehiclesNeedingMaintenance = vehiclesNeedingMaintenance;
    }

    public double getTotalMileage() {
        return totalMileage;
    }

    public void setTotalMileage(double totalMileage) {
        this.totalMileage = totalMileage;
    }
}