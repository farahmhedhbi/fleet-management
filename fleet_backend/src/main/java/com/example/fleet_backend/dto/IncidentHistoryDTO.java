package com.example.fleet_backend.dto;

import com.example.fleet_backend.model.IncidentStatus;

import java.time.LocalDateTime;

public class IncidentHistoryDTO {

    private Long id;
    private Long incidentId;
    private String action;
    private IncidentStatus oldStatus;
    private IncidentStatus newStatus;
    private Long userId;
    private String userEmail;
    private String comment;
    private LocalDateTime createdAt;

    public IncidentHistoryDTO(
            Long id,
            Long incidentId,
            String action,
            IncidentStatus oldStatus,
            IncidentStatus newStatus,
            Long userId,
            String userEmail,
            String comment,
            LocalDateTime createdAt
    ) {
        this.id = id;
        this.incidentId = incidentId;
        this.action = action;
        this.oldStatus = oldStatus;
        this.newStatus = newStatus;
        this.userId = userId;
        this.userEmail = userEmail;
        this.comment = comment;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public Long getIncidentId() { return incidentId; }
    public String getAction() { return action; }
    public IncidentStatus getOldStatus() { return oldStatus; }
    public IncidentStatus getNewStatus() { return newStatus; }
    public Long getUserId() { return userId; }
    public String getUserEmail() { return userEmail; }
    public String getComment() { return comment; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}