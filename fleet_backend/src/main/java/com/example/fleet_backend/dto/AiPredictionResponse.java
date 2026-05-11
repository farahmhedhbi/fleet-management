package com.example.fleet_backend.dto;

public class AiPredictionResponse {

    private int vehicleRiskScore;
    private String vehicleRiskLevel;
    private String vehiclePrediction;

    private int driverRiskScore;
    private String driverRiskLevel;
    private String driverBehavior;

    private String recommendation;

    public int getVehicleRiskScore() {
        return vehicleRiskScore;
    }

    public void setVehicleRiskScore(int vehicleRiskScore) {
        this.vehicleRiskScore = vehicleRiskScore;
    }

    public String getVehicleRiskLevel() {
        return vehicleRiskLevel;
    }

    public void setVehicleRiskLevel(String vehicleRiskLevel) {
        this.vehicleRiskLevel = vehicleRiskLevel;
    }

    public String getVehiclePrediction() {
        return vehiclePrediction;
    }

    public void setVehiclePrediction(String vehiclePrediction) {
        this.vehiclePrediction = vehiclePrediction;
    }

    public int getDriverRiskScore() {
        return driverRiskScore;
    }

    public void setDriverRiskScore(int driverRiskScore) {
        this.driverRiskScore = driverRiskScore;
    }

    public String getDriverRiskLevel() {
        return driverRiskLevel;
    }

    public void setDriverRiskLevel(String driverRiskLevel) {
        this.driverRiskLevel = driverRiskLevel;
    }

    public String getDriverBehavior() {
        return driverBehavior;
    }

    public void setDriverBehavior(String driverBehavior) {
        this.driverBehavior = driverBehavior;
    }

    public String getRecommendation() {
        return recommendation;
    }

    public void setRecommendation(String recommendation) {
        this.recommendation = recommendation;
    }
}