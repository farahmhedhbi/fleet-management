package com.example.fleet_backend.dto;

import java.time.LocalDate;
import java.util.List;

public class SmartDailyPlanningRequest {

    private LocalDate date;
    private String depotCity;
    private Double depotLatitude;
    private Double depotLongitude;
    private List<DispatchMissionRequest> missions;

    public SmartDailyPlanningRequest() {
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public String getDepotCity() {
        return depotCity;
    }

    public void setDepotCity(String depotCity) {
        this.depotCity = depotCity;
    }

    public Double getDepotLatitude() {
        return depotLatitude;
    }

    public void setDepotLatitude(Double depotLatitude) {
        this.depotLatitude = depotLatitude;
    }

    public Double getDepotLongitude() {
        return depotLongitude;
    }

    public void setDepotLongitude(Double depotLongitude) {
        this.depotLongitude = depotLongitude;
    }

    public List<DispatchMissionRequest> getMissions() {
        return missions;
    }

    public void setMissions(List<DispatchMissionRequest> missions) {
        this.missions = missions;
    }
}