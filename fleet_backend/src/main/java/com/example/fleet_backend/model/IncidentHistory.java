package com.example.fleet_backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "incident_history")
public class IncidentHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "incident_id", nullable = false)
    private Incident incident;

    @Column(nullable = false)
    private String action;

    @Enumerated(EnumType.STRING)
    private IncidentStatus oldStatus;

    @Enumerated(EnumType.STRING)
    private IncidentStatus newStatus;

    private Long userId;
    private String userEmail;

    @Column(length = 1000)
    private String comment;

    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }

    public Incident getIncident() { return incident; }
    public void setIncident(Incident incident) { this.incident = incident; }

    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }

    public IncidentStatus getOldStatus() { return oldStatus; }
    public void setOldStatus(IncidentStatus oldStatus) { this.oldStatus = oldStatus; }

    public IncidentStatus getNewStatus() { return newStatus; }
    public void setNewStatus(IncidentStatus newStatus) { this.newStatus = newStatus; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }

    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }

    public LocalDateTime getCreatedAt() { return createdAt; }
}