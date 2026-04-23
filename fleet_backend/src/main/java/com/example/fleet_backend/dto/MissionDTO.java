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

    private Long vehicleId;
    private String vehicleRegistrationNumber;

    private String routeJson;

    private LocalDateTime startedAt;
    private LocalDateTime finishedAt;

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
        }

        Vehicle vehicle = mission.getVehicle();
        if (vehicle != null) {
            this.vehicleId = vehicle.getId();
            this.vehicleRegistrationNumber = vehicle.getRegistrationNumber();
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

    public Long getVehicleId() {
        return vehicleId;
    }

    public String getVehicleRegistrationNumber() {
        return vehicleRegistrationNumber;
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

    public void setDriverId(Long driverId) {
        this.driverId = driverId;
    }

    public void setVehicleId(Long vehicleId) {
        this.vehicleId = vehicleId;
    }

    public void setRouteJson(String routeJson) {
        this.routeJson = routeJson;
    }
}