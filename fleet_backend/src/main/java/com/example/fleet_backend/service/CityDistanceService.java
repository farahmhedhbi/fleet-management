package com.example.fleet_backend.service;

import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

@Service
public class CityDistanceService {

    private final Map<String, double[]> cities = new HashMap<>();

    public CityDistanceService() {
        cities.put("sousse", new double[]{35.8256, 10.6369});
        cities.put("sfax", new double[]{34.7406, 10.7603});
        cities.put("tunis", new double[]{36.8065, 10.1815});
        cities.put("nabeul", new double[]{36.4513, 10.7357});
        cities.put("monastir", new double[]{35.7643, 10.8113});
        cities.put("akouda", new double[]{35.8691, 10.5653});
        cities.put("bizerte", new double[]{37.2744, 9.8739});
        cities.put("beja", new double[]{36.7256, 9.1817});
        cities.put("bouficha", new double[]{36.3028, 10.4511});
    }

    public double distanceKm(String cityA, String cityB) {
        double[] a = getCity(cityA);
        double[] b = getCity(cityB);

        double earthRadius = 6371.0;

        double lat1 = Math.toRadians(a[0]);
        double lon1 = Math.toRadians(a[1]);
        double lat2 = Math.toRadians(b[0]);
        double lon2 = Math.toRadians(b[1]);

        double dLat = lat2 - lat1;
        double dLon = lon2 - lon1;

        double h =
                Math.sin(dLat / 2) * Math.sin(dLat / 2)
                        + Math.cos(lat1) * Math.cos(lat2)
                        * Math.sin(dLon / 2) * Math.sin(dLon / 2);

        double c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));

        return Math.round(earthRadius * c * 10.0) / 10.0;
    }

    public int estimateDurationMinutes(String cityA, String cityB) {
        double distance = distanceKm(cityA, cityB);

        double averageSpeedKmH = 70.0;

        int minutes = (int) Math.ceil((distance / averageSpeedKmH) * 60);

        return Math.max(minutes, 15);
    }

    private double[] getCity(String city) {
        if (city == null || city.isBlank()) {
            throw new IllegalArgumentException("City is required");
        }

        String key = city.trim().toLowerCase(Locale.ROOT);

        double[] coordinates = cities.get(key);

        if (coordinates == null) {
            throw new IllegalArgumentException("Unknown city: " + city);
        }

        return coordinates;
    }
}