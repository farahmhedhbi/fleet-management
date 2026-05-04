package com.example.fleet_backend.service;

import com.example.fleet_backend.dto.VehicleEventDTO;
import com.example.fleet_backend.model.EventSeverity;
import com.example.fleet_backend.model.GpsData;
import com.example.fleet_backend.model.Vehicle;
import com.example.fleet_backend.model.VehicleEvent;
import com.example.fleet_backend.model.VehicleEventType;
import com.example.fleet_backend.repository.VehicleEventRepository;
import com.example.fleet_backend.service.websocket.GpsWebSocketPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class VehicleEventService {

    private static final double OVERSPEED_THRESHOLD = 100.0;
    private static final long EVENT_COOLDOWN_MINUTES = 10;
    private static final long STOP_LONG_MINUTES = 2;

    private final VehicleEventRepository vehicleEventRepository;
    private final GpsWebSocketPublisher gpsWebSocketPublisher;


    public VehicleEventService(
            VehicleEventRepository vehicleEventRepository,
            GpsWebSocketPublisher gpsWebSocketPublisher
    ) {
        this.vehicleEventRepository = vehicleEventRepository;
        this.gpsWebSocketPublisher = gpsWebSocketPublisher;

    }

    public void analyzeAndCreateEvents(
            Vehicle vehicle,
            GpsData previousGps,
            GpsData currentGps,
            boolean missionActive,
            Long missionId,
            boolean offRoute,
            boolean missionCompleted
    ) {
        if (vehicle == null || currentGps == null) {
            return;
        }

        handleEngineTransitions(vehicle, previousGps, currentGps, missionId, missionActive);
        handleOverspeed(vehicle, currentGps, missionId);
        handleOffRoute(vehicle, currentGps, missionId, offRoute);
        handleMissionCompleted(vehicle, currentGps, missionId, missionCompleted);
        handleStopLong(vehicle, previousGps, currentGps, missionActive, missionId);
    }

    private void handleEngineTransitions(
            Vehicle vehicle,
            GpsData previousGps,
            GpsData currentGps,
            Long missionId,
            boolean missionActive
    ) {
        if (previousGps == null) return;

        if (!previousGps.isEngineOn() && currentGps.isEngineOn()) {
            createEventIfAllowed(
                    vehicle,
                    missionId,
                    VehicleEventType.ENGINE_ON,
                    EventSeverity.INFO,
                    "Moteur allumé",
                    currentGps
            );

            if (missionActive) {
                createEventIfAllowed(
                        vehicle,
                        missionId,
                        VehicleEventType.MISSION_STARTED,
                        EventSeverity.INFO,
                        "Mission démarrée",
                        currentGps
                );
            }
        }

        if (previousGps.isEngineOn() && !currentGps.isEngineOn()) {
            createEventIfAllowed(
                    vehicle,
                    missionId,
                    VehicleEventType.ENGINE_OFF,
                    EventSeverity.WARNING,
                    "Moteur éteint",
                    currentGps
            );
        }
    }

    private void handleOverspeed(
            Vehicle vehicle,
            GpsData currentGps,
            Long missionId
    ) {
        Double speed = currentGps.getSpeed();

        if (speed != null && speed > OVERSPEED_THRESHOLD) {
            createEventIfAllowed(
                    vehicle,
                    missionId,
                    VehicleEventType.OVERSPEED,
                    EventSeverity.CRITICAL,
                    "Dépassement de vitesse détecté",
                    currentGps
            );
        }
    }

    private void handleOffRoute(
            Vehicle vehicle,
            GpsData currentGps,
            Long missionId,
            boolean offRoute
    ) {
        if (!offRoute) return;

        createEventIfAllowed(
                vehicle,
                missionId,
                VehicleEventType.OFF_ROUTE,
                EventSeverity.CRITICAL,
                "Véhicule hors trajet prévu",
                currentGps
        );
    }

    private void handleMissionCompleted(
            Vehicle vehicle,
            GpsData currentGps,
            Long missionId,
            boolean missionCompleted
    ) {
        if (!missionCompleted) return;

        createEventIfAllowed(
                vehicle,
                missionId,
                VehicleEventType.MISSION_COMPLETED,
                EventSeverity.INFO,
                "Mission terminée",
                currentGps
        );
    }

    private void handleStopLong(
            Vehicle vehicle,
            GpsData previousGps,
            GpsData currentGps,
            boolean missionActive,
            Long missionId
    ) {
        if (!missionActive || previousGps == null) return;

        boolean currentStopped =
                currentGps.isEngineOn()
                        && currentGps.getSpeed() != null
                        && currentGps.getSpeed() <= 1.0;

        boolean previousStopped =
                previousGps.isEngineOn()
                        && previousGps.getSpeed() != null
                        && previousGps.getSpeed() <= 1.0;

        if (!currentStopped || !previousStopped) return;
        if (currentGps.getTimestamp() == null || previousGps.getTimestamp() == null) return;

        long minutes = Duration.between(
                previousGps.getTimestamp(),
                currentGps.getTimestamp()
        ).toMinutes();

        if (minutes >= STOP_LONG_MINUTES) {
            createEventIfAllowed(
                    vehicle,
                    missionId,
                    VehicleEventType.STOP_LONG,
                    EventSeverity.WARNING,
                    "Arrêt prolongé en mission",
                    currentGps
            );
        }
    }

    private void createEventIfAllowed(
            Vehicle vehicle,
            Long missionId,
            VehicleEventType eventType,
            EventSeverity severity,
            String message,
            GpsData gpsData
    ) {
        LocalDateTime now = LocalDateTime.now();

        Optional<VehicleEvent> lastOpt;

        if (missionId != null) {
            lastOpt = vehicleEventRepository
                    .findTopByVehicleIdAndMissionIdAndEventTypeOrderByCreatedAtDesc(
                            vehicle.getId(),
                            missionId,
                            eventType
                    );
        } else {
            lastOpt = vehicleEventRepository
                    .findTopByVehicleIdAndMissionIdIsNullAndEventTypeOrderByCreatedAtDesc(
                            vehicle.getId(),
                            eventType
                    );
        }

        if (lastOpt.isPresent()) {
            VehicleEvent last = lastOpt.get();

            long minutes = Duration.between(last.getCreatedAt(), now).toMinutes();

            boolean sameSeverity = last.getSeverity() == severity;

            if (sameSeverity && minutes < EVENT_COOLDOWN_MINUTES) {
                return;
            }
        }

        VehicleEvent event = new VehicleEvent();
        event.setVehicle(vehicle);
        event.setMissionId(missionId);
        event.setEventType(eventType);
        event.setSeverity(severity);
        event.setMessage(message);
        event.setLatitude(gpsData.getLatitude());
        event.setLongitude(gpsData.getLongitude());
        event.setSpeed(gpsData.getSpeed());
        event.setCreatedAt(now);
        event.setAcknowledged(false);

        VehicleEvent saved = vehicleEventRepository.save(event);



        gpsWebSocketPublisher.publishEvent(toDto(saved));
    }




    public List<VehicleEventDTO> getLatestEvents() {
        return vehicleEventRepository.findTop50ByOrderByCreatedAtDesc()
                .stream()
                .filter(event -> event.getSeverity() == EventSeverity.CRITICAL
                        || event.getSeverity() == EventSeverity.WARNING)
                .map(this::toDto)
                .toList();
    }

    public List<VehicleEventDTO> getVehicleEvents(Long vehicleId) {
        return vehicleEventRepository.findByVehicleIdOrderByCreatedAtDesc(vehicleId)
                .stream()
                .filter(event -> event.getSeverity() == EventSeverity.CRITICAL
                        || event.getSeverity() == EventSeverity.WARNING)
                .map(this::toDto)
                .toList();
    }

    private VehicleEventDTO toDto(VehicleEvent event) {
        return new VehicleEventDTO(
                event.getId(),
                event.getVehicle() != null ? event.getVehicle().getId() : null,
                event.getMissionId(),
                event.getEventType() != null ? event.getEventType().name() : null,
                event.getSeverity() != null ? event.getSeverity().name() : null,
                event.getMessage(),
                event.getLatitude(),
                event.getLongitude(),
                event.getSpeed(),
                event.getCreatedAt(),
                event.isAcknowledged()
        );
    }
    public void createObdEventIfAllowed(
            Vehicle vehicle,
            Long missionId,
            VehicleEventType eventType,
            EventSeverity severity,
            String message,
            Double latitude,
            Double longitude,
            Double speed
    ) {
        GpsData gpsData = new GpsData();
        gpsData.setVehicle(vehicle);
        gpsData.setLatitude(latitude);
        gpsData.setLongitude(longitude);
        gpsData.setSpeed(speed);
        gpsData.setTimestamp(LocalDateTime.now());

        createEventIfAllowed(
                vehicle,
                missionId,
                eventType,
                severity,
                message,
                gpsData
        );
    }
}