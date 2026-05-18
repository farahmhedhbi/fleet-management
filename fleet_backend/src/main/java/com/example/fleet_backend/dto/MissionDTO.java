package com.example.fleet_backend.dto;

import com.example.fleet_backend.model.Driver;
import com.example.fleet_backend.model.Mission;
import com.example.fleet_backend.model.Vehicle;

import java.time.LocalDateTime;

public class MissionDTO {

    private Long id;
    private String title;
    private String description;
    private String departure;
    private String destination;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private String status;

    private Long ownerId;

    private Long driverId;
    private String driverName;
    private String driverStatus;
    private LocalDateTime driverAvailableAt;

    private Long vehicleId;
    private String vehicleRegistrationNumber;
    private String vehicleStatus;

    private String routeJson;

    private LocalDateTime startedAt;
    private LocalDateTime finishedAt;

    private String originalRouteJson;
    private String routeCheckStatus;
    private String routeRiskLevel;
    private Boolean routeRecalculated;
    private Integer originalDurationMinutes;
    private Integer selectedDurationMinutes;
    private Integer estimatedDelayMinutes;
    private Double originalDistanceKm;
    private Double selectedDistanceKm;
    private LocalDateTime routeCheckedAt;
    private String routeCheckMessage;

    public MissionDTO() {}

    public MissionDTO(Mission mission) {
        if (mission == null) {
            return;
        }

        this.id = mission.getId();
        this.title = mission.getTitle();
        this.description = mission.getDescription();
        this.departure = mission.getDeparture();
        this.destination = mission.getDestination();
        this.startDate = mission.getStartDate();
        this.endDate = mission.getEndDate();
        this.status = mission.getStatus() != null ? mission.getStatus().name() : null;

        this.routeJson = mission.getRouteJson();
        this.startedAt = mission.getStartedAt();
        this.finishedAt = mission.getFinishedAt();

        this.originalRouteJson = mission.getOriginalRouteJson();

        this.routeCheckStatus = mission.getRouteCheckStatus() != null
                ? mission.getRouteCheckStatus().name()
                : null;

        this.routeRiskLevel = mission.getRouteRiskLevel() != null
                ? mission.getRouteRiskLevel().name()
                : null;

        this.routeRecalculated = mission.getRouteRecalculated();
        this.originalDurationMinutes = mission.getOriginalDurationMinutes();
        this.selectedDurationMinutes = mission.getSelectedDurationMinutes();
        this.estimatedDelayMinutes = mission.getEstimatedDelayMinutes();
        this.originalDistanceKm = mission.getOriginalDistanceKm();
        this.selectedDistanceKm = mission.getSelectedDistanceKm();
        this.routeCheckedAt = mission.getRouteCheckedAt();
        this.routeCheckMessage = mission.getRouteCheckMessage();

        if (mission.getOwner() != null) {
            this.ownerId = mission.getOwner().getId();
        }

        Driver driver = mission.getDriver();
        if (driver != null) {
            this.driverId = driver.getId();

            String firstName = driver.getFirstName() != null ? driver.getFirstName() : "";
            String lastName = driver.getLastName() != null ? driver.getLastName() : "";
            String fullName = (firstName + " " + lastName).trim();

            this.driverName = !fullName.isBlank() ? fullName : driver.getEmail();

            this.driverStatus = driver.getStatus() != null
                    ? driver.getStatus().name()
                    : null;

            this.driverAvailableAt = driver.getAvailableAt();
        }

        Vehicle vehicle = mission.getVehicle();
        if (vehicle != null) {
            this.vehicleId = vehicle.getId();
            this.vehicleRegistrationNumber = vehicle.getRegistrationNumber();

            this.vehicleStatus = vehicle.getStatus() != null
                    ? vehicle.getStatus().name()
                    : null;
        }
    }

    public Long getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public String getDeparture() {
        return departure;
    }

    public String getDestination() {
        return destination;
    }

    public LocalDateTime getStartDate() {
        return startDate;
    }

    public LocalDateTime getEndDate() {
        return endDate;
    }

    public String getStatus() {
        return status;
    }

    public Long getOwnerId() {
        return ownerId;
    }

    public Long getDriverId() {
        return driverId;
    }

    public String getDriverName() {
        return driverName;
    }

    public String getDriverStatus() {
        return driverStatus;
    }

    public LocalDateTime getDriverAvailableAt() {
        return driverAvailableAt;
    }

    public Long getVehicleId() {
        return vehicleId;
    }

    public String getVehicleRegistrationNumber() {
        return vehicleRegistrationNumber;
    }

    public String getVehicleStatus() {
        return vehicleStatus;
    }

    public String getRouteJson() {
        return routeJson;
    }

    public LocalDateTime getStartedAt() {
        return startedAt;
    }

    public LocalDateTime getFinishedAt() {
        return finishedAt;
    }

    public String getOriginalRouteJson() {
        return originalRouteJson;
    }

    public String getRouteCheckStatus() {
        return routeCheckStatus;
    }

    public String getRouteRiskLevel() {
        return routeRiskLevel;
    }

    public Boolean getRouteRecalculated() {
        return routeRecalculated;
    }

    public Integer getOriginalDurationMinutes() {
        return originalDurationMinutes;
    }

    public Integer getSelectedDurationMinutes() {
        return selectedDurationMinutes;
    }

    public Integer getEstimatedDelayMinutes() {
        return estimatedDelayMinutes;
    }

    public Double getOriginalDistanceKm() {
        return originalDistanceKm;
    }

    public Double getSelectedDistanceKm() {
        return selectedDistanceKm;
    }

    public LocalDateTime getRouteCheckedAt() {
        return routeCheckedAt;
    }

    public String getRouteCheckMessage() {
        return routeCheckMessage;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public void setDeparture(String departure) {
        this.departure = departure;
    }

    public void setDestination(String destination) {
        this.destination = destination;
    }

    public void setStartDate(LocalDateTime startDate) {
        this.startDate = startDate;
    }

    public void setEndDate(LocalDateTime endDate) {
        this.endDate = endDate;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public void setOwnerId(Long ownerId) {
        this.ownerId = ownerId;
    }

    public void setDriverId(Long driverId) {
        this.driverId = driverId;
    }

    public void setDriverName(String driverName) {
        this.driverName = driverName;
    }

    public void setDriverStatus(String driverStatus) {
        this.driverStatus = driverStatus;
    }

    public void setDriverAvailableAt(LocalDateTime driverAvailableAt) {
        this.driverAvailableAt = driverAvailableAt;
    }

    public void setVehicleId(Long vehicleId) {
        this.vehicleId = vehicleId;
    }

    public void setVehicleRegistrationNumber(String vehicleRegistrationNumber) {
        this.vehicleRegistrationNumber = vehicleRegistrationNumber;
    }

    public void setVehicleStatus(String vehicleStatus) {
        this.vehicleStatus = vehicleStatus;
    }

    public void setRouteJson(String routeJson) {
        this.routeJson = routeJson;
    }

    public void setStartedAt(LocalDateTime startedAt) {
        this.startedAt = startedAt;
    }

    public void setFinishedAt(LocalDateTime finishedAt) {
        this.finishedAt = finishedAt;
    }

    public void setOriginalRouteJson(String originalRouteJson) {
        this.originalRouteJson = originalRouteJson;
    }

    public void setRouteCheckStatus(String routeCheckStatus) {
        this.routeCheckStatus = routeCheckStatus;
    }

    public void setRouteRiskLevel(String routeRiskLevel) {
        this.routeRiskLevel = routeRiskLevel;
    }

    public void setRouteRecalculated(Boolean routeRecalculated) {
        this.routeRecalculated = routeRecalculated;
    }

    public void setOriginalDurationMinutes(Integer originalDurationMinutes) {
        this.originalDurationMinutes = originalDurationMinutes;
    }

    public void setSelectedDurationMinutes(Integer selectedDurationMinutes) {
        this.selectedDurationMinutes = selectedDurationMinutes;
    }

    public void setEstimatedDelayMinutes(Integer estimatedDelayMinutes) {
        this.estimatedDelayMinutes = estimatedDelayMinutes;
    }

    public void setOriginalDistanceKm(Double originalDistanceKm) {
        this.originalDistanceKm = originalDistanceKm;
    }

    public void setSelectedDistanceKm(Double selectedDistanceKm) {
        this.selectedDistanceKm = selectedDistanceKm;
    }

    public void setRouteCheckedAt(LocalDateTime routeCheckedAt) {
        this.routeCheckedAt = routeCheckedAt;
    }

    public void setRouteCheckMessage(String routeCheckMessage) {
        this.routeCheckMessage = routeCheckMessage;
    }
}