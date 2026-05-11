package com.example.fleet_backend.dto;

import com.example.fleet_backend.model.MaintenanceStatus;
import jakarta.validation.constraints.NotNull;

public class MaintenanceUpdateStatusRequest {

    @NotNull(message = "Le statut est obligatoire")
    private MaintenanceStatus status;

    public MaintenanceUpdateStatusRequest() {
    }

    public MaintenanceStatus getStatus() {
        return status;
    }

    public void setStatus(MaintenanceStatus status) {
        this.status = status;
    }
}