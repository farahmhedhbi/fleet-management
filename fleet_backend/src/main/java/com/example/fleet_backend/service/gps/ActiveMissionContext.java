package com.example.fleet_backend.service.gps;

import com.example.fleet_backend.dto.MissionRoutePointDTO;
import com.example.fleet_backend.model.Mission;

import java.util.Collections;
import java.util.List;

public class ActiveMissionContext {

    private final Mission mission;
    private final boolean missionActive;
    private final Long missionId;
    private final String missionStatus;
    private final Long driverId;
    private final String driverName;
    private final List<MissionRoutePointDTO> missionRoute;

    public ActiveMissionContext(Mission mission,
                                boolean missionActive,
                                Long missionId,
                                String missionStatus,
                                Long driverId,
                                String driverName,
                                List<MissionRoutePointDTO> missionRoute) {
        this.mission = mission;
        this.missionActive = missionActive;
        this.missionId = missionId;
        this.missionStatus = missionStatus;
        this.driverId = driverId;
        this.driverName = driverName;
        this.missionRoute = missionRoute != null ? missionRoute : Collections.emptyList();
    }

    public static ActiveMissionContext empty() {
        return new ActiveMissionContext(
                null,
                false,
                null,
                null,
                null,
                null,
                Collections.emptyList()
        );
    }

    public Mission getMission() {
        return mission;
    }

    public boolean isMissionActive() {
        return missionActive;
    }

    public Long getMissionId() {
        return missionId;
    }

    public String getMissionStatus() {
        return missionStatus;
    }

    public Long getDriverId() {
        return driverId;
    }

    public String getDriverName() {
        return driverName;
    }

    public List<MissionRoutePointDTO> getMissionRoute() {
        return missionRoute;
    }
}