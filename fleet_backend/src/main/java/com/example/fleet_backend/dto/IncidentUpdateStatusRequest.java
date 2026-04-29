package com.example.fleet_backend.dto;

import com.example.fleet_backend.model.IncidentStatus;
import jakarta.validation.constraints.NotNull;

public class IncidentUpdateStatusRequest {

    @NotNull
    private IncidentStatus status;

    public IncidentStatus getStatus() {
        return status;
    }
}