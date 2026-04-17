package com.example.fleet_backend.service;

import com.example.fleet_backend.dto.MissionRoutePointDTO;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
public class RoutePlannerService {

    private static final Logger log = LoggerFactory.getLogger(RoutePlannerService.class);

    private static final int GEOCODE_LIMIT = 5;
    private static final double MAX_REASONABLE_DISTANCE_METERS = 300_000;
    private static final long MIN_REASONABLE_DURATION_SECONDS = 60;
    private static final long MAX_REASONABLE_DURATION_SECONDS = 6 * 3600;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public RoutePlannerService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.restTemplate = new RestTemplate();
    }

    public RoutePlanResult buildRoutePlan(String departure, String destination) {
        validatePlace(departure, "departure");
        validatePlace(destination, "destination");

        List<GeoPoint> fromCandidates = geocodeCandidates(departure);
        List<GeoPoint> toCandidates = geocodeCandidates(destination);

        if (fromCandidates.isEmpty()) {
            throw new IllegalArgumentException("Lieu de départ introuvable : " + departure);
        }
        if (toCandidates.isEmpty()) {
            throw new IllegalArgumentException("Lieu de destination introuvable : " + destination);
        }

        RoutePlanResult bestPlan = null;
        GeoPoint bestFrom = null;
        GeoPoint bestTo = null;

        for (GeoPoint from : fromCandidates) {
            for (GeoPoint to : toCandidates) {
                try {
                    RoutePlanResult candidate = fetchDrivingRoute(from, to, departure, destination);

                    if (!isReasonable(candidate)) {
                        continue;
                    }

                    if (bestPlan == null || candidate.getDurationSeconds() < bestPlan.getDurationSeconds()) {
                        bestPlan = candidate;
                        bestFrom = from;
                        bestTo = to;
                    }
                } catch (Exception e) {
                    log.warn("Route candidate failed for {} -> {} with points [{},{}] -> [{},{}]",
                            departure, destination,
                            from.latitude(), from.longitude(),
                            to.latitude(), to.longitude());
                }
            }
        }

        if (bestPlan == null) {
            throw new IllegalArgumentException(
                    "Impossible de calculer un trajet cohérent entre " + departure + " et " + destination
            );
        }

        log.info("Route selected: departure={} ({},{}), destination={} ({},{}), distanceKm={}, durationMin={}",
                departure, bestFrom.latitude(), bestFrom.longitude(),
                destination, bestTo.latitude(), bestTo.longitude(),
                Math.round(bestPlan.getDistanceMeters() / 100.0) / 10.0,
                Math.round(bestPlan.getDurationSeconds() / 60.0));

        return bestPlan;
    }

    private void validatePlace(String value, String field) {
        if (value == null || value.trim().isBlank()) {
            throw new IllegalArgumentException(field + " is required");
        }
    }

    private List<GeoPoint> geocodeCandidates(String rawQuery) {
        String normalized = normalizePlace(rawQuery);

        List<String> attempts = new ArrayList<>();
        attempts.add(normalized + ", Tunisia");
        attempts.add(normalized + ", Tunisie");
        attempts.add(normalized);

        String simplified = firstToken(normalized);
        if (!simplified.equalsIgnoreCase(normalized)) {
            attempts.add(simplified + ", Tunisia");
            attempts.add(simplified + ", Tunisie");
            attempts.add(simplified);
        }

        List<GeoPoint> all = new ArrayList<>();

        for (String q : attempts) {
            List<GeoPoint> found = tryGeocodeMany(q);
            for (GeoPoint point : found) {
                if (!containsClosePoint(all, point)) {
                    all.add(point);
                }
            }

            if (!all.isEmpty()) {
                break;
            }
        }

        return all;
    }

    private List<GeoPoint> tryGeocodeMany(String query) {
        try {
            String encoded = URLEncoder.encode(query, StandardCharsets.UTF_8);

            String url = "https://nominatim.openstreetmap.org/search?q="
                    + encoded
                    + "&format=jsonv2"
                    + "&limit=" + GEOCODE_LIMIT
                    + "&accept-language=fr"
                    + "&countrycodes=tn"
                    + "&addressdetails=1";

            HttpHeaders headers = new HttpHeaders();
            headers.setAccept(List.of(MediaType.APPLICATION_JSON));
            headers.set("User-Agent", "fleet-backend/1.0");
            headers.set("Accept-Language", "fr");

            HttpEntity<Void> entity = new HttpEntity<>(headers);

            ResponseEntity<String> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    entity,
                    String.class
            );

            JsonNode root = objectMapper.readTree(response.getBody());

            if (!root.isArray() || root.isEmpty()) {
                return List.of();
            }

            List<GeoPoint> points = new ArrayList<>();

            for (JsonNode node : root) {
                String latText = node.path("lat").asText(null);
                String lonText = node.path("lon").asText(null);

                if (latText == null || lonText == null) {
                    continue;
                }

                double lat = Double.parseDouble(latText);
                double lon = Double.parseDouble(lonText);

                if (lat < 30.0 || lat > 38.5 || lon < 7.0 || lon > 12.5) {
                    continue;
                }

                double importance = node.path("importance").asDouble(0.0);
                String displayName = node.path("display_name").asText("");

                points.add(new GeoPoint(lat, lon, importance, displayName));
            }

            points.sort(Comparator
                    .comparingDouble((GeoPoint p) -> p.importance())
                    .reversed());

            return points;

        } catch (Exception e) {
            log.warn("Geocoding failed for query={}", query, e);
            return List.of();
        }
    }

    private boolean containsClosePoint(List<GeoPoint> list, GeoPoint candidate) {
        for (GeoPoint existing : list) {
            double dLat = Math.abs(existing.latitude() - candidate.latitude());
            double dLon = Math.abs(existing.longitude() - candidate.longitude());

            if (dLat < 0.0005 && dLon < 0.0005) {
                return true;
            }
        }
        return false;
    }

    private RoutePlanResult fetchDrivingRoute(
            GeoPoint from,
            GeoPoint to,
            String departure,
            String destination
    ) {
        try {
            String coordinates =
                    from.longitude() + "," + from.latitude() + ";" + to.longitude() + "," + to.latitude();

            String url = "https://router.project-osrm.org/route/v1/driving/"
                    + coordinates
                    + "?overview=full&geometries=geojson";

            HttpHeaders headers = new HttpHeaders();
            headers.setAccept(List.of(MediaType.APPLICATION_JSON));
            headers.set("User-Agent", "fleet-backend/1.0");

            HttpEntity<Void> entity = new HttpEntity<>(headers);

            ResponseEntity<String> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    entity,
                    String.class
            );

            JsonNode root = objectMapper.readTree(response.getBody());
            JsonNode routes = root.path("routes");

            if (!routes.isArray() || routes.isEmpty()) {
                throw new IllegalArgumentException(
                        "Impossible de calculer le trajet entre " + departure + " et " + destination
                );
            }

            JsonNode firstRoute = routes.get(0);
            JsonNode coordinatesNode = firstRoute.path("geometry").path("coordinates");

            List<MissionRoutePointDTO> points = new ArrayList<>();

            for (JsonNode node : coordinatesNode) {
                if (node == null || node.size() < 2) continue;

                double lon = node.get(0).asDouble();
                double lat = node.get(1).asDouble();
                points.add(new MissionRoutePointDTO(lat, lon));
            }

            if (points.isEmpty()) {
                throw new IllegalArgumentException(
                        "La route calculée est vide entre " + departure + " et " + destination
                );
            }

            long durationSeconds = Math.round(firstRoute.path("duration").asDouble(0));
            double distanceMeters = firstRoute.path("distance").asDouble(0);
            String routeJson = objectMapper.writeValueAsString(points);

            return new RoutePlanResult(routeJson, durationSeconds, distanceMeters);

        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException(
                    "Erreur calcul trajet réel entre " + departure + " et " + destination,
                    e
            );
        }
    }

    private boolean isReasonable(RoutePlanResult plan) {
        if (plan == null) return false;
        if (plan.getRouteJson() == null || plan.getRouteJson().isBlank()) return false;
        if (plan.getDistanceMeters() <= 0) return false;
        if (plan.getDurationSeconds() <= 0) return false;

        if (plan.getDistanceMeters() > MAX_REASONABLE_DISTANCE_METERS) {
            return false;
        }

        if (plan.getDurationSeconds() < MIN_REASONABLE_DURATION_SECONDS) {
            return false;
        }

        if (plan.getDurationSeconds() > MAX_REASONABLE_DURATION_SECONDS) {
            return false;
        }

        return true;
    }

    private String normalizePlace(String value) {
        if (value == null) {
            return "";
        }
        return value.trim();
    }

    private String firstToken(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }
        String[] parts = value.split(",");
        return parts.length > 0 ? parts[0].trim() : value.trim();
    }

    private record GeoPoint(
            double latitude,
            double longitude,
            double importance,
            String displayName
    ) {
    }
}