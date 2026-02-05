package com.example.fleet_backend.dto;

import com.example.fleet_backend.model.Vehicle;
import java.time.LocalDateTime;

public class VehicleDTO {
    private Long id;
    private String registrationNumber;
    private String brand;
    private String model;
    private Integer year;
    private String color;
    private String vin;
    private Vehicle.FuelType fuelType;
    private Vehicle.TransmissionType transmission;
    private Vehicle.VehicleStatus status;
    private Double mileage;
    private LocalDateTime lastMaintenanceDate;
    private LocalDateTime nextMaintenanceDate;
    private Long driverId;
    private String driverName;
    private String driverEmail;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public VehicleDTO() {}

    public VehicleDTO(Vehicle vehicle) {
        this.id = vehicle.getId();
        this.registrationNumber = vehicle.getRegistrationNumber();
        this.brand = vehicle.getBrand();
        this.model = vehicle.getModel();
        this.year = vehicle.getYear();
        this.color = vehicle.getColor();
        this.vin = vehicle.getVin();
        this.fuelType = vehicle.getFuelType();
        this.transmission = vehicle.getTransmission();
        this.status = vehicle.getStatus();
        this.mileage = vehicle.getMileage();
        this.lastMaintenanceDate = vehicle.getLastMaintenanceDate();
        this.nextMaintenanceDate = vehicle.getNextMaintenanceDate();
        if (vehicle.getDriver() != null) {
            this.driverId = vehicle.getDriver().getId();
            this.driverName = vehicle.getDriver().getFirstName() + " " + vehicle.getDriver().getLastName();
            this.driverEmail = vehicle.getDriver().getEmail();
        }
        this.createdAt = vehicle.getCreatedAt();
        this.updatedAt = vehicle.getUpdatedAt();
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getRegistrationNumber() {
        return registrationNumber;
    }

    public void setRegistrationNumber(String registrationNumber) {
        this.registrationNumber = registrationNumber;
    }

    public String getBrand() {
        return brand;
    }

    public void setBrand(String brand) {
        this.brand = brand;
    }

    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
    }

    public Integer getYear() {
        return year;
    }

    public void setYear(Integer year) {
        this.year = year;
    }

    public String getColor() {
        return color;
    }

    public void setColor(String color) {
        this.color = color;
    }

    public String getVin() {
        return vin;
    }

    public void setVin(String vin) {
        this.vin = vin;
    }

    public Vehicle.FuelType getFuelType() {
        return fuelType;
    }

    public void setFuelType(Vehicle.FuelType fuelType) {
        this.fuelType = fuelType;
    }

    public Vehicle.TransmissionType getTransmission() {
        return transmission;
    }

    public void setTransmission(Vehicle.TransmissionType transmission) {
        this.transmission = transmission;
    }

    public Vehicle.VehicleStatus getStatus() {
        return status;
    }

    public void setStatus(Vehicle.VehicleStatus status) {
        this.status = status;
    }

    public Double getMileage() {
        return mileage;
    }

    public void setMileage(Double mileage) {
        this.mileage = mileage;
    }

    public LocalDateTime getLastMaintenanceDate() {
        return lastMaintenanceDate;
    }

    public void setLastMaintenanceDate(LocalDateTime lastMaintenanceDate) {
        this.lastMaintenanceDate = lastMaintenanceDate;
    }

    public LocalDateTime getNextMaintenanceDate() {
        return nextMaintenanceDate;
    }

    public void setNextMaintenanceDate(LocalDateTime nextMaintenanceDate) {
        this.nextMaintenanceDate = nextMaintenanceDate;
    }

    public Long getDriverId() {
        return driverId;
    }

    public void setDriverId(Long driverId) {
        this.driverId = driverId;
    }

    public String getDriverName() {
        return driverName;
    }

    public void setDriverName(String driverName) {
        this.driverName = driverName;
    }

    public String getDriverEmail() {
        return driverEmail;
    }

    public void setDriverEmail(String driverEmail) {
        this.driverEmail = driverEmail;
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