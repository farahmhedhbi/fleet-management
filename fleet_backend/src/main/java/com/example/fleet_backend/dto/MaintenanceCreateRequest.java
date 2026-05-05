package com.example.fleet_backend.dto;

import com.example.fleet_backend.model.MaintenanceStatus;
import com.example.fleet_backend.model.MaintenanceType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class MaintenanceCreateRequest {

    @NotNull
    private Long vehicleId;

    @NotNull
    private MaintenanceType type;

    @NotBlank
    private String title;

    private String description;

    private MaintenanceStatus status;

    private LocalDateTime maintenanceDate;

    private LocalDateTime plannedDate;

    private Integer mileage;

    private BigDecimal cost;

    public Long getVehicleId() {
        return vehicleId;
    }

    public MaintenanceType getType() {
        return type;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public MaintenanceStatus getStatus() {
        return status;
    }

    public LocalDateTime getMaintenanceDate() {
        return maintenanceDate;
    }

    public LocalDateTime getPlannedDate() {
        return plannedDate;
    }

    public Integer getMileage() {
        return mileage;
    }

    public BigDecimal getCost() {
        return cost;
    }
}