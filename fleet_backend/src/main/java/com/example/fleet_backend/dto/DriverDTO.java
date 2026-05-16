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
    private LocalDateTime availableAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public DriverDTO() {
    }

    public DriverDTO(Driver driver) {
        if (driver == null) {
            return;
        }

        this.id = driver.getId();
        this.firstName = driver.getFirstName();
        this.lastName = driver.getLastName();
        this.email = driver.getEmail();
        this.phone = driver.getPhone();
        this.licenseNumber = driver.getLicenseNumber();
        this.licenseExpiry = driver.getLicenseExpiry();
        this.ecoScore = driver.getEcoScore();
        this.status = driver.getStatus();
        this.availableAt = driver.getAvailableAt();
        this.createdAt = driver.getCreatedAt();
        this.updatedAt = driver.getUpdatedAt();
    }

    public Long getId() {
        return id;
    }

    public String getFirstName() {
        return firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public String getEmail() {
        return email;
    }

    public String getPhone() {
        return phone;
    }

    public String getLicenseNumber() {
        return licenseNumber;
    }

    public LocalDateTime getLicenseExpiry() {
        return licenseExpiry;
    }

    public Double getEcoScore() {
        return ecoScore;
    }

    public Driver.DriverStatus getStatus() {
        return status;
    }

    public LocalDateTime getAvailableAt() {
        return availableAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public void setLicenseNumber(String licenseNumber) {
        this.licenseNumber = licenseNumber;
    }

    public void setLicenseExpiry(LocalDateTime licenseExpiry) {
        this.licenseExpiry = licenseExpiry;
    }

    public void setEcoScore(Double ecoScore) {
        this.ecoScore = ecoScore;
    }

    public void setStatus(Driver.DriverStatus status) {
        this.status = status;
    }

    public void setAvailableAt(LocalDateTime availableAt) {
        this.availableAt = availableAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}