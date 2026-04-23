package com.example.fleet_backend.service.gps;

import com.example.fleet_backend.dto.MissionRoutePointDTO;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;

@Service
public class RouteParsingService {

    private final ObjectMapper objectMapper;

    public RouteParsingService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public List<MissionRoutePointDTO> parseMissionRoute(String routeJson) {
        if (routeJson == null || routeJson.isBlank()) {
            return Collections.emptyList();
        }

        try {
            return objectMapper.readValue(routeJson, new TypeReference<List<MissionRoutePointDTO>>() {});
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }
}