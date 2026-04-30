package com.example.fleet_backend.service;

import com.example.fleet_backend.dto.IncidentCreateRequest;
import com.example.fleet_backend.dto.IncidentDTO;
import com.example.fleet_backend.dto.IncidentUpdateStatusRequest;
import com.example.fleet_backend.model.*;
import com.example.fleet_backend.repository.IncidentRepository;
import com.example.fleet_backend.repository.MissionRepository;
import com.example.fleet_backend.repository.VehicleEventRepository;
import com.example.fleet_backend.repository.VehicleRepository;
import com.example.fleet_backend.security.AuthUtil;
import com.example.fleet_backend.service.websocket.IncidentWebSocketPublisher;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class IncidentService {

    private final IncidentRepository incidentRepository;
    private final VehicleRepository vehicleRepository;
    private final MissionRepository missionRepository;
    private final VehicleEventRepository vehicleEventRepository;
    private final VehicleAccessService vehicleAccessService;
    private final IncidentWebSocketPublisher incidentWebSocketPublisher;

    public IncidentService(
            IncidentRepository incidentRepository,
            VehicleRepository vehicleRepository,
            MissionRepository missionRepository,
            VehicleEventRepository vehicleEventRepository,
            VehicleAccessService vehicleAccessService,
            IncidentWebSocketPublisher incidentWebSocketPublisher
    ) {
        this.incidentRepository = incidentRepository;
        this.vehicleRepository = vehicleRepository;
        this.missionRepository = missionRepository;
        this.vehicleEventRepository = vehicleEventRepository;
        this.vehicleAccessService = vehicleAccessService;
        this.incidentWebSocketPublisher = incidentWebSocketPublisher;
    }

    @Transactional
    public IncidentDTO createManualIncident(IncidentCreateRequest request, Authentication auth) {
        if (request.getVehicleId() == null && request.getMissionId() == null) {
            throw new IllegalArgumentException("Un incident doit être lié à un véhicule ou à une mission.");
        }

        Incident incident = new Incident();
        incident.setTitle(request.getTitle());
        incident.setDescription(request.getDescription());
        incident.setType(request.getType());
        incident.setSeverity(Boolean.TRUE.equals(request.getEmergency())
                ? IncidentSeverity.CRITICAL
                : request.getSeverity());
        incident.setStatus(IncidentStatus.REPORTED);
        incident.setSource(IncidentSource.MANUAL);

        incident.setReportedByUserId(AuthUtil.userId(auth));
        incident.setReportedByEmail(AuthUtil.email(auth));

        incident.setLatitude(request.getLatitude());
        incident.setLongitude(request.getLongitude());
        incident.setEmergency(Boolean.TRUE.equals(request.getEmergency()));

        if (request.getVehicleId() != null) {
            vehicleAccessService.assertCanAccessVehicle(request.getVehicleId());

            Vehicle vehicle = vehicleRepository.findById(request.getVehicleId())
                    .orElseThrow(() -> new RuntimeException("Véhicule introuvable"));

            incident.setVehicle(vehicle);
        }

        if (request.getMissionId() != null) {
            Mission mission = missionRepository.findById(request.getMissionId())
                    .orElseThrow(() -> new RuntimeException("Mission introuvable"));

            if (!AuthUtil.isAdmin(auth) && !AuthUtil.isOwner(auth) && !AuthUtil.isDriver(auth)) {
                throw new RuntimeException("Accès refusé");
            }

            incident.setMission(mission);

            if (mission.getVehicle() != null) {
                incident.setVehicle(mission.getVehicle());
            }
        }

        IncidentDTO dto = toDTO(incidentRepository.save(incident));
        incidentWebSocketPublisher.publishIncident(dto);
        return dto;
    }

    @Transactional(readOnly = true)
    public List<IncidentDTO> getLatestIncidents(Authentication auth) {
        return incidentRepository.findTop50ByOrderByCreatedAtDesc()
                .stream()
                .filter(incident -> canCurrentUserSeeIncident(incident, auth))
                .map(this::toDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public IncidentDTO getIncidentById(Long id, Authentication auth) {
        Incident incident = incidentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Incident introuvable"));

        if (!canCurrentUserSeeIncident(incident, auth)) {
            throw new RuntimeException("Accès refusé à cet incident");
        }

        return toDTO(incident);
    }

    @Transactional(readOnly = true)
    public List<IncidentDTO> getIncidentsByVehicle(Long vehicleId) {
        vehicleAccessService.assertCanAccessVehicle(vehicleId);

        return incidentRepository.findByVehicleIdOrderByCreatedAtDesc(vehicleId)
                .stream()
                .map(this::toDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<IncidentDTO> getIncidentsByMission(Long missionId) {
        Mission mission = missionRepository.findById(missionId)
                .orElseThrow(() -> new RuntimeException("Mission introuvable"));

        if (mission.getVehicle() != null) {
            vehicleAccessService.assertCanAccessVehicle(mission.getVehicle().getId());
        }

        return incidentRepository.findByMissionIdOrderByCreatedAtDesc(missionId)
                .stream()
                .map(this::toDTO)
                .toList();
    }

    @Transactional
    public IncidentDTO updateStatus(Long id, IncidentUpdateStatusRequest request, Authentication auth) {
        Incident incident = incidentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Incident introuvable"));

        if (!AuthUtil.isAdmin(auth) && !AuthUtil.isOwner(auth)) {
            throw new RuntimeException("Seul ADMIN ou OWNER peut traiter un incident");
        }

        if (incident.getVehicle() != null) {
            vehicleAccessService.assertCanAccessVehicle(incident.getVehicle().getId());
        }

        IncidentStatus newStatus = request.getStatus();

        incident.setStatus(newStatus);
        incident.setHandledByUserId(AuthUtil.userId(auth));
        incident.setHandledByEmail(AuthUtil.email(auth));

        if (newStatus == IncidentStatus.VALIDATED) {
            incident.setValidatedAt(LocalDateTime.now());
        }

        if (newStatus == IncidentStatus.RESOLVED || newStatus == IncidentStatus.REJECTED) {
            incident.setResolvedAt(LocalDateTime.now());
        }

        IncidentDTO dto = toDTO(incidentRepository.save(incident));
        incidentWebSocketPublisher.publishIncident(dto);
        return dto;
    }

    @Transactional
    public IncidentDTO createIncidentFromEvent(
            Long vehicleEventId,
            IncidentType type,
            IncidentSeverity severity,
            String title,
            String description
    ) {
        if (incidentRepository.existsByVehicleEventId(vehicleEventId)) {
            Incident existing = incidentRepository.findByVehicleEventId(vehicleEventId)
                    .orElseThrow(() -> new RuntimeException("Incident existant introuvable"));

            return toDTO(existing);
        }

        VehicleEvent event = vehicleEventRepository.findById(vehicleEventId)
                .orElseThrow(() -> new RuntimeException("Event véhicule introuvable"));

        Incident incident = new Incident();
        incident.setTitle(title);
        incident.setDescription(description);
        incident.setType(type);
        incident.setSeverity(severity);
        incident.setStatus(IncidentStatus.REPORTED);
        incident.setSource(IncidentSource.SYSTEM);
        incident.setVehicleEvent(event);

        if (event.getVehicle() != null) {
            incident.setVehicle(event.getVehicle());
        }

        if (event.getMissionId() != null) {
            missionRepository.findById(event.getMissionId()).ifPresent(incident::setMission);
        }

        IncidentDTO dto = toDTO(incidentRepository.save(incident));
        incidentWebSocketPublisher.publishIncident(dto);
        return dto;
    }

    private boolean canCurrentUserSeeIncident(Incident incident, Authentication auth) {
        if (AuthUtil.isAdmin(auth)) {
            return true;
        }

        if (incident.getVehicle() == null) {
            return false;
        }

        try {
            vehicleAccessService.assertCanAccessVehicle(incident.getVehicle().getId());
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    private IncidentDTO toDTO(Incident incident) {
        Vehicle vehicle = incident.getVehicle();
        Mission mission = incident.getMission();
        VehicleEvent event = incident.getVehicleEvent();

        return new IncidentDTO(
                incident.getId(),
                incident.getTitle(),
                incident.getDescription(),
                incident.getType(),
                incident.getSeverity(),
                incident.getStatus(),
                incident.getSource(),

                vehicle != null ? vehicle.getId() : null,
                vehicle != null ? vehicle.getRegistrationNumber() : null,

                mission != null ? mission.getId() : null,
                mission != null ? mission.getTitle() : null,

                event != null ? event.getId() : null,

                incident.getReportedByUserId(),
                incident.getReportedByEmail(),
                incident.getHandledByUserId(),
                incident.getHandledByEmail(),

                incident.getReportedAt(),
                incident.getValidatedAt(),
                incident.getResolvedAt(),
                incident.getCreatedAt(),
                incident.getUpdatedAt(),

                incident.getGroupKey(),
                incident.getEventCount(),
                incident.getLastEventAt(),

                incident.getLatitude(),
                incident.getLongitude(),
                incident.getEmergency()
        );
    }
    @Transactional
    public IncidentDTO createOrUpdateActiveSystemIncidentFromEvent(
            VehicleEvent event,
            IncidentType type,
            IncidentSeverity severity,
            String title,
            String description,
            String groupKey
    ) {
        if (event == null || event.getId() == null || event.getVehicle() == null) {
            return null;
        }

        if (incidentRepository.existsByVehicleEventId(event.getId())) {
            return incidentRepository.findByVehicleEventId(event.getId())
                    .map(this::toDTO)
                    .orElse(null);
        }

        List<IncidentStatus> activeStatuses = List.of(
                IncidentStatus.REPORTED,
                IncidentStatus.VALIDATED,
                IncidentStatus.IN_PROGRESS
        );

        Incident incident = incidentRepository
                .findFirstByGroupKeyAndStatusInOrderByCreatedAtDesc(groupKey, activeStatuses)
                .orElse(null);

        if (incident == null) {
            incident = new Incident();
            incident.setTitle(title);
            incident.setDescription(description);
            incident.setType(type);
            incident.setSeverity(severity);
            incident.setStatus(IncidentStatus.REPORTED);
            incident.setSource(IncidentSource.SYSTEM);
            incident.setVehicle(event.getVehicle());
            incident.setVehicleEvent(event);
            incident.setGroupKey(groupKey);
            incident.setEventCount(1);
            incident.setLastEventAt(
                    event.getCreatedAt() != null ? event.getCreatedAt() : LocalDateTime.now()
            );

            if (event.getMissionId() != null) {
                missionRepository.findById(event.getMissionId()).ifPresent(incident::setMission);
            }
        } else {
            incident.setVehicleEvent(event);
            incident.setLastEventAt(event.getCreatedAt() != null ? event.getCreatedAt() : LocalDateTime.now());
            incident.setEventCount(incident.getEventCount() == null ? 2 : incident.getEventCount() + 1);

            if (isMoreSevere(severity, incident.getSeverity())) {
                incident.setSeverity(severity);
            }

            incident.setDescription(mergeDescription(
                    incident.getDescription(),
                    description,
                    event.getEventType() != null ? event.getEventType().name() : "EVENT"
            ));
        }

        IncidentDTO dto = toDTO(incidentRepository.save(incident));
        incidentWebSocketPublisher.publishIncident(dto);
        return dto;
    }
    private boolean isMoreSevere(IncidentSeverity candidate, IncidentSeverity current) {
        return severityRank(candidate) > severityRank(current);
    }

    private int severityRank(IncidentSeverity severity) {
        if (severity == null) return 0;

        return switch (severity) {
            case LOW -> 1;
            case MEDIUM -> 2;
            case HIGH -> 3;
            case CRITICAL -> 4;
        };
    }

    private String mergeDescription(String oldDescription, String newDescription, String eventCode) {
        String oldText = oldDescription == null ? "" : oldDescription;

        if (oldText.contains(eventCode)) {
            return oldText;
        }

        String line = "- " + eventCode + " : " + newDescription;

        if (oldText.isBlank()) {
            return line;
        }

        return oldText + "\n" + line;
    }
}