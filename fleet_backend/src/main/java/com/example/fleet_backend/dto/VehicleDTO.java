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

    private Double currentLatitude;
    private Double currentLongitude;
    private String currentCity;

    private String homeDepotCity;
    private Double homeDepotLatitude;
    private Double homeDepotLongitude;

    private Long driverId;
    private String driverName;
    private String driverEmail;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private Double lastFuelLevel;
    public VehicleDTO() {}

    public VehicleDTO(Vehicle vehicle) {
        if (vehicle == null) {
            return;
        }

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

        this.currentLatitude = vehicle.getCurrentLatitude();
        this.currentLongitude = vehicle.getCurrentLongitude();
        this.currentCity = vehicle.getCurrentCity();

        this.homeDepotCity = vehicle.getHomeDepotCity();
        this.homeDepotLatitude = vehicle.getHomeDepotLatitude();
        this.homeDepotLongitude = vehicle.getHomeDepotLongitude();
        this.lastFuelLevel = vehicle.getLastFuelLevel();

        if (vehicle.getDriver() != null) {
            this.driverId = vehicle.getDriver().getId();

            String firstName = vehicle.getDriver().getFirstName() != null
                    ? vehicle.getDriver().getFirstName()
                    : "";

            String lastName = vehicle.getDriver().getLastName() != null
                    ? vehicle.getDriver().getLastName()
                    : "";

            String fullName = (firstName + " " + lastName).trim();

            this.driverName = !fullName.isBlank()
                    ? fullName
                    : vehicle.getDriver().getEmail();

            this.driverEmail = vehicle.getDriver().getEmail();
        }

        this.createdAt = vehicle.getCreatedAt();
        this.updatedAt = vehicle.getUpdatedAt();
    }

    public Long getId() { return id; }
    public String getRegistrationNumber() { return registrationNumber; }
    public String getBrand() { return brand; }
    public String getModel() { return model; }
    public Integer getYear() { return year; }
    public String getColor() { return color; }
    public String getVin() { return vin; }

    public Vehicle.FuelType getFuelType() { return fuelType; }
    public Vehicle.TransmissionType getTransmission() { return transmission; }
    public Vehicle.VehicleStatus getStatus() { return status; }

    public Double getMileage() { return mileage; }
    public LocalDateTime getLastMaintenanceDate() { return lastMaintenanceDate; }
    public LocalDateTime getNextMaintenanceDate() { return nextMaintenanceDate; }

    public Double getCurrentLatitude() { return currentLatitude; }
    public Double getCurrentLongitude() { return currentLongitude; }
    public String getCurrentCity() { return currentCity; }

    public String getHomeDepotCity() { return homeDepotCity; }
    public Double getHomeDepotLatitude() { return homeDepotLatitude; }
    public Double getHomeDepotLongitude() { return homeDepotLongitude; }

    public Long getDriverId() { return driverId; }
    public String getDriverName() { return driverName; }
    public String getDriverEmail() { return driverEmail; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    public void setId(Long id) { this.id = id; }
    public void setRegistrationNumber(String registrationNumber) { this.registrationNumber = registrationNumber; }
    public void setBrand(String brand) { this.brand = brand; }
    public void setModel(String model) { this.model = model; }
    public void setYear(Integer year) { this.year = year; }
    public void setColor(String color) { this.color = color; }
    public void setVin(String vin) { this.vin = vin; }

    public void setFuelType(Vehicle.FuelType fuelType) { this.fuelType = fuelType; }
    public void setTransmission(Vehicle.TransmissionType transmission) { this.transmission = transmission; }
    public void setStatus(Vehicle.VehicleStatus status) { this.status = status; }

    public void setMileage(Double mileage) { this.mileage = mileage; }
    public void setLastMaintenanceDate(LocalDateTime lastMaintenanceDate) { this.lastMaintenanceDate = lastMaintenanceDate; }
    public void setNextMaintenanceDate(LocalDateTime nextMaintenanceDate) { this.nextMaintenanceDate = nextMaintenanceDate; }

    public void setCurrentLatitude(Double currentLatitude) { this.currentLatitude = currentLatitude; }
    public void setCurrentLongitude(Double currentLongitude) { this.currentLongitude = currentLongitude; }
    public void setCurrentCity(String currentCity) { this.currentCity = currentCity; }

    public void setHomeDepotCity(String homeDepotCity) { this.homeDepotCity = homeDepotCity; }
    public void setHomeDepotLatitude(Double homeDepotLatitude) { this.homeDepotLatitude = homeDepotLatitude; }
    public void setHomeDepotLongitude(Double homeDepotLongitude) { this.homeDepotLongitude = homeDepotLongitude; }

    public void setDriverId(Long driverId) { this.driverId = driverId; }
    public void setDriverName(String driverName) { this.driverName = driverName; }
    public void setDriverEmail(String driverEmail) { this.driverEmail = driverEmail; }
    public Double getLastFuelLevel() {
        return lastFuelLevel;
    }

    public void setLastFuelLevel(Double lastFuelLevel) {
        this.lastFuelLevel = lastFuelLevel;
    }

    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}