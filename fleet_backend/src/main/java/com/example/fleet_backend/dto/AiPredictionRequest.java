package com.example.fleet_backend.dto;

public class AiPredictionRequest {

    private int highTempCount;
    private int lowBatteryCount;
    private int lowFuelCount;
    private int engineFailureCount;
    private int incidentCount;

    private int overspeedCount;
    private int offRouteCount;
    private int stopLongCount;

    private int maintenanceRisk;

    public int getHighTempCount() {
        return highTempCount;
    }

    public void setHighTempCount(int highTempCount) {
        this.highTempCount = highTempCount;
    }

    public int getLowBatteryCount() {
        return lowBatteryCount;
    }

    public void setLowBatteryCount(int lowBatteryCount) {
        this.lowBatteryCount = lowBatteryCount;
    }

    public int getLowFuelCount() {
        return lowFuelCount;
    }

    public void setLowFuelCount(int lowFuelCount) {
        this.lowFuelCount = lowFuelCount;
    }

    public int getEngineFailureCount() {
        return engineFailureCount;
    }

    public void setEngineFailureCount(int engineFailureCount) {
        this.engineFailureCount = engineFailureCount;
    }

    public int getIncidentCount() {
        return incidentCount;
    }

    public void setIncidentCount(int incidentCount) {
        this.incidentCount = incidentCount;
    }

    public int getOverspeedCount() {
        return overspeedCount;
    }

    public void setOverspeedCount(int overspeedCount) {
        this.overspeedCount = overspeedCount;
    }

    public int getOffRouteCount() {
        return offRouteCount;
    }

    public void setOffRouteCount(int offRouteCount) {
        this.offRouteCount = offRouteCount;
    }

    public int getStopLongCount() {
        return stopLongCount;
    }

    public void setStopLongCount(int stopLongCount) {
        this.stopLongCount = stopLongCount;
    }

    public int getMaintenanceRisk() {
        return maintenanceRisk;
    }

    public void setMaintenanceRisk(int maintenanceRisk) {
        this.maintenanceRisk = maintenanceRisk;
    }
}