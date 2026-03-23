package com.example.fleet_backend.dto;

import com.example.fleet_backend.model.Mission;
import java.time.LocalDateTime;

public class MissionDTO {
    private Long id;
    private String title;
    private String description;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private Mission.MissionStatus status;

    private Long vehicleId;
    private String vehicleRegistrationNumber;

    private Long driverId;
    private String driverName;
    private String driverEmail;



    public MissionDTO(Mission m) {
        this.id = m.getId();
        this.title = m.getTitle();
        this.description = m.getDescription();
        this.startDate = m.getStartDate();
        this.endDate = m.getEndDate();
        this.status = m.getStatus();

        if (m.getVehicle() != null) {
            this.vehicleId = m.getVehicle().getId();
            this.vehicleRegistrationNumber = m.getVehicle().getRegistrationNumber();
        }

        if (m.getDriver() != null) {
            this.driverId = m.getDriver().getId();
            this.driverName = (m.getDriver().getFirstName() + " " + m.getDriver().getLastName()).trim();
            this.driverEmail = m.getDriver().getEmail();
        }
    }

    // =========================
    // GETTERS & SETTERS
    // =========================
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public LocalDateTime getStartDate() { return startDate; }
    public void setStartDate(LocalDateTime startDate) { this.startDate = startDate; }

    public LocalDateTime getEndDate() { return endDate; }
    public void setEndDate(LocalDateTime endDate) { this.endDate = endDate; }

    public Mission.MissionStatus getStatus() { return status; }
    public void setStatus(Mission.MissionStatus status) { this.status = status; }

    public Long getVehicleId() { return vehicleId; }
    public void setVehicleId(Long vehicleId) { this.vehicleId = vehicleId; }

    public Long getDriverId() { return driverId; }
    public void setDriverId(Long driverId) { this.driverId = driverId; }

    public String getVehicleRegistrationNumber() { return vehicleRegistrationNumber; }
    public void setVehicleRegistrationNumber(String v) { this.vehicleRegistrationNumber = v; }

    public String getDriverName() { return driverName; }
    public void setDriverName(String driverName) { this.driverName = driverName; }

    public String getDriverEmail() { return driverEmail; }
    public void setDriverEmail(String driverEmail) { this.driverEmail = driverEmail; }
}