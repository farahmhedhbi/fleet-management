package com.example.fleet_backend.dto;

public class ObdIngestRequest {

    private Long vehicleId;
    private Integer engineRpm;
    private Double fuelLevel;
    private Double engineTemperature;
    private Double batteryVoltage;
    private Double engineLoad;
    private Boolean checkEngineOn;

    public Long getVehicleId() {
        return vehicleId;
    }

    public void setVehicleId(Long vehicleId) {
        this.vehicleId = vehicleId;
    }

    public Integer getEngineRpm() {
        return engineRpm;
    }

    public void setEngineRpm(Integer engineRpm) {
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

    public Boolean getCheckEngineOn() {
        return checkEngineOn;
    }

    public void setCheckEngineOn(Boolean checkEngineOn) {
        this.checkEngineOn = checkEngineOn;
    }
}