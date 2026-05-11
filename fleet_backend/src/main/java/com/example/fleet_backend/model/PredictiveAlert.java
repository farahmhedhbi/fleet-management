package com.example.fleet_backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "predictive_alerts")
public class PredictiveAlert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PredictiveAlertType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PredictiveRiskLevel riskLevel;

    @Column(nullable = false)
    private Integer riskScore;

    @Column(nullable = false)
    private String title;

    @Column(length = 2000)
    private String message;

    @Column(length = 2000)
    private String recommendation;

    @Column(nullable = false)
    private boolean resolved = false;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    private LocalDateTime resolvedAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public Vehicle getVehicle() {
        return vehicle;
    }

    public void setVehicle(Vehicle vehicle) {
        this.vehicle = vehicle;
    }

    public PredictiveAlertType getType() {
        return type;
    }

    public void setType(PredictiveAlertType type) {
        this.type = type;
    }

    public PredictiveRiskLevel getRiskLevel() {
        return riskLevel;
    }

    public void setRiskLevel(PredictiveRiskLevel riskLevel) {
        this.riskLevel = riskLevel;
    }

    public Integer getRiskScore() {
        return riskScore;
    }

    public void setRiskScore(Integer riskScore) {
        this.riskScore = riskScore;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getRecommendation() {
        return recommendation;
    }

    public void setRecommendation(String recommendation) {
        this.recommendation = recommendation;
    }

    public boolean isResolved() {
        return resolved;
    }

    public void setResolved(boolean resolved) {
        this.resolved = resolved;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getResolvedAt() {
        return resolvedAt;
    }

    public void setResolvedAt(LocalDateTime resolvedAt) {
        this.resolvedAt = resolvedAt;
    }
}