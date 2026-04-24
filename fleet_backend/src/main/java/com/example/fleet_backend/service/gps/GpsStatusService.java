package com.example.fleet_backend.service.gps;

import com.example.fleet_backend.dto.MissionRoutePointDTO;
import com.example.fleet_backend.model.GpsData;
import com.example.fleet_backend.model.LiveStatus;
import com.example.fleet_backend.service.ObdAnalysisService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class GpsStatusService {

    private final double finishRadiusMeters;
    private final long offlineThresholdMinutes;
    private final RouteDeviationService routeDeviationService;
    private final ObdAnalysisService obdAnalysisService;

    public GpsStatusService(RouteDeviationService routeDeviationService,
                            ObdAnalysisService obdAnalysisService,
                            @Value("${gps.finish-radius-meters:30}") double finishRadiusMeters,
                            @Value("${gps.offline-threshold-minutes:5}") long offlineThresholdMinutes) {
        this.routeDeviationService = routeDeviationService;
        this.obdAnalysisService = obdAnalysisService;
        this.finishRadiusMeters = finishRadiusMeters;
        this.offlineThresholdMinutes = offlineThresholdMinutes;
    }

    public GpsStatusResult evaluate(GpsData gpsData,
                                    boolean missionActive,
                                    List<MissionRoutePointDTO> route) {
        boolean offRoute = missionActive
                && routeDeviationService.isOffRoute(gpsData.getLatitude(), gpsData.getLongitude(), route);

        boolean missionCompleted = missionActive
                && isNearLastPoint(gpsData.getLatitude(), gpsData.getLongitude(), route);

        LiveStatus liveStatus = computeLiveStatus(gpsData, missionActive, offRoute, missionCompleted);
        return new GpsStatusResult(liveStatus, offRoute, missionCompleted);
    }

    public String computeObdStatus(GpsData gpsData) {
        return obdAnalysisService.computeObdStatus(
                gpsData.getFuelLevel(),
                gpsData.getEngineTemperature(),
                gpsData.getBatteryVoltage(),
                gpsData.getCheckEngineOn()
        );
    }

    private LiveStatus computeLiveStatus(GpsData gpsData,
                                         boolean missionActive,
                                         boolean offRoute,
                                         boolean missionCompleted) {
        if (gpsData.getTimestamp() == null) return LiveStatus.OFFLINE;

        long minutes = Duration.between(gpsData.getTimestamp(), LocalDateTime.now()).toMinutes();
        if (minutes > offlineThresholdMinutes) return LiveStatus.OFFLINE;
        if (missionCompleted) return LiveStatus.MISSION_COMPLETED;
        if (offRoute) return LiveStatus.OFF_ROUTE;
        if (!gpsData.isEngineOn()) return LiveStatus.ENGINE_OFF;
        if (gpsData.getSpeed() == null || gpsData.getSpeed() <= 1.0) {
            return missionActive ? LiveStatus.PAUSED_ON_MISSION : LiveStatus.STOPPED;
        }
        return LiveStatus.MOVING;
    }

    private boolean isNearLastPoint(Double lat, Double lng, List<MissionRoutePointDTO> route) {
        if (route == null || route.isEmpty() || lat == null || lng == null) return false;
        MissionRoutePointDTO last = route.get(route.size() - 1);
        if (last.getLatitude() == null || last.getLongitude() == null) return false;
        return distanceMeters(lat, lng, last.getLatitude(), last.getLongitude()) <= finishRadiusMeters;
    }

    private double distanceMeters(double lat1, double lon1, double lat2, double lon2) {
        double earthRadius = 6371000.0;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return earthRadius * c;
    }
}