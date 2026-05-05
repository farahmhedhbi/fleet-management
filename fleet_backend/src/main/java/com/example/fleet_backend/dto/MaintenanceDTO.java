package com.example.fleet_backend.dto;

import com.example.fleet_backend.model.MaintenanceStatus;
import com.example.fleet_backend.model.MaintenanceType;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class MaintenanceDTO {

    private Long id;

    private Long vehicleId;
    private String vehicleRegistrationNumber;

    private MaintenanceType type;
    private MaintenanceStatus status;

    private String title;
    private String description;

    private LocalDateTime maintenanceDate;
    private LocalDateTime plannedDate;
    private LocalDateTime completedAt;

    private Integer mileage;
    private BigDecimal cost;

    private Long createdByUserId;
    private String createdByEmail;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public MaintenanceDTO(
            Long id,
            Long vehicleId,
            String vehicleRegistrationNumber,
            MaintenanceType type,
            MaintenanceStatus status,
            String title,
            String description,
            LocalDateTime maintenanceDate,
            LocalDateTime plannedDate,
            LocalDateTime completedAt,
            Integer mileage,
            BigDecimal cost,
            Long createdByUserId,
            String createdByEmail,
            LocalDateTime createdAt,
            LocalDateTime updatedAt
    ) {
        this.id = id;
        this.vehicleId = vehicleId;
        this.vehicleRegistrationNumber = vehicleRegistrationNumber;
        this.type = type;
        this.status = status;
        this.title = title;
        this.description = description;
        this.maintenanceDate = maintenanceDate;
        this.plannedDate = plannedDate;
        this.completedAt = completedAt;
        this.mileage = mileage;
        this.cost = cost;
        this.createdByUserId = createdByUserId;
        this.createdByEmail = createdByEmail;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public Long getId() {
        return id;
    }

    public Long getVehicleId() {
        return vehicleId;
    }

    public String getVehicleRegistrationNumber() {
        return vehicleRegistrationNumber;
    }

    public MaintenanceType getType() {
        return type;
    }

    public MaintenanceStatus getStatus() {
        return status;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public LocalDateTime getMaintenanceDate() {
        return maintenanceDate;
    }

    public LocalDateTime getPlannedDate() {
        return plannedDate;
    }

    public LocalDateTime getCompletedAt() {
        return completedAt;
    }

    public Integer getMileage() {
        return mileage;
    }

    public BigDecimal getCost() {
        return cost;
    }

    public Long getCreatedByUserId() {
        return createdByUserId;
    }

    public String getCreatedByEmail() {
        return createdByEmail;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}