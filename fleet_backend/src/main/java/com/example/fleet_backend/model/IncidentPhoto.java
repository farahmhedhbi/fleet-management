package com.example.fleet_backend.model;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "incident_photos")
public class IncidentPhoto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 500)
    private String photoUrl;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "incident_id", nullable = false)
    private Incident incident;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    public Long getId() {
        return id;
    }

    public String getPhotoUrl() {
        return photoUrl;
    }

    public void setPhotoUrl(String photoUrl) {
        this.photoUrl = photoUrl;
    }

    public Incident getIncident() {
        return incident;
    }

    public void setIncident(Incident incident) {
        this.incident = incident;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}