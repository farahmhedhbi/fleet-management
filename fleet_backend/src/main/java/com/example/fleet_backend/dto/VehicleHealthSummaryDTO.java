package com.example.fleet_backend.dto;

public class VehicleHealthSummaryDTO {

    private Long vehicleId;
    private String registrationNumber;

    private String obdStatus;

    // ✅ IMPORTANT
    private String healthState;
    private String healthReason;

    private Integer activeAlertsCount;
    private Double fuelLevel;
    private Double engineTemperature;
    private Double batteryVoltage;
    private Boolean checkEngineOn;

    private String maintenanceHint;

    // getters setters

    public Long getVehicleId() { return vehicleId; }
    public void setVehicleId(Long vehicleId) { this.vehicleId = vehicleId; }

    public String getRegistrationNumber() { return registrationNumber; }
    public void setRegistrationNumber(String registrationNumber) { this.registrationNumber = registrationNumber; }

    public String getObdStatus() { return obdStatus; }
    public void setObdStatus(String obdStatus) { this.obdStatus = obdStatus; }

    public String getHealthState() { return healthState; }
    public void setHealthState(String healthState) { this.healthState = healthState; }

    public String getHealthReason() { return healthReason; }
    public void setHealthReason(String healthReason) { this.healthReason = healthReason; }

    public Integer getActiveAlertsCount() { return activeAlertsCount; }
    public void setActiveAlertsCount(Integer activeAlertsCount) { this.activeAlertsCount = activeAlertsCount; }

    public Double getFuelLevel() { return fuelLevel; }
    public void setFuelLevel(Double fuelLevel) { this.fuelLevel = fuelLevel; }

    public Double getEngineTemperature() { return engineTemperature; }
    public void setEngineTemperature(Double engineTemperature) { this.engineTemperature = engineTemperature; }

    public Double getBatteryVoltage() { return batteryVoltage; }
    public void setBatteryVoltage(Double batteryVoltage) { this.batteryVoltage = batteryVoltage; }

    public Boolean getCheckEngineOn() { return checkEngineOn; }
    public void setCheckEngineOn(Boolean checkEngineOn) { this.checkEngineOn = checkEngineOn; }

    public String getMaintenanceHint() { return maintenanceHint; }
    public void setMaintenanceHint(String maintenanceHint) { this.maintenanceHint = maintenanceHint; }
}