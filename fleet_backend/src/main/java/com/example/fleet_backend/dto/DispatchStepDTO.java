package com.example.fleet_backend.dto;

import com.example.fleet_backend.model.DispatchStepType;

import java.time.LocalDateTime;

public class DispatchStepDTO {

    private DispatchStepType type;

    private Long missionId;
    private String label;

    private String fromCity;
    private String toCity;

    private LocalDateTime startTime;
    private LocalDateTime endTime;

    private Long vehicleId;
    private String vehiclePlate;

    private Long driverId;
    private String driverName;

    private Integer durationMinutes;

    public DispatchStepDTO() {}

    public DispatchStepDTO(
            DispatchStepType type,
            Long missionId,
            String label,
            String fromCity,
            String toCity,
            LocalDateTime startTime,
            LocalDateTime endTime,
            Integer durationMinutes
    ) {
        this.type = type;
        this.missionId = missionId;
        this.label = label;
        this.fromCity = fromCity;
        this.toCity = toCity;
        this.startTime = startTime;
        this.endTime = endTime;
        this.durationMinutes = durationMinutes;
    }
    public DispatchStepType getType() {
        return type;
    }

    public void setType(DispatchStepType type) {
        this.type = type;
    }

    public Long getMissionId() {
        return missionId;
    }

    public void setMissionId(Long missionId) {
        this.missionId = missionId;
    }

    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }

    public String getFromCity() {
        return fromCity;
    }

    public void setFromCity(String fromCity) {
        this.fromCity = fromCity;
    }

    public String getToCity() {
        return toCity;
    }

    public void setToCity(String toCity) {
        this.toCity = toCity;
    }

    public LocalDateTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalDateTime startTime) {
        this.startTime = startTime;
    }

    public LocalDateTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalDateTime endTime) {
        this.endTime = endTime;
    }

    public Long getVehicleId() {
        return vehicleId;
    }

    public void setVehicleId(Long vehicleId) {
        this.vehicleId = vehicleId;
    }

    public String getVehiclePlate() {
        return vehiclePlate;
    }

    public void setVehiclePlate(String vehiclePlate) {
        this.vehiclePlate = vehiclePlate;
    }

    public Long getDriverId() {
        return driverId;
    }

    public void setDriverId(Long driverId) {
        this.driverId = driverId;
    }

    public String getDriverName() {
        return driverName;
    }

    public void setDriverName(String driverName) {
        this.driverName = driverName;
    }

    public Integer getDurationMinutes() {
        return durationMinutes;
    }

    public void setDurationMinutes(Integer durationMinutes) {
        this.durationMinutes = durationMinutes;
    }
}