package com.example.fleet_backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "missions")
public class Mission {

    public enum MissionStatus {
        PLANNED,
        IN_PROGRESS,
        COMPLETED,
        CANCELED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(length = 1000)
    private String description;

    @Column(nullable = false, length = 255)
    private String departure;

    @Column(nullable = false, length = 255)
    private String destination;

    @Column(nullable = false)
    private LocalDateTime startDate;

    @Column(nullable = false)
    private LocalDateTime endDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private MissionStatus status = MissionStatus.PLANNED;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id")
    private User owner;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "driver_id")
    private Driver driver;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id")
    private Vehicle vehicle;

    @Column(columnDefinition = "TEXT")
    private String routeJson;

    @Column(columnDefinition = "TEXT")
    private String originalRouteJson;

    @Enumerated(EnumType.STRING)
    @Column(length = 40)
    private RouteCheckStatus routeCheckStatus = RouteCheckStatus.NOT_CHECKED;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private RouteRiskLevel routeRiskLevel;

    @Column(nullable = false)
    private Boolean routeRecalculated = false;

    private Integer originalDurationMinutes;
    private Integer selectedDurationMinutes;
    private Integer estimatedDelayMinutes;

    private Double originalDistanceKm;
    private Double selectedDistanceKm;

    private LocalDateTime routeCheckedAt;

    @Column(length = 1000)
    private String routeCheckMessage;

    @Column(nullable = false)
    private Boolean lateAlertSent = false;

    private LocalDateTime startedAt;
    private LocalDateTime finishedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    public void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;

        if (status == null) status = MissionStatus.PLANNED;
        if (lateAlertSent == null) lateAlertSent = false;
        if (routeCheckStatus == null) routeCheckStatus = RouteCheckStatus.NOT_CHECKED;
        if (routeRecalculated == null) routeRecalculated = false;
    }

    @PreUpdate
    public void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Mission() {}

    public Long getId() { return id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getDeparture() { return departure; }
    public void setDeparture(String departure) { this.departure = departure; }

    public String getDestination() { return destination; }
    public void setDestination(String destination) { this.destination = destination; }

    public LocalDateTime getStartDate() { return startDate; }
    public void setStartDate(LocalDateTime startDate) { this.startDate = startDate; }

    public LocalDateTime getEndDate() { return endDate; }
    public void setEndDate(LocalDateTime endDate) { this.endDate = endDate; }

    public MissionStatus getStatus() { return status; }
    public void setStatus(MissionStatus status) { this.status = status; }

    public User getOwner() { return owner; }
    public void setOwner(User owner) { this.owner = owner; }

    public Driver getDriver() { return driver; }
    public void setDriver(Driver driver) { this.driver = driver; }

    public Vehicle getVehicle() { return vehicle; }
    public void setVehicle(Vehicle vehicle) { this.vehicle = vehicle; }

    public String getRouteJson() { return routeJson; }
    public void setRouteJson(String routeJson) { this.routeJson = routeJson; }

    public String getOriginalRouteJson() { return originalRouteJson; }
    public void setOriginalRouteJson(String originalRouteJson) { this.originalRouteJson = originalRouteJson; }

    public RouteCheckStatus getRouteCheckStatus() { return routeCheckStatus; }
    public void setRouteCheckStatus(RouteCheckStatus routeCheckStatus) { this.routeCheckStatus = routeCheckStatus; }

    public RouteRiskLevel getRouteRiskLevel() { return routeRiskLevel; }
    public void setRouteRiskLevel(RouteRiskLevel routeRiskLevel) { this.routeRiskLevel = routeRiskLevel; }

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

    public LocalDateTime getRouteCheckedAt() { return routeCheckedAt; }
    public void setRouteCheckedAt(LocalDateTime routeCheckedAt) { this.routeCheckedAt = routeCheckedAt; }

    public String getRouteCheckMessage() { return routeCheckMessage; }
    public void setRouteCheckMessage(String routeCheckMessage) { this.routeCheckMessage = routeCheckMessage; }

    public Boolean getLateAlertSent() { return lateAlertSent; }
    public boolean isLateAlertSent() { return lateAlertSent != null && lateAlertSent; }
    public void setLateAlertSent(Boolean lateAlertSent) { this.lateAlertSent = lateAlertSent; }

    public LocalDateTime getStartedAt() { return startedAt; }
    public void setStartedAt(LocalDateTime startedAt) { this.startedAt = startedAt; }

    public LocalDateTime getFinishedAt() { return finishedAt; }
    public void setFinishedAt(LocalDateTime finishedAt) { this.finishedAt = finishedAt; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}