package com.example.fleet_backend.service;

import com.example.fleet_backend.dto.MissionRoutePointDTO;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

@Service
public class RoutePlannerService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public RoutePlannerService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.restTemplate = new RestTemplate();
    }

    public RoutePlanResult buildRoutePlan(String departure, String destination) {
        GeoPoint from = geocode(departure);
        GeoPoint to = geocode(destination);

        return fetchDrivingRoute(from, to, departure, destination);
    }

    private GeoPoint geocode(String query) {
        try {
            String encoded = URLEncoder.encode(query + ", Tunisia", StandardCharsets.UTF_8);
            String url = "https://nominatim.openstreetmap.org/search?q="
                    + encoded
                    + "&format=jsonv2&limit=1";

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

            if (!root.isArray() || root.isEmpty()) {
                throw new IllegalArgumentException("Lieu introuvable : " + query);
            }

            JsonNode first = root.get(0);

            double lat = Double.parseDouble(first.get("lat").asText());
            double lon = Double.parseDouble(first.get("lon").asText());

            return new GeoPoint(lat, lon);
        } catch (Exception e) {
            throw new RuntimeException("Erreur de géocodage pour : " + query, e);
        }
    }

    private RoutePlanResult fetchDrivingRoute(
            GeoPoint from,
            GeoPoint to,
            String departure,
            String destination
    ) {
        try {
            String coordinates =
                    from.longitude + "," + from.latitude + ";" + to.longitude + "," + to.latitude;

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
                        "Impossible de calculer le trajet réel entre " + departure + " et " + destination
                );
            }

            JsonNode firstRoute = routes.get(0);
            JsonNode coordinatesNode = firstRoute.path("geometry").path("coordinates");

            List<MissionRoutePointDTO> points = new ArrayList<>();

            for (JsonNode node : coordinatesNode) {
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
        } catch (Exception e) {
            throw new RuntimeException("Erreur récupération itinéraire OSRM", e);
        }
    }

    private record GeoPoint(double latitude, double longitude) {}
}