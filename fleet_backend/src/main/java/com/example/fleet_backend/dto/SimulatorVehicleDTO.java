package com.example.fleet_backend.dto;

import java.util.List;

public class SimulatorVehicleDTO {
    private Long id;
    private String registrationNumber;
    private String brand;
    private String model;
    private boolean missionActive;
    private Long missionId;
    private String routeSource;
    private String routeId;
    private List<MissionRoutePointDTO> missionRoute;

    public SimulatorVehicleDTO() {}

    public SimulatorVehicleDTO(Long id, String registrationNumber, String brand, String model,
                               boolean missionActive, Long missionId, String routeSource,
                               String routeId, List<MissionRoutePointDTO> missionRoute) {
        this.id = id;
        this.registrationNumber = registrationNumber;
        this.brand = brand;
        this.model = model;
        this.missionActive = missionActive;
        this.missionId = missionId;
        this.routeSource = routeSource;
        this.routeId = routeId;
        this.missionRoute = missionRoute;
    }

    public Long getId() { return id; }
    public String getRegistrationNumber() { return registrationNumber; }
    public String getBrand() { return brand; }
    public String getModel() { return model; }
    public boolean isMissionActive() { return missionActive; }
    public Long getMissionId() { return missionId; }
    public String getRouteSource() { return routeSource; }
    public String getRouteId() { return routeId; }
    public List<MissionRoutePointDTO> getMissionRoute() { return missionRoute; }
}