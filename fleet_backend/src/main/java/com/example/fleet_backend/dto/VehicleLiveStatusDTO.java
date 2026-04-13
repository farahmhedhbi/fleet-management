package com.example.fleet_backend.dto;

import java.time.LocalDateTime;
import java.util.List;

public class VehicleLiveStatusDTO {

    private Long vehicleId;
    private String vehicleName;

    private Double latitude;
    private Double longitude;
    private double speed;
    private boolean engineOn;
    private LocalDateTime timestamp;
    private String liveStatus;

    private boolean missionActive;
    private Long missionId;
    private String missionStatus;

    private Long driverId;
    private String currentDriverName;

    private String routeId;
    private String routeSource;

    private List<MissionRoutePointDTO> missionRoute;

    public VehicleLiveStatusDTO() {
    }

    public VehicleLiveStatusDTO(Long vehicleId,
                                String vehicleName,
                                Double latitude,
                                Double longitude,
                                double speed,
                                boolean engineOn,
                                LocalDateTime timestamp,
                                String liveStatus,
                                boolean missionActive,
                                Long missionId,
                                String missionStatus,
                                Long driverId,
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
        this.missionStatus = missionStatus;
        this.driverId = driverId;
        this.currentDriverName = currentDriverName;
        this.routeId = routeId;
        this.routeSource = routeSource;
        this.missionRoute = missionRoute;
    }

    public Long getVehicleId() {
        return vehicleId;
    }

    public void setVehicleId(Long vehicleId) {
        this.vehicleId = vehicleId;
    }

    public String getVehicleName() {
        return vehicleName;
    }

    public void setVehicleName(String vehicleName) {
        this.vehicleName = vehicleName;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public double getSpeed() {
        return speed;
    }

    public void setSpeed(double speed) {
        this.speed = speed;
    }

    public boolean isEngineOn() {
        return engineOn;
    }

    public void setEngineOn(boolean engineOn) {
        this.engineOn = engineOn;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public String getLiveStatus() {
        return liveStatus;
    }

    public void setLiveStatus(String liveStatus) {
        this.liveStatus = liveStatus;
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

    public String getMissionStatus() {
        return missionStatus;
    }

    public void setMissionStatus(String missionStatus) {
        this.missionStatus = missionStatus;
    }

    public Long getDriverId() {
        return driverId;
    }

    public void setDriverId(Long driverId) {
        this.driverId = driverId;
    }

    public String getCurrentDriverName() {
        return currentDriverName;
    }

    public void setCurrentDriverName(String currentDriverName) {
        this.currentDriverName = currentDriverName;
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
        this.missionRoute = missionRoute;
    }
}