package com.example.fleet_backend.service;

import com.example.fleet_backend.dto.IncidentCreateRequest;
import com.example.fleet_backend.dto.IncidentDTO;
import com.example.fleet_backend.dto.IncidentFromEventRequest;
import com.example.fleet_backend.dto.IncidentHistoryDTO;
import com.example.fleet_backend.dto.IncidentUpdateStatusRequest;
import com.example.fleet_backend.model.*;
import com.example.fleet_backend.repository.*;
import com.example.fleet_backend.security.AuthUtil;
import com.example.fleet_backend.service.websocket.IncidentWebSocketPublisher;
import com.example.fleet_backend.websocket.DashboardWebSocketPublisher;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class IncidentService {

    private final IncidentRepository incidentRepository;
    private final VehicleRepository vehicleRepository;
    private final MissionRepository missionRepository;
    private final VehicleEventRepository vehicleEventRepository;
    private final VehicleAccessService vehicleAccessService;
    private final IncidentWebSocketPublisher incidentWebSocketPublisher;
    private final IncidentPhotoRepository incidentPhotoRepository;
    private final IncidentHistoryRepository incidentHistoryRepository;
    private final VehicleStatusService vehicleStatusService;
    private final DashboardWebSocketPublisher dashboardWebSocketPublisher;

    public IncidentService(
            IncidentRepository incidentRepository,
            VehicleRepository vehicleRepository,
            MissionRepository missionRepository,
            VehicleEventRepository vehicleEventRepository,
            VehicleAccessService vehicleAccessService,
            IncidentWebSocketPublisher incidentWebSocketPublisher,
            IncidentPhotoRepository incidentPhotoRepository,
            IncidentHistoryRepository incidentHistoryRepository,
            VehicleStatusService vehicleStatusService,
            DashboardWebSocketPublisher dashboardWebSocketPublisher
    ) {
        this.incidentRepository = incidentRepository;
        this.vehicleRepository = vehicleRepository;
        this.missionRepository = missionRepository;
        this.vehicleEventRepository = vehicleEventRepository;
        this.vehicleAccessService = vehicleAccessService;
        this.incidentWebSocketPublisher = incidentWebSocketPublisher;
        this.incidentPhotoRepository = incidentPhotoRepository;
        this.incidentHistoryRepository = incidentHistoryRepository;
        this.vehicleStatusService = vehicleStatusService;
        this.dashboardWebSocketPublisher = dashboardWebSocketPublisher;
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
        incident.setStatus(IncidentStatus.OPEN);
        incident.setSource(resolveManualSource(auth));

        incident.setReportedByUserId(AuthUtil.userId(auth));
        incident.setReportedByEmail(AuthUtil.email(auth));

        incident.setLatitude(request.getLatitude());
        incident.setLongitude(request.getLongitude());
        incident.setLocationName(request.getLocationName());
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

            incident.setMission(mission);

            if (mission.getVehicle() != null) {
                if (!AuthUtil.isDriver(auth)) {
                    vehicleAccessService.assertCanAccessVehicle(mission.getVehicle().getId());
                }

                incident.setVehicle(mission.getVehicle());
            }
        }

        Incident saved = incidentRepository.save(incident);

        addHistory(
                saved,
                "INCIDENT_CREATED",
                null,
                saved.getStatus(),
                AuthUtil.userId(auth),
                AuthUtil.email(auth),
                "Incident déclaré manuellement"
        );

        if (saved.getVehicle() != null) {
            vehicleStatusService.recalculateVehicleStatus(saved.getVehicle().getId());
        }

        IncidentDTO dto = toDTO(saved);

        incidentWebSocketPublisher.publishIncident(dto);
        publishDashboard(saved);

        return dto;
    }

    @Transactional
    public IncidentDTO createManualIncidentWithPhotos(
            IncidentCreateRequest request,
            List<MultipartFile> photos,
            Authentication auth
    ) {
        IncidentDTO createdDto = createManualIncident(request, auth);

        Incident incident = incidentRepository.findById(createdDto.getId())
                .orElseThrow(() -> new RuntimeException("Incident introuvable"));

        if (photos != null && !photos.isEmpty()) {
            List<String> savedPhotoUrls = new ArrayList<>();

            for (MultipartFile photo : photos) {
                if (photo == null || photo.isEmpty()) {
                    continue;
                }

                String photoUrl = saveIncidentPhoto(photo, incident.getId());
                savedPhotoUrls.add(photoUrl);

                IncidentPhoto incidentPhoto = new IncidentPhoto();
                incidentPhoto.setIncident(incident);
                incidentPhoto.setPhotoUrl(photoUrl);

                incidentPhotoRepository.save(incidentPhoto);
            }

            if (!savedPhotoUrls.isEmpty() && incident.getPhotoUrl() == null) {
                incident.setPhotoUrl(savedPhotoUrls.get(0));
                incidentRepository.save(incident);
            }
        }

        IncidentDTO dto = toDTO(incident);

        incidentWebSocketPublisher.publishIncident(dto);
        publishDashboard(incident);

        return dto;
    }

    @Transactional
    public IncidentDTO confirmEventAsIncident(
            IncidentFromEventRequest request,
            Authentication auth
    ) {
        if (incidentRepository.existsByVehicleEventId(request.getVehicleEventId())) {
            Incident existing = incidentRepository.findByVehicleEventId(request.getVehicleEventId())
                    .orElseThrow(() -> new RuntimeException("Incident existant introuvable"));

            return toDTO(existing);
        }

        VehicleEvent event = vehicleEventRepository.findById(request.getVehicleEventId())
                .orElseThrow(() -> new RuntimeException("Event véhicule introuvable"));

        if (event.getVehicle() == null) {
            throw new RuntimeException("Event sans véhicule");
        }

        assertCanConfirmEventAsIncident(event, auth);

        Incident incident = new Incident();

        incident.setTitle(
                request.getTitle() != null && !request.getTitle().isBlank()
                        ? request.getTitle()
                        : "Incident confirmé depuis une alerte"
        );

        incident.setDescription(request.getDescription());
        incident.setType(request.getType());
        incident.setSeverity(Boolean.TRUE.equals(request.getEmergency())
                ? IncidentSeverity.CRITICAL
                : request.getSeverity());

        incident.setStatus(IncidentStatus.OPEN);
        incident.setSource(resolveManualSource(auth));

        incident.setVehicle(event.getVehicle());
        incident.setVehicleEvent(event);

        incident.setLatitude(event.getLatitude());
        incident.setLongitude(event.getLongitude());
        incident.setLocationName(null);

        incident.setReportedByUserId(AuthUtil.userId(auth));
        incident.setReportedByEmail(AuthUtil.email(auth));
        incident.setEmergency(Boolean.TRUE.equals(request.getEmergency()));

        if (event.getMissionId() != null) {
            missionRepository.findById(event.getMissionId()).ifPresent(incident::setMission);
        }

        Incident saved = incidentRepository.save(incident);

        addHistory(
                saved,
                "INCIDENT_CREATED_FROM_EVENT",
                null,
                saved.getStatus(),
                AuthUtil.userId(auth),
                AuthUtil.email(auth),
                "Incident confirmé depuis une alerte GPS/OBD"
        );

        if (saved.getVehicle() != null) {
            vehicleStatusService.recalculateVehicleStatus(saved.getVehicle().getId());
        }

        IncidentDTO dto = toDTO(saved);

        incidentWebSocketPublisher.publishIncident(dto);
        publishDashboard(saved);

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
    public List<IncidentDTO> getMyIncidents(Authentication auth) {
        Long userId = AuthUtil.userId(auth);

        if (userId == null) {
            throw new RuntimeException("Utilisateur non authentifié");
        }

        return incidentRepository.findByReportedByUserIdOrderByCreatedAtDesc(userId)
                .stream()
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

        validateStatusTransition(incident.getStatus(), newStatus);

        IncidentStatus oldStatus = incident.getStatus();
        incident.setStatus(newStatus);
        incident.setHandledByUserId(AuthUtil.userId(auth));
        incident.setHandledByEmail(AuthUtil.email(auth));

        if (newStatus == IncidentStatus.IN_PROGRESS && incident.getValidatedAt() == null) {
            incident.setValidatedAt(LocalDateTime.now());
        }

        if (newStatus == IncidentStatus.RESOLVED || newStatus == IncidentStatus.CLOSED) {
            incident.setResolvedAt(LocalDateTime.now());
        }

        Incident saved = incidentRepository.save(incident);

        addHistory(
                saved,
                "STATUS_CHANGED",
                oldStatus,
                newStatus,
                AuthUtil.userId(auth),
                AuthUtil.email(auth),
                "Statut modifié de " + oldStatus + " vers " + newStatus
        );

        if (saved.getVehicle() != null) {
            vehicleStatusService.recalculateVehicleStatus(saved.getVehicle().getId());
        }

        IncidentDTO dto = toDTO(saved);

        incidentWebSocketPublisher.publishIncident(dto);
        publishDashboard(saved);

        return dto;
    }

    private void publishDashboard(Incident incident) {
        if (
                incident != null &&
                        incident.getVehicle() != null &&
                        incident.getVehicle().getOwner() != null
        ) {
            dashboardWebSocketPublisher.publishOwnerKpi(
                    incident.getVehicle().getOwner().getId()
            );
        }
    }

    private void assertCanConfirmEventAsIncident(VehicleEvent event, Authentication auth) {
        if (AuthUtil.isAdmin(auth)) return;

        if (event == null || event.getVehicle() == null) {
            throw new RuntimeException("Event invalide");
        }

        if (AuthUtil.isOwner(auth)) {
            vehicleAccessService.assertCanAccessVehicle(event.getVehicle().getId());
            return;
        }

        if (AuthUtil.isDriver(auth)) {
            String currentEmail = AuthUtil.email(auth);

            if (currentEmail == null) {
                throw new RuntimeException("Utilisateur non authentifié");
            }

            if (event.getMissionId() == null) {
                throw new RuntimeException("Event sans mission");
            }

            Mission mission = missionRepository.findById(event.getMissionId())
                    .orElseThrow(() -> new RuntimeException("Mission introuvable"));

            if (mission.getDriver() == null) {
                throw new RuntimeException("Mission sans driver");
            }

            if (
                    mission.getDriver().getEmail() != null &&
                            mission.getDriver().getEmail().equalsIgnoreCase(currentEmail)
            ) {
                return;
            }

            throw new RuntimeException("Le driver ne peut confirmer que ses propres missions");
        }

        throw new RuntimeException("Accès refusé");
    }

    private IncidentSource resolveManualSource(Authentication auth) {
        if (AuthUtil.isOwner(auth)) {
            return IncidentSource.OWNER;
        }

        return IncidentSource.DRIVER;
    }

    private void validateStatusTransition(IncidentStatus currentStatus, IncidentStatus newStatus) {
        if (currentStatus == null || newStatus == null) {
            throw new IllegalArgumentException("Statut incident invalide.");
        }

        if (currentStatus == IncidentStatus.CLOSED) {
            throw new IllegalStateException("Un incident clôturé ne peut plus être modifié.");
        }

        boolean validTransition = switch (currentStatus) {
            case OPEN -> newStatus == IncidentStatus.OPEN
                    || newStatus == IncidentStatus.IN_PROGRESS
                    || newStatus == IncidentStatus.RESOLVED
                    || newStatus == IncidentStatus.CLOSED;

            case IN_PROGRESS -> newStatus == IncidentStatus.IN_PROGRESS
                    || newStatus == IncidentStatus.RESOLVED
                    || newStatus == IncidentStatus.CLOSED;

            case RESOLVED -> newStatus == IncidentStatus.RESOLVED
                    || newStatus == IncidentStatus.CLOSED
                    || newStatus == IncidentStatus.IN_PROGRESS;

            case CLOSED -> false;
        };

        if (!validTransition) {
            throw new IllegalStateException(
                    "Transition de statut invalide : " + currentStatus + " -> " + newStatus
            );
        }
    }

    private boolean canCurrentUserSeeIncident(Incident incident, Authentication auth) {
        if (AuthUtil.isAdmin(auth)) {
            return true;
        }

        Long currentUserId = AuthUtil.userId(auth);

        if (currentUserId == null) {
            return false;
        }

        if (AuthUtil.isDriver(auth)
                && incident.getReportedByUserId() != null
                && incident.getReportedByUserId().equals(currentUserId)) {
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

    private String saveIncidentPhoto(MultipartFile photo, Long incidentId) {
        try {
            String contentType = photo.getContentType();

            if (contentType == null || !contentType.startsWith("image/")) {
                throw new RuntimeException("Le fichier doit être une image");
            }

            long maxSize = 5 * 1024 * 1024;

            if (photo.getSize() > maxSize) {
                throw new RuntimeException("La photo ne doit pas dépasser 5MB");
            }

            String originalName = photo.getOriginalFilename();
            String extension = ".jpg";

            if (originalName != null && originalName.contains(".")) {
                extension = originalName.substring(originalName.lastIndexOf(".")).toLowerCase();
            }

            String fileName = "incident-" + incidentId + "-" + UUID.randomUUID() + extension;

            Path uploadDir = Paths.get("uploads", "incidents");

            if (!Files.exists(uploadDir)) {
                Files.createDirectories(uploadDir);
            }

            Path filePath = uploadDir.resolve(fileName);

            Files.copy(photo.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            return "/uploads/incidents/" + fileName;

        } catch (Exception e) {
            throw new RuntimeException("Erreur upload photo incident: " + e.getMessage());
        }
    }

    private IncidentDTO toDTO(Incident incident) {
        Vehicle vehicle = incident.getVehicle();
        Mission mission = incident.getMission();
        VehicleEvent event = incident.getVehicleEvent();

        List<String> photoUrls = incidentPhotoRepository
                .findByIncidentIdOrderByCreatedAtAsc(incident.getId())
                .stream()
                .map(IncidentPhoto::getPhotoUrl)
                .toList();

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
                incident.getEmergency(),
                incident.getPhotoUrl(),
                incident.getLocationName(),
                photoUrls
        );
    }

    private void addHistory(
            Incident incident,
            String action,
            IncidentStatus oldStatus,
            IncidentStatus newStatus,
            Long userId,
            String userEmail,
            String comment
    ) {
        IncidentHistory history = new IncidentHistory();
        history.setIncident(incident);
        history.setAction(action);
        history.setOldStatus(oldStatus);
        history.setNewStatus(newStatus);
        history.setUserId(userId);
        history.setUserEmail(userEmail);
        history.setComment(comment);

        incidentHistoryRepository.save(history);
    }

    @Transactional(readOnly = true)
    public List<IncidentHistoryDTO> getIncidentHistory(Long incidentId, Authentication auth) {
        Incident incident = incidentRepository.findById(incidentId)
                .orElseThrow(() -> new RuntimeException("Incident introuvable"));

        if (!canCurrentUserSeeIncident(incident, auth)) {
            throw new RuntimeException("Accès refusé à cet incident");
        }

        return incidentHistoryRepository.findByIncidentIdOrderByCreatedAtAsc(incidentId)
                .stream()
                .map(this::toHistoryDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<IncidentHistoryDTO> getLatestIncidentHistories(Authentication auth) {
        return incidentHistoryRepository.findTop100ByOrderByCreatedAtDesc()
                .stream()
                .filter(history -> history.getIncident() != null)
                .filter(history -> canCurrentUserSeeIncident(history.getIncident(), auth))
                .map(this::toHistoryDTO)
                .toList();
    }

    private IncidentHistoryDTO toHistoryDTO(IncidentHistory history) {
        Incident incident = history.getIncident();

        return new IncidentHistoryDTO(
                history.getId(),
                incident != null ? incident.getId() : null,
                history.getAction(),
                history.getOldStatus(),
                history.getNewStatus(),
                history.getUserId(),
                history.getUserEmail(),
                history.getComment(),
                history.getCreatedAt()
        );
    }
}