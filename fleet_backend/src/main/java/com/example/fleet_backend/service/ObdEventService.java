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

@Service
@Transactional
public class ObdEventService {

    private static final long OBD_EVENT_COOLDOWN_MINUTES = 10;

    private final VehicleEventRepository eventRepository;
    private final ObdAnalysisService obdAnalysisService;
    private final NotificationService notificationService;
    private final GpsWebSocketPublisher gpsWebSocketPublisher;
    private final IncidentAutomationService incidentAutomationService;

    public ObdEventService(
            VehicleEventRepository eventRepository,
            ObdAnalysisService obdAnalysisService,
            NotificationService notificationService,
            GpsWebSocketPublisher gpsWebSocketPublisher,
            IncidentAutomationService incidentAutomationService
    ) {
        this.eventRepository = eventRepository;
        this.obdAnalysisService = obdAnalysisService;
        this.notificationService = notificationService;
        this.gpsWebSocketPublisher = gpsWebSocketPublisher;
        this.incidentAutomationService = incidentAutomationService;
    }

    public void generateEvents(
            GpsData gpsData,
            VehicleHealthState healthState,
            String healthReason
    ) {
        if (gpsData == null || gpsData.getVehicle() == null) {
            return;
        }

        List<ObdAlertDTO> alerts = obdAnalysisService.computeAlerts(
                gpsData.getFuelLevel(),
                gpsData.getEngineTemperature(),
                gpsData.getBatteryVoltage(),
                gpsData.getCheckEngineOn()
        );

        for (ObdAlertDTO alert : alerts) {
            EventSeverity severity = mapSeverity(alert.getSeverity());

            if (severity != EventSeverity.CRITICAL && severity != EventSeverity.WARNING) {
                continue;
            }

            createEventIfAllowed(
                    gpsData,
                    mapAlertCodeToEventType(alert.getCode()),
                    severity,
                    alert.getMessage()
            );
        }

        if (healthState == VehicleHealthState.BREAKDOWN) {
            createEventIfAllowed(
                    gpsData,
                    VehicleEventType.ENGINE_FAILURE,
                    EventSeverity.CRITICAL,
                    healthReason != null ? healthReason : "Panne moteur probable"
            );
        }

        if (healthState == VehicleHealthState.MISSION_INTERRUPTED) {
            createEventIfAllowed(
                    gpsData,
                    VehicleEventType.MISSION_INTERRUPTED,
                    EventSeverity.CRITICAL,
                    healthReason != null ? healthReason : "Mission interrompue"
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
        LocalDateTime now = LocalDateTime.now();

        var lastOpt = eventRepository.findTopByVehicleIdAndEventTypeOrderByCreatedAtDesc(
                vehicle.getId(),
                eventType
        );

        if (lastOpt.isPresent()) {
            VehicleEvent last = lastOpt.get();

            boolean sameMission = gpsData.getMissionId() == null
                    ? last.getMissionId() == null
                    : gpsData.getMissionId().equals(last.getMissionId());

            boolean sameSeverity = last.getSeverity() == severity;

            long minutes = Duration.between(last.getCreatedAt(), now).toMinutes();

            if (sameMission && sameSeverity && minutes < OBD_EVENT_COOLDOWN_MINUTES) {
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

        incidentAutomationService.createIncidentIfNeeded(saved);

        gpsWebSocketPublisher.publishEvent(toDto(saved));
        notifyOwnerIfCritical(saved);
    }

    private VehicleEventType mapAlertCodeToEventType(String code) {
        if (code == null) return VehicleEventType.OBD_CHECK_ENGINE;

        if (code.startsWith("LOW_FUEL")) return VehicleEventType.OBD_LOW_FUEL;
        if (code.startsWith("HIGH_TEMP")) return VehicleEventType.OBD_HIGH_TEMP;
        if (code.startsWith("LOW_BATTERY")) return VehicleEventType.OBD_LOW_BATTERY;
        if (code.equals("CHECK_ENGINE_ON")) return VehicleEventType.OBD_CHECK_ENGINE;

        return VehicleEventType.OBD_CHECK_ENGINE;
    }

    private EventSeverity mapSeverity(String severity) {
        if ("CRITICAL".equalsIgnoreCase(severity)) return EventSeverity.CRITICAL;
        if ("WARNING".equalsIgnoreCase(severity)) return EventSeverity.WARNING;
        return EventSeverity.INFO;
    }

    private void notifyOwnerIfCritical(VehicleEvent event) {
        if (event == null || event.getVehicle() == null) return;
        if (event.getSeverity() != EventSeverity.CRITICAL) return;
        if (event.getVehicle().getOwner() == null) return;

        notificationService.createUniqueForUser(
                event.getVehicle().getOwner().getId(),
                "ALERTE_CRITIQUE_VEHICULE",
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