package com.example.fleet_backend.dto;

import com.example.fleet_backend.model.PredictiveAlert;
import com.example.fleet_backend.model.PredictiveAlertType;
import com.example.fleet_backend.model.PredictiveRiskLevel;

import java.time.LocalDateTime;

public class PredictiveAlertDTO {

    private Long id;
    private Long vehicleId;
    private PredictiveAlertType type;
    private PredictiveRiskLevel riskLevel;
    private Integer riskScore;
    private String title;
    private String message;
    private String recommendation;
    private boolean resolved;
    private LocalDateTime createdAt;
    private LocalDateTime resolvedAt;

    public static PredictiveAlertDTO fromEntity(PredictiveAlert alert) {
        PredictiveAlertDTO dto = new PredictiveAlertDTO();

        dto.id = alert.getId();
        dto.vehicleId = alert.getVehicle() != null ? alert.getVehicle().getId() : null;
        dto.type = alert.getType();
        dto.riskLevel = alert.getRiskLevel();
        dto.riskScore = alert.getRiskScore();
        dto.title = alert.getTitle();
        dto.message = alert.getMessage();
        dto.recommendation = alert.getRecommendation();
        dto.resolved = alert.isResolved();
        dto.createdAt = alert.getCreatedAt();
        dto.resolvedAt = alert.getResolvedAt();

        return dto;
    }

    public Long getId() {
        return id;
    }

    public Long getVehicleId() {
        return vehicleId;
    }

    public PredictiveAlertType getType() {
        return type;
    }

    public PredictiveRiskLevel getRiskLevel() {
        return riskLevel;
    }

    public Integer getRiskScore() {
        return riskScore;
    }

    public String getTitle() {
        return title;
    }

    public String getMessage() {
        return message;
    }

    public String getRecommendation() {
        return recommendation;
    }

    public boolean isResolved() {
        return resolved;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getResolvedAt() {
        return resolvedAt;
    }
}