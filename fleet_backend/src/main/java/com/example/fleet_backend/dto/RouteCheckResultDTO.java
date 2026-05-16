package com.example.fleet_backend.dto;

import com.example.fleet_backend.model.RouteCheckStatus;
import com.example.fleet_backend.model.RouteRiskLevel;

public class RouteCheckResultDTO {
    private Long missionId;
    private Long vehicleId;
    private RouteCheckStatus status;
    private RouteRiskLevel riskLevel;
    private Boolean routeRecalculated;
    private Integer originalDurationMinutes;
    private Integer selectedDurationMinutes;
    private Integer estimatedDelayMinutes;
    private Double originalDistanceKm;
    private Double selectedDistanceKm;
    private String message;
    private String originalRouteJson;
    private String selectedRouteJson;

    public RouteCheckResultDTO() {}

    public Long getMissionId() { return missionId; }
    public void setMissionId(Long missionId) { this.missionId = missionId; }

    public Long getVehicleId() { return vehicleId; }
    public void setVehicleId(Long vehicleId) { this.vehicleId = vehicleId; }

    public RouteCheckStatus getStatus() { return status; }
    public void setStatus(RouteCheckStatus status) { this.status = status; }

    public RouteRiskLevel getRiskLevel() { return riskLevel; }
    public void setRiskLevel(RouteRiskLevel riskLevel) { this.riskLevel = riskLevel; }

    public Boolean getRouteRecalculated() { return routeRecalculated; }
    public void setRouteRecalculated(Boolean routeRecalculated) { this.routeRecalculated = routeRecalculated; }

    public Integer getOriginalDurationMinutes() { return originalDurationMinutes; }
    public void setOriginalDurationMinutes(Integer originalDurationMinutes) { this.originalDurationMinutes = originalDurationMinutes; }

    public Integer getSelectedDurationMinutes() { return selectedDurationMinutes; }
    public void setSelectedDurationMinutes(Integer selectedDurationMinutes) { this.selectedDurationMinutes = selectedDurationMinutes; }

    public Integer getEstimatedDelayMinutes() { return estimatedDelayMinutes; }
    public void setEstimatedDelayMinutes(Integer estimatedDelayMinutes) { this.estimatedDelayMinutes = estimatedDelayMinutes; }

    public Double getOriginalDistanceKm() { return originalDistanceKm; }
    public void setOriginalDistanceKm(Double originalDistanceKm) { this.originalDistanceKm = originalDistanceKm; }

    public Double getSelectedDistanceKm() { return selectedDistanceKm; }
    public void setSelectedDistanceKm(Double selectedDistanceKm) { this.selectedDistanceKm = selectedDistanceKm; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getOriginalRouteJson() { return originalRouteJson; }
    public void setOriginalRouteJson(String originalRouteJson) { this.originalRouteJson = originalRouteJson; }

    public String getSelectedRouteJson() { return selectedRouteJson; }
    public void setSelectedRouteJson(String selectedRouteJson) { this.selectedRouteJson = selectedRouteJson; }
}