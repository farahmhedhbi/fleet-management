package com.example.fleet_backend.dto;

import com.example.fleet_backend.model.MaintenancePriority;
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
    private MaintenancePriority priority;

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

    private Long incidentId;
    private String incidentTitle;
    private Long workOrderId;
    private String workOrderTitle;

    public MaintenanceDTO(
            Long id,
            Long vehicleId,
            String vehicleRegistrationNumber,
            MaintenanceType type,
            MaintenanceStatus status,
            MaintenancePriority priority,
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
            LocalDateTime updatedAt,
            Long incidentId,
            String incidentTitle,
            Long workOrderId,
            String workOrderTitle
    ) {
        this.id = id;
        this.vehicleId = vehicleId;
        this.vehicleRegistrationNumber = vehicleRegistrationNumber;
        this.type = type;
        this.status = status;
        this.priority = priority;
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
        this.incidentId = incidentId;
        this.incidentTitle = incidentTitle;
        this.workOrderId = workOrderId;
        this.workOrderTitle = workOrderTitle;
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

    public MaintenancePriority getPriority() {
        return priority;
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
    public Long getWorkOrderId() {
        return workOrderId;
    }

    public String getWorkOrderTitle() {
        return workOrderTitle;
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

    public Long getIncidentId() {
        return incidentId;
    }

    public String getIncidentTitle() {
        return incidentTitle;
    }
}