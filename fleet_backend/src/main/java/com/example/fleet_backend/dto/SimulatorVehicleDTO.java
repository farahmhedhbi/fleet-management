package com.example.fleet_backend.dto;

import java.util.ArrayList;
import java.util.List;

public class SimulatorVehicleDTO {

    private Long id;
    private String registrationNumber;
    private String brand;
    private String model;

    private boolean missionActive;
    private Long missionId;

    private String routeId;
    private String routeSource;

    private List<MissionRoutePointDTO> missionRoute = new ArrayList<>();

    public SimulatorVehicleDTO() {
    }

    public SimulatorVehicleDTO(Long id,
                               String registrationNumber,
                               String brand,
                               String model,
                               boolean missionActive,
                               Long missionId,
                               String routeId,
                               String routeSource,
                               List<MissionRoutePointDTO> missionRoute) {
        this.id = id;
        this.registrationNumber = registrationNumber;
        this.brand = brand;
        this.model = model;
        this.missionActive = missionActive;
        this.missionId = missionId;
        this.routeId = routeId;
        this.routeSource = routeSource;
        this.missionRoute = missionRoute != null ? missionRoute : new ArrayList<>();
    }

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

    public boolean isMissionActive() {
        return missionActive;
    }

    public void setMissionActive(boolean missionActive) {
        this.missionActive = missionActive;
    }

    public Long getMissionId() {
        return missionId;
    }

    public void setMissionId(Long missionId) {
        this.missionId = missionId;
    }

    public String getRouteId() {
        return routeId;
    }

    public void setRouteId(String routeId) {
        this.routeId = routeId;
    }

    public String getRouteSource() {
        return routeSource;
    }

    public void setRouteSource(String routeSource) {
        this.routeSource = routeSource;
    }

    public List<MissionRoutePointDTO> getMissionRoute() {
        return missionRoute;
    }

    public void setMissionRoute(List<MissionRoutePointDTO> missionRoute) {
        this.missionRoute = missionRoute != null ? missionRoute : new ArrayList<>();
    }
}