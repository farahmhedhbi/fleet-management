package com.example.fleet_backend.service;

import com.example.fleet_backend.dto.ObdAlertDTO;
import com.example.fleet_backend.dto.VehicleEventDTO;
import com.example.fleet_backend.model.EventSeverity;
import com.example.fleet_backend.model.GpsData;
import com.example.fleet_backend.model.Vehicle;
import com.example.fleet_backend.model.VehicleEvent;
import com.example.fleet_backend.model.VehicleEventType;
import com.example.fleet_backend.model.VehicleHealthState;
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
public class ObdEventService {

    private static final long OBD_EVENT_COOLDOWN_MINUTES = 10;

    private final VehicleEventRepository eventRepository;
    private final ObdAnalysisService obdAnalysisService;
    private final NotificationService notificationService;
    private final GpsWebSocketPublisher gpsWebSocketPublisher;


    public ObdEventService(
            VehicleEventRepository eventRepository,
            ObdAnalysisService obdAnalysisService,
            NotificationService notificationService,
            GpsWebSocketPublisher gpsWebSocketPublisher

    ) {
        this.eventRepository = eventRepository;
        this.obdAnalysisService = obdAnalysisService;
        this.notificationService = notificationService;
        this.gpsWebSocketPublisher = gpsWebSocketPublisher;

    }

    public void generateEvents(
            GpsData gpsData,
            VehicleHealthState healthState,
            String healthReason
    ) {
        if (gpsData == null || gpsData.getVehicle() == null) {
            return;
        }

        generateMainObdAlert(gpsData);
        generateHealthStateEvent(gpsData, healthState, healthReason);
    }

    private void generateMainObdAlert(GpsData gpsData) {
        List<ObdAlertDTO> alerts = obdAnalysisService.computeAlerts(
                gpsData.getFuelLevel(),
                gpsData.getEngineTemperature(),
                gpsData.getBatteryVoltage(),
                gpsData.getCheckEngineOn()
        );

        if (alerts == null || alerts.isEmpty()) {
            return;
        }

        ObdAlertDTO selectedAlert = selectMostImportantAlert(alerts);

        if (selectedAlert == null) {
            return;
        }

        EventSeverity severity = mapSeverity(selectedAlert.getSeverity());

        if (severity != EventSeverity.CRITICAL && severity != EventSeverity.WARNING) {
            return;
        }

        createEventIfAllowed(
                gpsData,
                mapAlertCodeToEventType(selectedAlert.getCode()),
                severity,
                selectedAlert.getMessage()
        );
    }

    private ObdAlertDTO selectMostImportantAlert(List<ObdAlertDTO> alerts) {
        Optional<ObdAlertDTO> critical = alerts.stream()
                .filter(alert -> "CRITICAL".equalsIgnoreCase(alert.getSeverity()))
                .findFirst();

        if (critical.isPresent()) {
            return critical.get();
        }

        return alerts.stream()
                .filter(alert -> "WARNING".equalsIgnoreCase(alert.getSeverity()))
                .findFirst()
                .orElse(null);
    }

    private void generateHealthStateEvent(
            GpsData gpsData,
            VehicleHealthState healthState,
            String healthReason
    ) {
        if (healthState == null) {
            return;
        }

        if (healthState == VehicleHealthState.BREAKDOWN) {
            createEventIfAllowed(
                    gpsData,
                    VehicleEventType.ENGINE_FAILURE,
                    EventSeverity.CRITICAL,
                    healthReason != null && !healthReason.isBlank()
                            ? healthReason
                            : "Panne moteur probable"
            );
            return;
        }

        if (healthState == VehicleHealthState.MISSION_INTERRUPTED) {
            createEventIfAllowed(
                    gpsData,
                    VehicleEventType.MISSION_INTERRUPTED,
                    EventSeverity.CRITICAL,
                    healthReason != null && !healthReason.isBlank()
                            ? healthReason
                            : "Mission interrompue"
            );
        }
    }

    private void createEventIfAllowed(
            GpsData gpsData,
            VehicleEventType eventType,
            EventSeverity severity,
            String message
    ) {
        Vehicle vehicle = gpsData.getVehicle();

        if (vehicle == null || vehicle.getId() == null || eventType == null || severity == null) {
            return;
        }

        LocalDateTime now = LocalDateTime.now();

        Optional<VehicleEvent> lastOpt = findLastSimilarEvent(
                vehicle.getId(),
                gpsData.getMissionId(),
                eventType
        );

        if (lastOpt.isPresent()) {
            VehicleEvent last = lastOpt.get();

            boolean sameSeverity = last.getSeverity() == severity;
            long minutes = Duration.between(last.getCreatedAt(), now).toMinutes();

            if (sameSeverity && minutes < OBD_EVENT_COOLDOWN_MINUTES) {
                return;
            }
        }

        VehicleEvent event = new VehicleEvent();
        event.setVehicle(vehicle);
        event.setMissionId(gpsData.getMissionId());
        event.setEventType(eventType);
        event.setSeverity(severity);
        event.setMessage(message);
        event.setLatitude(gpsData.getLatitude());
        event.setLongitude(gpsData.getLongitude());
        event.setSpeed(gpsData.getSpeed());
        event.setCreatedAt(now);
        event.setAcknowledged(false);

        VehicleEvent saved = eventRepository.save(event);



        gpsWebSocketPublisher.publishEvent(toDto(saved));

        notifyOwnerIfCritical(saved);
    }

    private Optional<VehicleEvent> findLastSimilarEvent(
            Long vehicleId,
            Long missionId,
            VehicleEventType eventType
    ) {
        if (missionId != null) {
            return eventRepository.findTopByVehicleIdAndMissionIdAndEventTypeOrderByCreatedAtDesc(
                    vehicleId,
                    missionId,
                    eventType
            );
        }

        return eventRepository.findTopByVehicleIdAndMissionIdIsNullAndEventTypeOrderByCreatedAtDesc(
                vehicleId,
                eventType
        );
    }

    private VehicleEventType mapAlertCodeToEventType(String code) {
        if (code == null || code.isBlank()) {
            return VehicleEventType.OBD_CHECK_ENGINE;
        }

        if (code.startsWith("LOW_FUEL")) {
            return VehicleEventType.OBD_LOW_FUEL;
        }

        if (code.startsWith("HIGH_TEMP")) {
            return VehicleEventType.OBD_HIGH_TEMP;
        }

        if (code.startsWith("LOW_BATTERY")) {
            return VehicleEventType.OBD_LOW_BATTERY;
        }

        if ("CHECK_ENGINE_ON".equals(code)) {
            return VehicleEventType.OBD_CHECK_ENGINE;
        }

        return VehicleEventType.OBD_CHECK_ENGINE;
    }

    private EventSeverity mapSeverity(String severity) {
        if ("CRITICAL".equalsIgnoreCase(severity)) {
            return EventSeverity.CRITICAL;
        }

        if ("WARNING".equalsIgnoreCase(severity)) {
            return EventSeverity.WARNING;
        }

        return EventSeverity.INFO;
    }

    private void notifyOwnerIfCritical(VehicleEvent event) {
        if (event == null || event.getVehicle() == null) {
            return;
        }

        if (event.getSeverity() != EventSeverity.CRITICAL) {
            return;
        }

        if (event.getVehicle().getOwner() == null) {
            return;
        }

        notificationService.createUniqueForUser(
                event.getVehicle().getOwner().getId(),
                event.getEventType().name(),
                event.getMessage(),
                event.getMissionId()
        );
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
}