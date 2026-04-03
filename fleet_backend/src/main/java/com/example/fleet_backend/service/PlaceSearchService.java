package com.example.fleet_backend.service;

import com.example.fleet_backend.dto.PlaceSuggestionDTO;
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
public class PlaceSearchService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public PlaceSearchService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.restTemplate = new RestTemplate();
    }

    public List<PlaceSuggestionDTO> search(String query) {
        try {
            String encodedQuery = URLEncoder.encode(query, StandardCharsets.UTF_8);

            String url = "https://nominatim.openstreetmap.org/search?q="
                    + encodedQuery
                    + "&format=jsonv2"
                    + "&limit=5"
                    + "&accept-language=fr"
                    + "&countrycodes=tn";

            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", "fleet-backend/1.0");
            headers.setAccept(List.of(MediaType.APPLICATION_JSON));
            headers.set("Accept-Language", "fr");

            HttpEntity<Void> entity = new HttpEntity<>(headers);

            ResponseEntity<String> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    entity,
                    String.class
            );

            JsonNode root = objectMapper.readTree(response.getBody());
            List<PlaceSuggestionDTO> result = new ArrayList<>();

            if (root.isArray()) {
                for (JsonNode item : root) {
                    String placeId = item.path("place_id").asText();
                    String displayName = item.path("display_name").asText();
                    double lat = item.path("lat").asDouble();
                    double lon = item.path("lon").asDouble();

                    String value = displayName;
                    if (displayName != null && displayName.contains(",")) {
                        value = displayName.split(",")[0].trim();
                    }

                    String label = displayName;

                    result.add(new PlaceSuggestionDTO(
                            placeId,
                            label,
                            value,
                            displayName,
                            lat,
                            lon
                    ));
                }
            }

            return result;

        } catch (Exception e) {
            throw new RuntimeException("Erreur recherche lieux", e);
        }
    }
}