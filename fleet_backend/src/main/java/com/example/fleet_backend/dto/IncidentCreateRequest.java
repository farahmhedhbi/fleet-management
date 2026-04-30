package com.example.fleet_backend.dto;

import com.example.fleet_backend.model.IncidentSeverity;
import com.example.fleet_backend.model.IncidentType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class IncidentCreateRequest {

    @NotBlank
    private String title;

    private String description;

    @NotNull
    private IncidentType type;

    @NotNull
    private IncidentSeverity severity;

    private Long vehicleId;
    private Long missionId;

    private Double latitude;
    private Double longitude;
    private Boolean emergency;

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public IncidentType getType() {
        return type;
    }

    public IncidentSeverity getSeverity() {
        return severity;
    }

    public Long getVehicleId() {
        return vehicleId;
    }

    public Long getMissionId() {
        return missionId;
    }

    public Double getLatitude() {
        return latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public Boolean getEmergency() {
        return emergency;
    }
}