package com.example.fleet_backend.dto;

import com.example.fleet_backend.model.Driver;
import java.time.LocalDateTime;

public class DriverDTO {
    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private String licenseNumber;
    private LocalDateTime licenseExpiry;
    private Double ecoScore;
    private Driver.DriverStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public DriverDTO() {}

    public DriverDTO(Driver driver) {
        this.id = driver.getId();
        this.firstName = driver.getFirstName();
        this.lastName = driver.getLastName();
        this.email = driver.getEmail();
        this.phone = driver.getPhone();
        this.licenseNumber = driver.getLicenseNumber();
        this.licenseExpiry = driver.getLicenseExpiry();
        this.ecoScore = driver.getEcoScore();
        this.status = driver.getStatus();
        this.createdAt = driver.getCreatedAt();
        this.updatedAt = driver.getUpdatedAt();
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getLicenseNumber() {
        return licenseNumber;
    }

    public void setLicenseNumber(String licenseNumber) {
        this.licenseNumber = licenseNumber;
    }

    public LocalDateTime getLicenseExpiry() {
        return licenseExpiry;
    }

    public void setLicenseExpiry(LocalDateTime licenseExpiry) {
        this.licenseExpiry = licenseExpiry;
    }

    public Double getEcoScore() {
        return ecoScore;
    }

    public void setEcoScore(Double ecoScore) {
        this.ecoScore = ecoScore;
    }

    public Driver.DriverStatus getStatus() {
        return status;
    }

    public void setStatus(Driver.DriverStatus status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}