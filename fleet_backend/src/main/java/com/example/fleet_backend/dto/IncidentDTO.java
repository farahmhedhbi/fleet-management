package com.example.fleet_backend.dto;

import com.example.fleet_backend.model.*;

import java.time.LocalDateTime;

public class IncidentDTO {

    private Long id;
    private String title;
    private String description;

    private IncidentType type;
    private IncidentSeverity severity;
    private IncidentStatus status;
    private IncidentSource source;

    private Long vehicleId;
    private String vehicleRegistrationNumber;

    private Long missionId;
    private String missionTitle;

    private Long vehicleEventId;

    private Long reportedByUserId;
    private String reportedByEmail;

    private Long handledByUserId;
    private String handledByEmail;

    private LocalDateTime reportedAt;
    private LocalDateTime validatedAt;
    private LocalDateTime resolvedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private String groupKey;
    private Integer eventCount;
    private LocalDateTime lastEventAt;

    public IncidentDTO(
            Long id,
            String title,
            String description,
            IncidentType type,
            IncidentSeverity severity,
            IncidentStatus status,
            IncidentSource source,
            Long vehicleId,
            String vehicleRegistrationNumber,
            Long missionId,
            String missionTitle,
            Long vehicleEventId,
            Long reportedByUserId,
            String reportedByEmail,
            Long handledByUserId,
            String handledByEmail,
            LocalDateTime reportedAt,
            LocalDateTime validatedAt,
            LocalDateTime resolvedAt,
            LocalDateTime createdAt,
            LocalDateTime updatedAt,
            String groupKey,
            Integer eventCount,
            LocalDateTime lastEventAt
    ) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.type = type;
        this.severity = severity;
        this.status = status;
        this.source = source;
        this.vehicleId = vehicleId;
        this.vehicleRegistrationNumber = vehicleRegistrationNumber;
        this.missionId = missionId;
        this.missionTitle = missionTitle;
        this.vehicleEventId = vehicleEventId;
        this.reportedByUserId = reportedByUserId;
        this.reportedByEmail = reportedByEmail;
        this.handledByUserId = handledByUserId;
        this.handledByEmail = handledByEmail;
        this.reportedAt = reportedAt;
        this.validatedAt = validatedAt;
        this.resolvedAt = resolvedAt;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.groupKey = groupKey;
        this.eventCount = eventCount;
        this.lastEventAt = lastEventAt;
    }

    public Long getId() { return id; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public IncidentType getType() { return type; }
    public IncidentSeverity getSeverity() { return severity; }
    public IncidentStatus getStatus() { return status; }
    public IncidentSource getSource() { return source; }
    public Long getVehicleId() { return vehicleId; }
    public String getVehicleRegistrationNumber() { return vehicleRegistrationNumber; }
    public Long getMissionId() { return missionId; }
    public String getMissionTitle() { return missionTitle; }
    public Long getVehicleEventId() { return vehicleEventId; }
    public Long getReportedByUserId() { return reportedByUserId; }
    public String getReportedByEmail() { return reportedByEmail; }
    public Long getHandledByUserId() { return handledByUserId; }
    public String getHandledByEmail() { return handledByEmail; }
    public LocalDateTime getReportedAt() { return reportedAt; }
    public LocalDateTime getValidatedAt() { return validatedAt; }
    public LocalDateTime getResolvedAt() { return resolvedAt; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public String getGroupKey() {
        return groupKey;
    }

    public Integer getEventCount() {
        return eventCount;
    }

    public LocalDateTime getLastEventAt() {
        return lastEventAt;
    }
}