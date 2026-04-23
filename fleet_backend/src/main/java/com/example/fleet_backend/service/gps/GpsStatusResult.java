package com.example.fleet_backend.service.gps;

import com.example.fleet_backend.model.LiveStatus;

public class GpsStatusResult {

    private final LiveStatus liveStatus;
    private final boolean offRoute;
    private final boolean missionCompleted;

    public GpsStatusResult(LiveStatus liveStatus, boolean offRoute, boolean missionCompleted) {
        this.liveStatus = liveStatus;
        this.offRoute = offRoute;
        this.missionCompleted = missionCompleted;
    }

    public LiveStatus getLiveStatus() {
        return liveStatus;
    }

    public boolean isOffRoute() {
        return offRoute;
    }

    public boolean isMissionCompleted() {
        return missionCompleted;
    }
}