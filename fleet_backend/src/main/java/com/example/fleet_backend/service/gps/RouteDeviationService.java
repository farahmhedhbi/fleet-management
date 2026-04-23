package com.example.fleet_backend.service.gps;

import com.example.fleet_backend.dto.MissionRoutePointDTO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class RouteDeviationService {

    private final double offRouteThresholdMeters;

    public RouteDeviationService(
            @Value("${gps.off-route-threshold-meters:100}") double offRouteThresholdMeters
    ) {
        this.offRouteThresholdMeters = offRouteThresholdMeters;
    }

    public boolean isOffRoute(Double vehicleLat,
                              Double vehicleLng,
                              List<MissionRoutePointDTO> route) {
        if (vehicleLat == null || vehicleLng == null || route == null || route.size() < 2) {
            return false;
        }

        double minDistance = getMinimumDistanceToRouteMeters(vehicleLat, vehicleLng, route);

        return minDistance > offRouteThresholdMeters;
    }

    public double getMinimumDistanceToRouteMeters(Double vehicleLat,
                                                  Double vehicleLng,
                                                  List<MissionRoutePointDTO> route) {
        if (vehicleLat == null || vehicleLng == null || route == null || route.size() < 2) {
            return Double.MAX_VALUE;
        }

        double minDistance = Double.MAX_VALUE;

        for (int i = 0; i < route.size() - 1; i++) {
            MissionRoutePointDTO p1 = route.get(i);
            MissionRoutePointDTO p2 = route.get(i + 1);

            if (!isValidPoint(p1) || !isValidPoint(p2)) {
                continue;
            }

            double distance = distancePointToSegmentMeters(
                    vehicleLat, vehicleLng,
                    p1.getLatitude(), p1.getLongitude(),
                    p2.getLatitude(), p2.getLongitude()
            );

            if (distance < minDistance) {
                minDistance = distance;
            }
        }

        return minDistance;
    }

    private boolean isValidPoint(MissionRoutePointDTO point) {
        return point != null
                && point.getLatitude() != null
                && point.getLongitude() != null;
    }

    private double distancePointToSegmentMeters(double pLat, double pLng,
                                                double aLat, double aLng,
                                                double bLat, double bLng) {
        double meanLat = Math.toRadians((aLat + bLat + pLat) / 3.0);

        double px = lonToMeters(pLng, meanLat);
        double py = latToMeters(pLat);

        double ax = lonToMeters(aLng, meanLat);
        double ay = latToMeters(aLat);

        double bx = lonToMeters(bLng, meanLat);
        double by = latToMeters(bLat);

        double abx = bx - ax;
        double aby = by - ay;

        double apx = px - ax;
        double apy = py - ay;

        double abSquared = abx * abx + aby * aby;

        if (abSquared == 0) {
            return euclideanDistance(px, py, ax, ay);
        }

        double t = (apx * abx + apy * aby) / abSquared;
        t = Math.max(0, Math.min(1, t));

        double closestX = ax + t * abx;
        double closestY = ay + t * aby;

        return euclideanDistance(px, py, closestX, closestY);
    }

    private double latToMeters(double lat) {
        return lat * 111_320.0;
    }

    private double lonToMeters(double lon, double meanLatRad) {
        return lon * 111_320.0 * Math.cos(meanLatRad);
    }

    private double euclideanDistance(double x1, double y1, double x2, double y2) {
        double dx = x2 - x1;
        double dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }
}