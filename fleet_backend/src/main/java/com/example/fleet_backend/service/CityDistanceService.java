package com.example.fleet_backend.service;

import org.springframework.stereotype.Service;

@Service
public class CityDistanceService {

    private static final double EARTH_RADIUS_KM = 6371.0;
    private static final double AVERAGE_SPEED_KMH = 70.0;

    public double distanceKm(double latA, double lonA, double latB, double lonB) {
        double lat1 = Math.toRadians(latA);
        double lon1 = Math.toRadians(lonA);
        double lat2 = Math.toRadians(latB);
        double lon2 = Math.toRadians(lonB);

        double dLat = lat2 - lat1;
        double dLon = lon2 - lon1;

        double h =
                Math.sin(dLat / 2) * Math.sin(dLat / 2)
                        + Math.cos(lat1) * Math.cos(lat2)
                        * Math.sin(dLon / 2) * Math.sin(dLon / 2);

        double c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));

        return Math.round(EARTH_RADIUS_KM * c * 10.0) / 10.0;
    }

    public int estimateDurationMinutes(double latA, double lonA, double latB, double lonB) {
        double distance = distanceKm(latA, lonA, latB, lonB);
        int minutes = (int) Math.ceil((distance / AVERAGE_SPEED_KMH) * 60);
        return Math.max(minutes, 15);
    }
}