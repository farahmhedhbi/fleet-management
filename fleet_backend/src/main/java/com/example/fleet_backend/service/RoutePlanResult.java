package com.example.fleet_backend.service;

public class RoutePlanResult {

    private final String routeJson;
    private final long durationSeconds;
    private final double distanceMeters;

    public RoutePlanResult(String routeJson, long durationSeconds, double distanceMeters) {
        this.routeJson = routeJson;
        this.durationSeconds = durationSeconds;
        this.distanceMeters = distanceMeters;
    }

    public String getRouteJson() {
        return routeJson;
    }

    public long getDurationSeconds() {
        return durationSeconds;
    }

    public double getDistanceMeters() {
        return distanceMeters;
    }
}