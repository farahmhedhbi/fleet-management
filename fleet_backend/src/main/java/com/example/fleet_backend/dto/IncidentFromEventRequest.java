package com.example.fleet_backend.dto;

import com.example.fleet_backend.model.IncidentSeverity;
import com.example.fleet_backend.model.IncidentType;
import jakarta.validation.constraints.NotNull;

public class IncidentFromEventRequest {

    @NotNull
    private Long vehicleEventId;

    @NotNull
    private IncidentType type;

    @NotNull
    private IncidentSeverity severity;

    private String title;
    private String description;
    private Boolean emergency;

    public Long getVehicleEventId() {
        return vehicleEventId;
    }

    public IncidentType getType() {
        return type;
    }

    public IncidentSeverity getSeverity() {
        return severity;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public Boolean getEmergency() {
        return emergency;
    }
}