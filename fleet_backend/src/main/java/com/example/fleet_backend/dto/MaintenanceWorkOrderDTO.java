package com.example.fleet_backend.dto;

import com.example.fleet_backend.model.WorkOrderStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class MaintenanceWorkOrderDTO {

    private Long id;

    private Long vehicleId;
    private String vehicleRegistrationNumber;

    private WorkOrderStatus status;

    private String title;
    private String garageName;
    private String notes;

    private LocalDateTime startDate;
    private LocalDateTime endDate;

    private Integer estimatedDurationDays;

    private BigDecimal estimatedCost;
    private BigDecimal actualCost;

    private Long createdByUserId;
    private String createdByEmail;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private List<MaintenanceDTO> maintenances;

    public MaintenanceWorkOrderDTO(
            Long id,
            Long vehicleId,
            String vehicleRegistrationNumber,
            WorkOrderStatus status,
            String title,
            String garageName,
            String notes,
            LocalDateTime startDate,
            LocalDateTime endDate,
            Integer estimatedDurationDays,
            BigDecimal estimatedCost,
            BigDecimal actualCost,
            Long createdByUserId,
            String createdByEmail,
            LocalDateTime createdAt,
            LocalDateTime updatedAt,
            List<MaintenanceDTO> maintenances
    ) {
        this.id = id;
        this.vehicleId = vehicleId;
        this.vehicleRegistrationNumber = vehicleRegistrationNumber;
        this.status = status;
        this.title = title;
        this.garageName = garageName;
        this.notes = notes;
        this.startDate = startDate;
        this.endDate = endDate;
        this.estimatedDurationDays = estimatedDurationDays;
        this.estimatedCost = estimatedCost;
        this.actualCost = actualCost;
        this.createdByUserId = createdByUserId;
        this.createdByEmail = createdByEmail;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.maintenances = maintenances;
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

    public WorkOrderStatus getStatus() {
        return status;
    }

    public String getTitle() {
        return title;
    }

    public String getGarageName() {
        return garageName;
    }

    public String getNotes() {
        return notes;
    }

    public LocalDateTime getStartDate() {
        return startDate;
    }

    public LocalDateTime getEndDate() {
        return endDate;
    }

    public Integer getEstimatedDurationDays() {
        return estimatedDurationDays;
    }

    public BigDecimal getEstimatedCost() {
        return estimatedCost;
    }

    public BigDecimal getActualCost() {
        return actualCost;
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

    public List<MaintenanceDTO> getMaintenances() {
        return maintenances;
    }
}