package com.example.fleet_backend.dto;

import java.util.ArrayList;
import java.util.List;

public class DispatchSuggestionDTO {

    // ASSIGNMENT / DAILY_PLANNING
    private String mode;

    // Smart Daily Dispatching with Driver Rest Management
    private String moduleName;

    private Long vehicleId;
    private String vehiclePlate;

    private Long driverId;
    private String driverName;

    // Route globale
    private String startCity;
    private String finalCity;
    private String depotCity;

    // Return depot logic
    private boolean returnToDepotSuggested;
    private boolean vehicleStaysWithDriver;
    private boolean nextDayDecisionRequired;

    private String returnDepotReason;

    private Double distanceToDepotKm;

    // Smart score
    private Integer score;

    // Explications système
    private List<String> reasons = new ArrayList<>();
    private List<String> warnings = new ArrayList<>();

    // Timeline planning
    private List<DispatchStepDTO> steps = new ArrayList<>();

    public DispatchSuggestionDTO() {
    }

    public String getMode() {
        return mode;
    }

    public void setMode(String mode) {
        this.mode = mode;
    }

    public String getModuleName() {
        return moduleName;
    }

    public void setModuleName(String moduleName) {
        this.moduleName = moduleName;
    }

    public Long getVehicleId() {
        return vehicleId;
    }

    public void setVehicleId(Long vehicleId) {
        this.vehicleId = vehicleId;
    }

    public String getVehiclePlate() {
        return vehiclePlate;
    }

    public void setVehiclePlate(String vehiclePlate) {
        this.vehiclePlate = vehiclePlate;
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

    public String getStartCity() {
        return startCity;
    }

    public void setStartCity(String startCity) {
        this.startCity = startCity;
    }

    public String getFinalCity() {
        return finalCity;
    }

    public void setFinalCity(String finalCity) {
        this.finalCity = finalCity;
    }

    public String getDepotCity() {
        return depotCity;
    }

    public void setDepotCity(String depotCity) {
        this.depotCity = depotCity;
    }

    public boolean isReturnToDepotSuggested() {
        return returnToDepotSuggested;
    }

    public void setReturnToDepotSuggested(boolean returnToDepotSuggested) {
        this.returnToDepotSuggested = returnToDepotSuggested;
    }

    public boolean isVehicleStaysWithDriver() {
        return vehicleStaysWithDriver;
    }

    public void setVehicleStaysWithDriver(boolean vehicleStaysWithDriver) {
        this.vehicleStaysWithDriver = vehicleStaysWithDriver;
    }

    public boolean isNextDayDecisionRequired() {
        return nextDayDecisionRequired;
    }

    public void setNextDayDecisionRequired(boolean nextDayDecisionRequired) {
        this.nextDayDecisionRequired = nextDayDecisionRequired;
    }

    public String getReturnDepotReason() {
        return returnDepotReason;
    }

    public void setReturnDepotReason(String returnDepotReason) {
        this.returnDepotReason = returnDepotReason;
    }

    public Double getDistanceToDepotKm() {
        return distanceToDepotKm;
    }

    public void setDistanceToDepotKm(Double distanceToDepotKm) {
        this.distanceToDepotKm = distanceToDepotKm;
    }

    public Integer getScore() {
        return score;
    }

    public void setScore(Integer score) {
        this.score = score;
    }

    public List<String> getReasons() {
        return reasons;
    }

    public void setReasons(List<String> reasons) {
        this.reasons = reasons;
    }

    public List<String> getWarnings() {
        return warnings;
    }

    public void setWarnings(List<String> warnings) {
        this.warnings = warnings;
    }

    public List<DispatchStepDTO> getSteps() {
        return steps;
    }

    public void setSteps(List<DispatchStepDTO> steps) {
        this.steps = steps;
    }
}