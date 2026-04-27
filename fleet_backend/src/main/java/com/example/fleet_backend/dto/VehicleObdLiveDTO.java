package com.example.fleet_backend.dto;

import java.time.LocalDateTime;

public class VehicleObdLiveDTO {

    private Long vehicleId;
    private String registrationNumber;

    private boolean engineOn;
    private Integer engineRpm;
    private Double fuelLevel;
    private Double engineTemperature;
    private Double batteryVoltage;
    private Double engineLoad;
    private Boolean checkEngineOn;

    private String obdStatus;

    // ✅ NOUVEAU
    private String healthState;
    private String healthReason;

    private LocalDateTime timestamp;

    // getters setters

    public Long getVehicleId() { return vehicleId; }
    public void setVehicleId(Long vehicleId) { this.vehicleId = vehicleId; }

    public String getRegistrationNumber() { return registrationNumber; }
    public void setRegistrationNumber(String registrationNumber) { this.registrationNumber = registrationNumber; }

    public boolean isEngineOn() { return engineOn; }
    public void setEngineOn(boolean engineOn) { this.engineOn = engineOn; }

    public Integer getEngineRpm() { return engineRpm; }
    public void setEngineRpm(Integer engineRpm) { this.engineRpm = engineRpm; }

    public Double getFuelLevel() { return fuelLevel; }
    public void setFuelLevel(Double fuelLevel) { this.fuelLevel = fuelLevel; }

    public Double getEngineTemperature() { return engineTemperature; }
    public void setEngineTemperature(Double engineTemperature) { this.engineTemperature = engineTemperature; }

    public Double getBatteryVoltage() { return batteryVoltage; }
    public void setBatteryVoltage(Double batteryVoltage) { this.batteryVoltage = batteryVoltage; }

    public Double getEngineLoad() { return engineLoad; }
    public void setEngineLoad(Double engineLoad) { this.engineLoad = engineLoad; }

    public Boolean getCheckEngineOn() { return checkEngineOn; }
    public void setCheckEngineOn(Boolean checkEngineOn) { this.checkEngineOn = checkEngineOn; }

    public String getObdStatus() { return obdStatus; }
    public void setObdStatus(String obdStatus) { this.obdStatus = obdStatus; }

    public String getHealthState() { return healthState; }
    public void setHealthState(String healthState) { this.healthState = healthState; }

    public String getHealthReason() { return healthReason; }
    public void setHealthReason(String healthReason) { this.healthReason = healthReason; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
}