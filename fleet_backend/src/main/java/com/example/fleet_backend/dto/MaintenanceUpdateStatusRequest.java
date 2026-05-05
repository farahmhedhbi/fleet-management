package com.example.fleet_backend.dto;

import com.example.fleet_backend.model.MaintenanceStatus;
import jakarta.validation.constraints.NotNull;

public class MaintenanceUpdateStatusRequest {

    @NotNull
    private MaintenanceStatus status;

    public MaintenanceStatus getStatus() {
        return status;
    }
}