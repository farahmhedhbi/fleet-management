package com.example.fleet_backend.dto;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

public class VehicleLiveStatusDTO {
    private Long vehicleId;
    private String vehicleName;
    private Double latitude;
    private Double longitude;
    private Double speed;
    private boolean engineOn;
    private LocalDateTime timestamp;
    private String liveStatus;
    private boolean missionActive;
    private Long missionId;
    private String currentDriverName;
    private String routeId;
    private String routeSource;
    private List<MissionRoutePointDTO> missionRoute;

    public VehicleLiveStatusDTO() {
        this.missionRoute = Collections.emptyList();
    }

    public VehicleLiveStatusDTO(Long vehicleId,
                                String vehicleName,
                                Double latitude,
                                Double longitude,
                                Double speed,
                                boolean engineOn,
                                LocalDateTime timestamp,
                                String liveStatus,
                                boolean missionActive,
                                Long missionId,
                                String currentDriverName,
                                String routeId,
                                String routeSource,
                                List<MissionRoutePointDTO> missionRoute) {
        this.vehicleId = vehicleId;
        this.vehicleName = vehicleName;
        this.latitude = latitude;
        this.longitude = longitude;
        this.speed = speed;
        this.engineOn = engineOn;
        this.timestamp = timestamp;
        this.liveStatus = liveStatus;
        this.missionActive = missionActive;
        this.missionId = missionId;
        this.currentDriverName = currentDriverName;
        this.routeId = routeId;
        this.routeSource = routeSource;
        this.missionRoute = missionRoute != null ? missionRoute : Collections.emptyList();
    }

    public Long getVehicleId() {
        return vehicleId;
    }

    public String getVehicleName() {
        return vehicleName;
    }

    public Double getLatitude() {
        return latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public Double getSpeed() {
        return speed;
    }

    public boolean isEngineOn() {
        return engineOn;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public String getLiveStatus() {
        return liveStatus;
    }

    public boolean isMissionActive() {
        return missionActive;
    }

    public Long getMissionId() {
        return missionId;
    }

    public String getCurrentDriverName() {
        return currentDriverName;
    }

    public String getRouteId() {
        return routeId;
    }

    public String getRouteSource() {
        return routeSource;
    }

    public List<MissionRoutePointDTO> getMissionRoute() {
        return missionRoute;
    }
}