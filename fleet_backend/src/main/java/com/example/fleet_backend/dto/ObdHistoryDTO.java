package com.example.fleet_backend.dto;

import java.time.LocalDateTime;

public class ObdHistoryDTO {

    private Long id;
    private Long vehicleId;
    private Double engineRpm;
    private Double fuelLevel;
    private Double engineTemperature;
    private Double batteryVoltage;
    private Double engineLoad;
    private Boolean checkEngine;
    private LocalDateTime timestamp;

    public ObdHistoryDTO() {
    }

    public ObdHistoryDTO(
            Long id,
            Long vehicleId,
            Double engineRpm,
            Double fuelLevel,
            Double engineTemperature,
            Double batteryVoltage,
            Double engineLoad,
            Boolean checkEngine,
            LocalDateTime timestamp
    ) {
        this.id = id;
        this.vehicleId = vehicleId;
        this.engineRpm = engineRpm;
        this.fuelLevel = fuelLevel;
        this.engineTemperature = engineTemperature;
        this.batteryVoltage = batteryVoltage;
        this.engineLoad = engineLoad;
        this.checkEngine = checkEngine;
        this.timestamp = timestamp;
    }

    public Long getId() {
        return id;
    }

    public Long getVehicleId() {
        return vehicleId;
    }

    public Double getEngineRpm() {
        return engineRpm;
    }

    public Double getFuelLevel() {
        return fuelLevel;
    }

    public Double getEngineTemperature() {
        return engineTemperature;
    }

    public Double getBatteryVoltage() {
        return batteryVoltage;
    }

    public Double getEngineLoad() {
        return engineLoad;
    }

    public Boolean getCheckEngine() {
        return checkEngine;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setVehicleId(Long vehicleId) {
        this.vehicleId = vehicleId;
    }

    public void setEngineRpm(Double engineRpm) {
        this.engineRpm = engineRpm;
    }

    public void setFuelLevel(Double fuelLevel) {
        this.fuelLevel = fuelLevel;
    }

    public void setEngineTemperature(Double engineTemperature) {
        this.engineTemperature = engineTemperature;
    }

    public void setBatteryVoltage(Double batteryVoltage) {
        this.batteryVoltage = batteryVoltage;
    }

    public void setEngineLoad(Double engineLoad) {
        this.engineLoad = engineLoad;
    }

    public void setCheckEngine(Boolean checkEngine) {
        this.checkEngine = checkEngine;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
}