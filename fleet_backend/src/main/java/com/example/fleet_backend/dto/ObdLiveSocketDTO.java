package com.example.fleet_backend.dto;

import java.time.LocalDateTime;

public class ObdLiveSocketDTO {

    private Long vehicleId;
    private Integer engineRpm;
    private Double fuelLevel;
    private Double engineTemperature;
    private Double batteryVoltage;
    private Double engineLoad;
    private Boolean checkEngineOn;
    private Boolean engineOn;
    private String obdStatus;
    private String healthState;
    private String healthReason;
    private LocalDateTime timestamp;

    public ObdLiveSocketDTO() {
    }

    public ObdLiveSocketDTO(Long vehicleId,
                            Integer engineRpm,
                            Double fuelLevel,
                            Double engineTemperature,
                            Double batteryVoltage,
                            Double engineLoad,
                            Boolean checkEngineOn,
                            Boolean engineOn,
                            String obdStatus,
                            String healthState,
                            String healthReason,
                            LocalDateTime timestamp) {
        this.vehicleId = vehicleId;
        this.engineRpm = engineRpm;
        this.fuelLevel = fuelLevel;
        this.engineTemperature = engineTemperature;
        this.batteryVoltage = batteryVoltage;
        this.engineLoad = engineLoad;
        this.checkEngineOn = checkEngineOn;
        this.engineOn = engineOn;
        this.obdStatus = obdStatus;
        this.healthState = healthState;
        this.healthReason = healthReason;
        this.timestamp = timestamp;
    }

    public Long getVehicleId() { return vehicleId; }
    public void setVehicleId(Long vehicleId) { this.vehicleId = vehicleId; }

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

    public Boolean getEngineOn() { return engineOn; }
    public void setEngineOn(Boolean engineOn) { this.engineOn = engineOn; }

    public String getObdStatus() { return obdStatus; }
    public void setObdStatus(String obdStatus) { this.obdStatus = obdStatus; }

    public String getHealthState() { return healthState; }
    public void setHealthState(String healthState) { this.healthState = healthState; }

    public String getHealthReason() { return healthReason; }
    public void setHealthReason(String healthReason) { this.healthReason = healthReason; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
}