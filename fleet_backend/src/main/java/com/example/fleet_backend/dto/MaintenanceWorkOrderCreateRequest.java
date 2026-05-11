package com.example.fleet_backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class MaintenanceWorkOrderCreateRequest {

    @NotNull
    private Long vehicleId;

    @NotBlank
    private String title;

    private String garageName;
    private String notes;

    private LocalDateTime startDate;
    private LocalDateTime endDate;

    private Integer estimatedDurationDays;

    private BigDecimal estimatedCost;

    private List<Long> maintenanceIds;

    public Long getVehicleId() {
        return vehicleId;
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

    public List<Long> getMaintenanceIds() {
        return maintenanceIds;
    }
}