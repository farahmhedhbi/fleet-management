package com.example.fleet_backend.dto;

import com.example.fleet_backend.model.Mission;

import java.time.LocalDateTime;

public class CreatedMissionDTO {

    private Long id;
    private String title;
    private String description;
    private String departure;
    private String destination;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private String status;
    private Long ownerId;
    private Long vehicleId;
    private Long driverId;

    public static CreatedMissionDTO fromEntity(Mission mission) {
        CreatedMissionDTO dto = new CreatedMissionDTO();

        dto.setId(mission.getId());
        dto.setTitle(mission.getTitle());
        dto.setDescription(mission.getDescription());
        dto.setDeparture(mission.getDeparture());
        dto.setDestination(mission.getDestination());
        dto.setStartDate(mission.getStartDate());
        dto.setEndDate(mission.getEndDate());

        if (mission.getStatus() != null) {
            dto.setStatus(mission.getStatus().name());
        }

        if (mission.getOwner() != null) {
            dto.setOwnerId(mission.getOwner().getId());
        }

        if (mission.getVehicle() != null) {
            dto.setVehicleId(mission.getVehicle().getId());
        }

        if (mission.getDriver() != null) {
            dto.setDriverId(mission.getDriver().getId());
        }

        return dto;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getDeparture() {
        return departure;
    }

    public void setDeparture(String departure) {
        this.departure = departure;
    }

    public String getDestination() {
        return destination;
    }

    public void setDestination(String destination) {
        this.destination = destination;
    }

    public LocalDateTime getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDateTime startDate) {
        this.startDate = startDate;
    }

    public LocalDateTime getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDateTime endDate) {
        this.endDate = endDate;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Long getOwnerId() {
        return ownerId;
    }

    public void setOwnerId(Long ownerId) {
        this.ownerId = ownerId;
    }

    public Long getVehicleId() {
        return vehicleId;
    }

    public void setVehicleId(Long vehicleId) {
        this.vehicleId = vehicleId;
    }

    public Long getDriverId() {
        return driverId;
    }

    public void setDriverId(Long driverId) {
        this.driverId = driverId;
    }
}