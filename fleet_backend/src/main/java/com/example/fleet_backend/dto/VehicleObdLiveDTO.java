package com.example.fleet_backend.dto;

import java.time.LocalDateTime;

public class VehicleObdLiveDTO {
    private Long vehicleId;
    private String registrationNumber;
    private Boolean engineOn;
    private Integer engineRpm;
    private Double fuelLevel;
    private Double engineTemperature;
    private Double batteryVoltage;
    private Double engineLoad;
    private Boolean checkEngineOn;
    private String obdStatus;
    private LocalDateTime timestamp;

    public Long getVehicleId() {
        return vehicleId;
    }

    public void setVehicleId(Long vehicleId) {
        this.vehicleId = vehicleId;
    }

    public String getRegistrationNumber() {
        return registrationNumber;
    }

    public void setRegistrationNumber(String registrationNumber) {
        this.registrationNumber = registrationNumber;
    }

    public Boolean getEngineOn() {
        return engineOn;
    }

    public void setEngineOn(Boolean engineOn) {
        this.engineOn = engineOn;
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

    public String getObdStatus() {
        return obdStatus;
    }

    public void setObdStatus(String obdStatus) {
        this.obdStatus = obdStatus;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
}