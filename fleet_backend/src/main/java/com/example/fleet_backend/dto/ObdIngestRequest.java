package com.example.fleet_backend.dto;

public class ObdIngestRequest {
    private Long vehicleId;
    private Double engineRpm;
    private Double fuelLevel;
    private Double engineTemperature;
    private Double batteryVoltage;
    private Double engineLoad;
    private Boolean checkEngine;

    // getters setters

    public Long getVehicleId() {
        return vehicleId;
    }

    public void setVehicleId(Long vehicleId) {
        this.vehicleId = vehicleId;
    }

    public Double getEngineRpm() {
        return engineRpm;
    }

    public void setEngineRpm(Double engineRpm) {
        this.engineRpm = engineRpm;
    }

    public Double getFuelLevel() {
        return fuelLevel;
    }

    public void setFuelLevel(Double fuelLevel) {
        this.fuelLevel = fuelLevel;
    }

    public Double getEngineTemperature() {
        return engineTemperature;
    }

    public void setEngineTemperature(Double engineTemperature) {
        this.engineTemperature = engineTemperature;
    }

    public Double getBatteryVoltage() {
        return batteryVoltage;
    }

    public void setBatteryVoltage(Double batteryVoltage) {
        this.batteryVoltage = batteryVoltage;
    }

    public Double getEngineLoad() {
        return engineLoad;
    }

    public void setEngineLoad(Double engineLoad) {
        this.engineLoad = engineLoad;
    }

    public Boolean getCheckEngine() {
        return checkEngine;
    }

    public void setCheckEngine(Boolean checkEngine) {
        this.checkEngine = checkEngine;
    }
}
