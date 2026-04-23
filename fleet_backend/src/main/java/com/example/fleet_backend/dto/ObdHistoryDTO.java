package com.example.fleet_backend.dto;

import java.time.LocalDateTime;

public class ObdHistoryDTO {

    private Long id;
    private Long vehicleId;
    private Integer engineRpm;
    private Double fuelLevel;
    private Double engineTemperature;
    private Double batteryVoltage;
    private Double engineLoad;
    private Boolean checkEngineOn;
    private LocalDateTime timestamp;

    public ObdHistoryDTO(Long id,
                         Long vehicleId,
                         Integer engineRpm,
                         Double fuelLevel,
                         Double engineTemperature,
                         Double batteryVoltage,
                         Double engineLoad,
                         Boolean checkEngineOn,
                         LocalDateTime timestamp) {
        this.id = id;
        this.vehicleId = vehicleId;
        this.engineRpm = engineRpm;
        this.fuelLevel = fuelLevel;
        this.engineTemperature = engineTemperature;
        this.batteryVoltage = batteryVoltage;
        this.engineLoad = engineLoad;
        this.checkEngineOn = checkEngineOn;
        this.timestamp = timestamp;
    }

    public Long getId() { return id; }
    public Long getVehicleId() { return vehicleId; }
    public Integer getEngineRpm() { return engineRpm; }
    public Double getFuelLevel() { return fuelLevel; }
    public Double getEngineTemperature() { return engineTemperature; }
    public Double getBatteryVoltage() { return batteryVoltage; }
    public Double getEngineLoad() { return engineLoad; }
    public Boolean getCheckEngineOn() { return checkEngineOn; }
    public LocalDateTime getTimestamp() { return timestamp; }
}