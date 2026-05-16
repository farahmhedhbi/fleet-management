package com.example.fleet_backend.service;

import com.example.fleet_backend.dto.MissionRoutePointDTO;
import com.example.fleet_backend.dto.RouteCheckResultDTO;
import com.example.fleet_backend.model.Mission;
import com.example.fleet_backend.model.RouteCheckStatus;
import com.example.fleet_backend.model.RouteRiskLevel;
import com.example.fleet_backend.repository.MissionRepository;
import com.example.fleet_backend.service.websocket.RouteCheckWebSocketPublisher;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@Transactional
public class RouteVerificationService {

    private final MissionRepository missionRepository;
    private final MissionAccessService missionAccessService;
    private final RouteCheckWebSocketPublisher publisher;
    private final ObjectMapper objectMapper;

    public RouteVerificationService(
            MissionRepository missionRepository,
            MissionAccessService missionAccessService,
            RouteCheckWebSocketPublisher publisher,
            ObjectMapper objectMapper
    ) {
        this.missionRepository = missionRepository;
        this.missionAccessService = missionAccessService;
        this.publisher = publisher;
        this.objectMapper = objectMapper;
    }

    public RouteCheckResultDTO checkRoute(Long missionId, Authentication auth) {

        Mission mission = missionAccessService.getAuthorizedMission(missionId, auth);

        if (
                mission.getStatus() != Mission.MissionStatus.PLANNED
                        && mission.getStatus() != Mission.MissionStatus.IN_PROGRESS
        ) {
            throw new IllegalArgumentException(
                    "Route verification unavailable for this mission status"
            );
        }

        if (mission.getRouteJson() == null || mission.getRouteJson().isBlank()) {
            throw new IllegalArgumentException("Mission route is missing");
        }

        String originalRoute = mission.getOriginalRouteJson() != null
                ? mission.getOriginalRouteJson()
                : mission.getRouteJson();

        mission.setOriginalRouteJson(originalRoute);
        mission.setRouteCheckedAt(LocalDateTime.now());

        double originalDistanceKm = calculateRouteDistanceKm(originalRoute);
        int originalDuration = estimateDurationMinutes(originalDistanceKm);

        boolean initialRouteBad = mission.getId() % 2 == 0;
        boolean allRoutesRisky = mission.getId() % 5 == 0;

        if (!initialRouteBad) {

            mission.setRouteCheckStatus(RouteCheckStatus.SAFE);
            mission.setRouteRiskLevel(RouteRiskLevel.LOW);
            mission.setRouteRecalculated(false);

            mission.setOriginalDistanceKm(round(originalDistanceKm));
            mission.setSelectedDistanceKm(round(originalDistanceKm));

            mission.setOriginalDurationMinutes(originalDuration);
            mission.setSelectedDurationMinutes(originalDuration);

            mission.setEstimatedDelayMinutes(0);

            mission.setRouteCheckMessage(
                    "Route sûre. Aucun risque important détecté."
            );

            mission.setRouteJson(originalRoute);

        } else if (!allRoutesRisky) {

            String alternativeRoute =
                    buildMockAlternativeRouteJson(originalRoute, 0.018);

            double alternativeDistance =
                    calculateRouteDistanceKm(alternativeRoute);

            int alternativeDuration =
                    estimateDurationMinutes(alternativeDistance);

            mission.setRouteCheckStatus(
                    RouteCheckStatus.ALTERNATIVE_SELECTED
            );

            mission.setRouteRiskLevel(RouteRiskLevel.MEDIUM);
            mission.setRouteRecalculated(true);

            mission.setOriginalDistanceKm(round(originalDistanceKm));
            mission.setSelectedDistanceKm(round(alternativeDistance));

            mission.setOriginalDurationMinutes(originalDuration);
            mission.setSelectedDurationMinutes(alternativeDuration);

            mission.setEstimatedDelayMinutes(
                    alternativeDuration - originalDuration
            );

            mission.setRouteCheckMessage(
                    "Route initiale risquée. Une route recommandée plus sûre a été sélectionnée."
            );

            mission.setRouteJson(alternativeRoute);

        } else {

            String leastRiskRoute =
                    buildMockAlternativeRouteJson(originalRoute, 0.028);

            double leastRiskDistance =
                    calculateRouteDistanceKm(leastRiskRoute);

            int leastRiskDuration =
                    estimateDurationMinutes(leastRiskDistance);

            mission.setRouteCheckStatus(
                    RouteCheckStatus.LEAST_RISK_SELECTED
            );

            mission.setRouteRiskLevel(RouteRiskLevel.HIGH);
            mission.setRouteRecalculated(true);

            mission.setOriginalDistanceKm(round(originalDistanceKm));
            mission.setSelectedDistanceKm(round(leastRiskDistance));

            mission.setOriginalDurationMinutes(originalDuration);
            mission.setSelectedDurationMinutes(leastRiskDuration);

            mission.setEstimatedDelayMinutes(
                    leastRiskDuration - originalDuration
            );

            mission.setRouteCheckMessage(
                    "Toutes les routes présentent des risques. La route la moins dangereuse a été sélectionnée."
            );

            mission.setRouteJson(leastRiskRoute);
        }

        Mission saved = missionRepository.save(mission);

        RouteCheckResultDTO dto = new RouteCheckResultDTO();

        dto.setMissionId(saved.getId());

        dto.setVehicleId(
                saved.getVehicle() != null
                        ? saved.getVehicle().getId()
                        : null
        );

        dto.setStatus(saved.getRouteCheckStatus());
        dto.setRiskLevel(saved.getRouteRiskLevel());

        dto.setRouteRecalculated(saved.getRouteRecalculated());

        dto.setOriginalDurationMinutes(saved.getOriginalDurationMinutes());
        dto.setSelectedDurationMinutes(saved.getSelectedDurationMinutes());

        dto.setEstimatedDelayMinutes(saved.getEstimatedDelayMinutes());

        dto.setOriginalDistanceKm(saved.getOriginalDistanceKm());
        dto.setSelectedDistanceKm(saved.getSelectedDistanceKm());

        dto.setMessage(saved.getRouteCheckMessage());

        dto.setOriginalRouteJson(saved.getOriginalRouteJson());
        dto.setSelectedRouteJson(saved.getRouteJson());

        publisher.publish(dto);

        return dto;
    }

    private double calculateRouteDistanceKm(String routeJson) {

        try {

            List<MissionRoutePointDTO> points =
                    objectMapper.readValue(
                            routeJson,
                            new TypeReference<List<MissionRoutePointDTO>>() {}
                    );

            if (points == null || points.size() < 2) {
                return 0;
            }

            double total = 0;

            for (int i = 1; i < points.size(); i++) {

                MissionRoutePointDTO p1 = points.get(i - 1);
                MissionRoutePointDTO p2 = points.get(i);

                total += haversine(
                        p1.getLatitude(),
                        p1.getLongitude(),
                        p2.getLatitude(),
                        p2.getLongitude()
                );
            }

            return total;

        } catch (Exception e) {
            return 0;
        }
    }

    private int estimateDurationMinutes(double distanceKm) {

        double averageSpeedKmH = 65.0;

        return Math.max(
                3,
                (int) Math.round((distanceKm / averageSpeedKmH) * 60)
        );
    }

    private double haversine(
            double lat1,
            double lon1,
            double lat2,
            double lon2
    ) {

        final int EARTH_RADIUS_KM = 6371;

        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);

        double a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2)
                        + Math.cos(Math.toRadians(lat1))
                        * Math.cos(Math.toRadians(lat2))
                        * Math.sin(dLon / 2)
                        * Math.sin(dLon / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return EARTH_RADIUS_KM * c;
    }

    private double round(double value) {
        return Math.round(value * 10.0) / 10.0;
    }

    private String buildMockAlternativeRouteJson(
            String originalRouteJson,
            double offset
    ) {

        try {

            List<MissionRoutePointDTO> original =
                    objectMapper.readValue(
                            originalRouteJson,
                            new TypeReference<List<MissionRoutePointDTO>>() {}
                    );

            if (original == null || original.size() < 3) {
                return originalRouteJson;
            }

            List<MissionRoutePointDTO> alternative =
                    new ArrayList<>();

            for (int i = 0; i < original.size(); i++) {

                MissionRoutePointDTO point = original.get(i);

                if (
                        point == null
                                || point.getLatitude() == null
                                || point.getLongitude() == null
                ) {
                    continue;
                }

                double lat = point.getLatitude();
                double lng = point.getLongitude();

                if (i != 0 && i != original.size() - 1) {

                    double factor =
                            Math.sin(
                                    (Math.PI * i)
                                            / (original.size() - 1)
                            );

                    lat = lat + offset * factor;
                    lng = lng - offset * factor;
                }

                alternative.add(
                        new MissionRoutePointDTO(lat, lng)
                );
            }

            return objectMapper.writeValueAsString(alternative);

        } catch (Exception e) {
            return originalRouteJson;
        }
    }
}