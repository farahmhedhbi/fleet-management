package com.example.fleet_backend.service;

import com.example.fleet_backend.dto.ObdAlertDTO;
import com.example.fleet_backend.dto.VehicleEventDTO;
import com.example.fleet_backend.model.EventSeverity;
import com.example.fleet_backend.model.GpsData;
import com.example.fleet_backend.model.Vehicle;
import com.example.fleet_backend.model.VehicleEvent;
import com.example.fleet_backend.model.VehicleEventType;
import com.example.fleet_backend.repository.VehicleEventRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class VehicleEventService {

    private static final double OVERSPEED_THRESHOLD = 100.0;
    private static final long EVENT_COOLDOWN_MINUTES = 10;
    private static final long STOP_LONG_MINUTES = 2;

    private final VehicleEventRepository vehicleEventRepository;
    private final NotificationService notificationService;
    private final ObdAnalysisService obdAnalysisService;

    public VehicleEventService(VehicleEventRepository vehicleEventRepository,
                               NotificationService notificationService,
                               ObdAnalysisService obdAnalysisService) {
        this.vehicleEventRepository = vehicleEventRepository;
        this.notificationService = notificationService;
        this.obdAnalysisService = obdAnalysisService;
    }

    public void analyzeAndCreateEvents(Vehicle vehicle,
                                       GpsData previousGps,
                                       GpsData currentGps,
                                       boolean missionActive,
                                       Long missionId,
                                       boolean offRoute,
                                       boolean missionCompleted) {

        if (vehicle == null || currentGps == null) return;

        handleEngineTransitions(vehicle, previousGps, currentGps, missionId, missionActive);
        handleOverspeed(vehicle, currentGps, missionId);
        handleOffRoute(vehicle, currentGps, missionId, offRoute);
        handleMissionCompleted(vehicle, currentGps, missionId, missionCompleted);
        handleStopLong(vehicle, previousGps, currentGps, missionActive, missionId);
        handleObdEvents(vehicle, currentGps, missionId);
    }

    private void handleEngineTransitions(Vehicle vehicle,
                                         GpsData previousGps,
                                         GpsData currentGps,
                                         Long missionId,
                                         boolean missionActive) {
        if (previousGps == null) return;

        if (!previousGps.isEngineOn() && currentGps.isEngineOn()) {
            createEventIfAllowed(vehicle, missionId, VehicleEventType.ENGINE_ON,
                    EventSeverity.INFO, "Moteur allumé", currentGps);

            if (missionActive) {
                createEventIfAllowed(vehicle, missionId, VehicleEventType.MISSION_STARTED,
                        EventSeverity.INFO, "Mission démarrée", currentGps);
            }
        }

        if (previousGps.isEngineOn() && !currentGps.isEngineOn()) {
            createEventIfAllowed(vehicle, missionId, VehicleEventType.ENGINE_OFF,
                    EventSeverity.WARNING, "Moteur éteint", currentGps);
        }
    }

    private void handleOverspeed(Vehicle vehicle, GpsData currentGps, Long missionId) {
        Double speed = currentGps.getSpeed();

        if (speed != null && speed > OVERSPEED_THRESHOLD) {
            createEventIfAllowed(vehicle, missionId, VehicleEventType.OVERSPEED,
                    EventSeverity.CRITICAL,
                    "Dépassement de vitesse détecté : " + speed + " km/h",
                    currentGps);
        }
    }

    private void handleOffRoute(Vehicle vehicle,
                                GpsData currentGps,
                                Long missionId,
                                boolean offRoute) {
        if (!offRoute) return;

        createEventIfAllowed(vehicle, missionId, VehicleEventType.OFF_ROUTE,
                EventSeverity.CRITICAL, "Véhicule hors trajet prévu", currentGps);
    }

    private void handleMissionCompleted(Vehicle vehicle,
                                        GpsData currentGps,
                                        Long missionId,
                                        boolean missionCompleted) {
        if (!missionCompleted) return;

        createEventIfAllowed(vehicle, missionId, VehicleEventType.MISSION_COMPLETED,
                EventSeverity.INFO, "Mission terminée", currentGps);
    }

    private void handleStopLong(Vehicle vehicle,
                                GpsData previousGps,
                                GpsData currentGps,
                                boolean missionActive,
                                Long missionId) {
        if (!missionActive || previousGps == null) return;

        boolean currentStopped = currentGps.isEngineOn()
                && currentGps.getSpeed() != null
                && currentGps.getSpeed() <= 1.0;

        boolean previousStopped = previousGps.isEngineOn()
                && previousGps.getSpeed() != null
                && previousGps.getSpeed() <= 1.0;

        if (!currentStopped || !previousStopped) return;
        if (currentGps.getTimestamp() == null || previousGps.getTimestamp() == null) return;

        long minutes = Duration.between(previousGps.getTimestamp(), currentGps.getTimestamp()).toMinutes();

        if (minutes >= STOP_LONG_MINUTES) {
            createEventIfAllowed(vehicle, missionId, VehicleEventType.STOP_LONG,
                    EventSeverity.WARNING, "Arrêt prolongé en mission", currentGps);
        }
    }

    private void handleObdEvents(Vehicle vehicle, GpsData currentGps, Long missionId) {
        List<ObdAlertDTO> alerts = obdAnalysisService.computeAlerts(
                currentGps.getFuelLevel(),
                currentGps.getEngineTemperature(),
                currentGps.getBatteryVoltage(),
                currentGps.getCheckEngineOn()
        );

        for (ObdAlertDTO alert : alerts) {
            VehicleEventType eventType = mapObdAlertToEventType(alert.getCode());
            EventSeverity severity = EventSeverity.valueOf(alert.getSeverity());

            createEventIfAllowed(
                    vehicle,
                    missionId,
                    eventType,
                    severity,
                    alert.getMessage(),
                    currentGps
            );
        }
    }

    private VehicleEventType mapObdAlertToEventType(String code) {
        if (code == null) return VehicleEventType.OBD_CHECK_ENGINE;

        if (code.startsWith("LOW_FUEL")) return VehicleEventType.OBD_LOW_FUEL;
        if (code.startsWith("HIGH_TEMP")) return VehicleEventType.OBD_HIGH_TEMP;
        if (code.startsWith("LOW_BATTERY")) return VehicleEventType.OBD_LOW_BATTERY;
        if (code.equals("CHECK_ENGINE_ON")) return VehicleEventType.OBD_CHECK_ENGINE;

        return VehicleEventType.OBD_CHECK_ENGINE;
    }

    private void createEventIfAllowed(Vehicle vehicle,
                                      Long missionId,
                                      VehicleEventType eventType,
                                      EventSeverity severity,
                                      String message,
                                      GpsData gpsData) {

        LocalDateTime now = LocalDateTime.now();

        var lastOpt = vehicleEventRepository
                .findTopByVehicleIdAndEventTypeOrderByCreatedAtDesc(vehicle.getId(), eventType);

        if (lastOpt.isPresent()) {
            VehicleEvent last = lastOpt.get();

            boolean sameMission = missionId == null
                    ? last.getMissionId() == null
                    : missionId.equals(last.getMissionId());

            boolean sameSeverity = last.getSeverity() == severity;

            long minutes = Duration.between(last.getCreatedAt(), now).toMinutes();

            if (sameMission && sameSeverity && minutes < EVENT_COOLDOWN_MINUTES) {
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

        vehicleEventRepository.save(event);
        notifyOwnerIfCriticalObd(event);
    }

    private void notifyOwnerIfCriticalObd(VehicleEvent event) {
        if (event == null || event.getVehicle() == null) return;
        if (event.getSeverity() != EventSeverity.CRITICAL) return;

        VehicleEventType type = event.getEventType();

        boolean isObdEvent =
                type == VehicleEventType.OBD_LOW_FUEL ||
                        type == VehicleEventType.OBD_HIGH_TEMP ||
                        type == VehicleEventType.OBD_LOW_BATTERY ||
                        type == VehicleEventType.OBD_CHECK_ENGINE;

        if (!isObdEvent) return;
        if (event.getVehicle().getOwner() == null) return;

        notificationService.createUniqueForUser(
                event.getVehicle().getOwner().getId(),
                "ALERTE_OBD_CRITIQUE",
                event.getMessage(),
                event.getMissionId()
        );
    }

    public List<VehicleEventDTO> getVehicleEvents(Long vehicleId) {
        return vehicleEventRepository.findByVehicleIdOrderByCreatedAtDesc(vehicleId)
                .stream()
                .map(this::toDto)
                .toList();
    }

    public List<VehicleEventDTO> getLatestEvents() {
        return vehicleEventRepository.findTop50ByOrderByCreatedAtDesc()
                .stream()
                .map(this::toDto)
                .toList();
    }

    private VehicleEventDTO toDto(VehicleEvent event) {
        return new VehicleEventDTO(
                event.getId(),
                event.getVehicle().getId(),
                event.getMissionId(),
                event.getEventType().name(),
                event.getSeverity().name(),
                event.getMessage(),
                event.getLatitude(),
                event.getLongitude(),
                event.getSpeed(),
                event.getCreatedAt(),
                event.isAcknowledged()
        );
    }
}