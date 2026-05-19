package com.example.fleet_backend.service;

import com.example.fleet_backend.dto.MaintenanceCreateRequest;
import com.example.fleet_backend.dto.MaintenanceDTO;
import com.example.fleet_backend.dto.MaintenanceUpdateStatusRequest;
import com.example.fleet_backend.model.*;
import com.example.fleet_backend.repository.IncidentRepository;
import com.example.fleet_backend.repository.MaintenanceRepository;
import com.example.fleet_backend.repository.MissionRepository;
import com.example.fleet_backend.repository.VehicleRepository;
import com.example.fleet_backend.security.AuthUtil;
import com.example.fleet_backend.websocket.DashboardWebSocketPublisher;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class MaintenanceService {

    private final MaintenanceRepository maintenanceRepository;
    private final VehicleRepository vehicleRepository;
    private final VehicleAccessService vehicleAccessService;
    private final IncidentRepository incidentRepository;
    private final VehicleStatusService vehicleStatusService;
    private final MissionRepository missionRepository;
    private final ObdResolutionService obdResolutionService;
    private final DashboardWebSocketPublisher dashboardWebSocketPublisher;

    public MaintenanceService(
            MaintenanceRepository maintenanceRepository,
            VehicleRepository vehicleRepository,
            VehicleAccessService vehicleAccessService,
            IncidentRepository incidentRepository,
            VehicleStatusService vehicleStatusService,
            MissionRepository missionRepository,
            ObdResolutionService obdResolutionService,
            DashboardWebSocketPublisher dashboardWebSocketPublisher
    ) {
        this.maintenanceRepository = maintenanceRepository;
        this.vehicleRepository = vehicleRepository;
        this.vehicleAccessService = vehicleAccessService;
        this.incidentRepository = incidentRepository;
        this.vehicleStatusService = vehicleStatusService;
        this.missionRepository = missionRepository;
        this.obdResolutionService = obdResolutionService;
        this.dashboardWebSocketPublisher = dashboardWebSocketPublisher;
    }

    @Transactional
    public List<MaintenanceDTO> getLatestMaintenances(Authentication auth) {
        markOverdueMaintenances();

        return maintenanceRepository.findTop50ByOrderByCreatedAtDesc()
                .stream()
                .filter(m -> canCurrentUserSeeMaintenance(m, auth))
                .map(this::toDTO)
                .toList();
    }

    @Transactional
    public MaintenanceDTO getMaintenanceById(Long id, Authentication auth) {
        markOverdueMaintenances();

        Maintenance maintenance = maintenanceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Maintenance introuvable"));

        if (!canCurrentUserSeeMaintenance(maintenance, auth)) {
            throw new RuntimeException("Accès refusé à cette maintenance");
        }

        return toDTO(maintenance);
    }

    @Transactional
    public List<MaintenanceDTO> getMaintenancesByVehicle(Long vehicleId) {
        markOverdueMaintenances();

        vehicleAccessService.assertCanAccessVehicle(vehicleId);

        return maintenanceRepository.findByVehicleIdOrderByCreatedAtDesc(vehicleId)
                .stream()
                .map(this::toDTO)
                .toList();
    }

    @Transactional
    public List<MaintenanceDTO> getMaintenancesByStatus(MaintenanceStatus status, Authentication auth) {
        markOverdueMaintenances();

        return maintenanceRepository.findByStatusOrderByCreatedAtDesc(status)
                .stream()
                .filter(m -> canCurrentUserSeeMaintenance(m, auth))
                .map(this::toDTO)
                .toList();
    }

    @Transactional
    public List<MaintenanceDTO> getUpcomingMaintenances(Authentication auth) {
        markOverdueMaintenances();

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime next30Days = now.plusDays(30);

        return maintenanceRepository
                .findByStatusAndPlannedDateBetweenOrderByPlannedDateAsc(
                        MaintenanceStatus.PLANNED,
                        now,
                        next30Days
                )
                .stream()
                .filter(m -> canCurrentUserSeeMaintenance(m, auth))
                .map(this::toDTO)
                .toList();
    }

    @Transactional
    public MaintenanceDTO createMaintenance(MaintenanceCreateRequest request, Authentication auth) {
        assertOwnerOrAdmin(auth);

        if (request.getVehicleId() == null) {
            throw new IllegalArgumentException("Véhicule obligatoire.");
        }

        vehicleAccessService.assertCanAccessVehicle(request.getVehicleId());

        Vehicle vehicle = vehicleRepository.findById(request.getVehicleId())
                .orElseThrow(() -> new RuntimeException("Véhicule introuvable"));

        Maintenance maintenance = new Maintenance();

        maintenance.setVehicle(vehicle);
        maintenance.setType(request.getType());
        maintenance.setTitle(request.getTitle());
        maintenance.setDescription(request.getDescription());

        MaintenanceStatus status = request.getStatus() != null
                ? request.getStatus()
                : MaintenanceStatus.PLANNED;

        MaintenancePriority priority = request.getPriority() != null
                ? request.getPriority()
                : MaintenancePriority.MEDIUM;

        maintenance.setStatus(status);
        maintenance.setPriority(priority);
        maintenance.setMaintenanceDate(request.getMaintenanceDate());
        maintenance.setPlannedDate(request.getPlannedDate());
        maintenance.setMileage(request.getMileage());
        maintenance.setCost(request.getCost());

        maintenance.setCreatedByUserId(AuthUtil.userId(auth));
        maintenance.setCreatedByEmail(AuthUtil.email(auth));

        if (request.getIncidentId() != null) {
            Incident incident = incidentRepository.findById(request.getIncidentId())
                    .orElseThrow(() -> new RuntimeException("Incident introuvable"));

            if (incident.getVehicle() == null) {
                throw new RuntimeException("Incident sans véhicule");
            }

            if (!incident.getVehicle().getId().equals(vehicle.getId())) {
                throw new RuntimeException("La maintenance doit être liée au même véhicule que l'incident");
            }

            if (maintenanceRepository.existsByIncidentId(incident.getId())) {
                throw new RuntimeException("Une maintenance est déjà liée à cet incident");
            }

            maintenance.setIncident(incident);

            if (incident.getStatus() == IncidentStatus.OPEN) {
                incident.setStatus(IncidentStatus.IN_PROGRESS);
                incident.setValidatedAt(LocalDateTime.now());
                incident.setHandledByUserId(AuthUtil.userId(auth));
                incident.setHandledByEmail(AuthUtil.email(auth));
            }
        }

        if (status == MaintenanceStatus.DONE) {
            maintenance.setCompletedAt(LocalDateTime.now());

            if (maintenance.getMaintenanceDate() == null) {
                maintenance.setMaintenanceDate(LocalDateTime.now());
            }

            vehicle.setLastMaintenanceDate(LocalDateTime.now());

            if (maintenance.getIncident() != null) {
                Incident incident = maintenance.getIncident();
                incident.setStatus(IncidentStatus.RESOLVED);
                incident.setResolvedAt(LocalDateTime.now());
                incident.setHandledByUserId(AuthUtil.userId(auth));
                incident.setHandledByEmail(AuthUtil.email(auth));
            }

            obdResolutionService.resolveAfterMaintenanceDone(maintenance);
        }

        Maintenance saved = maintenanceRepository.save(maintenance);

        if (saved.getVehicle() != null) {
            vehicleStatusService.recalculateVehicleStatus(saved.getVehicle().getId());
        }

        publishDashboard(saved);

        return toDTO(saved);
    }

    @Transactional
    public MaintenanceDTO createFromIncident(Long incidentId, Authentication auth) {
        assertOwnerOrAdmin(auth);

        Incident incident = incidentRepository.findById(incidentId)
                .orElseThrow(() -> new RuntimeException("Incident introuvable"));

        if (incident.getStatus() != IncidentStatus.OPEN) {
            throw new RuntimeException("Une maintenance ne peut être créée que pour un incident OPEN");
        }

        if (incident.getVehicle() == null) {
            throw new RuntimeException("Impossible de créer une maintenance : incident sans véhicule");
        }

        Vehicle vehicle = incident.getVehicle();

        vehicleAccessService.assertCanAccessVehicle(vehicle.getId());

        if (maintenanceRepository.existsByIncidentId(incidentId)) {
            throw new RuntimeException("Une maintenance est déjà liée à cet incident");
        }

        Maintenance maintenance = new Maintenance();

        maintenance.setVehicle(vehicle);
        maintenance.setIncident(incident);
        maintenance.setStatus(MaintenanceStatus.PLANNED);
        maintenance.setPlannedDate(LocalDateTime.now().plusDays(1));

        applyIncidentMaintenanceRules(maintenance, incident);

        maintenance.setDescription(
                "Maintenance planifiée depuis l'incident #" + incident.getId()
                        + " - " + incident.getTitle()
        );

        maintenance.setCreatedByUserId(AuthUtil.userId(auth));
        maintenance.setCreatedByEmail(AuthUtil.email(auth));

        incident.setStatus(IncidentStatus.IN_PROGRESS);
        incident.setValidatedAt(LocalDateTime.now());
        incident.setHandledByUserId(AuthUtil.userId(auth));
        incident.setHandledByEmail(AuthUtil.email(auth));

        Maintenance saved = maintenanceRepository.save(maintenance);

        vehicleStatusService.recalculateVehicleStatus(vehicle.getId());

        publishDashboard(saved);

        return toDTO(saved);
    }

    @Transactional
    public MaintenanceDTO updateStatus(Long id, MaintenanceUpdateStatusRequest request, Authentication auth) {
        assertOwnerOrAdmin(auth);

        if (request == null || request.getStatus() == null) {
            throw new IllegalArgumentException("Le statut maintenance est obligatoire.");
        }

        Maintenance maintenance = maintenanceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Maintenance introuvable"));

        Vehicle vehicle = maintenance.getVehicle();

        if (vehicle != null) {
            vehicleAccessService.assertCanAccessVehicle(vehicle.getId());
        }

        MaintenanceStatus oldStatus = maintenance.getStatus();
        MaintenanceStatus newStatus = request.getStatus();

        validateStatusTransition(oldStatus, newStatus);

        if (newStatus == MaintenanceStatus.IN_PROGRESS && vehicle != null) {
            boolean vehicleOnMission =
                    missionRepository.existsByVehicleIdAndStatus(
                            vehicle.getId(),
                            Mission.MissionStatus.IN_PROGRESS
                    );

            if (vehicleOnMission) {
                throw new IllegalStateException(
                        "Impossible de démarrer cette maintenance : le véhicule est actuellement en mission."
                );
            }
        }

        maintenance.setStatus(newStatus);

        if (newStatus == MaintenanceStatus.IN_PROGRESS) {
            if (maintenance.getMaintenanceDate() == null) {
                maintenance.setMaintenanceDate(LocalDateTime.now());
            }
        }

        if (newStatus == MaintenanceStatus.DONE) {
            maintenance.setCompletedAt(LocalDateTime.now());

            if (maintenance.getMaintenanceDate() == null) {
                maintenance.setMaintenanceDate(LocalDateTime.now());
            }

            if (vehicle != null) {
                vehicle.setLastMaintenanceDate(LocalDateTime.now());
            }

            if (maintenance.getIncident() != null) {
                Incident incident = maintenance.getIncident();

                incident.setStatus(IncidentStatus.RESOLVED);
                incident.setResolvedAt(LocalDateTime.now());
                incident.setHandledByUserId(AuthUtil.userId(auth));
                incident.setHandledByEmail(AuthUtil.email(auth));
            }

            obdResolutionService.resolveAfterMaintenanceDone(maintenance);
        }

        Maintenance saved = maintenanceRepository.save(maintenance);

        if (vehicle != null) {
            vehicleStatusService.recalculateVehicleStatus(vehicle.getId());
        }

        publishDashboard(saved);

        return toDTO(saved);
    }

    @Transactional
    public MaintenanceDTO cancelMaintenance(Long id, Authentication auth) {
        assertOwnerOrAdmin(auth);

        Maintenance maintenance = maintenanceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Maintenance introuvable"));

        Vehicle vehicle = maintenance.getVehicle();

        if (vehicle != null) {
            vehicleAccessService.assertCanAccessVehicle(vehicle.getId());
        }

        if (maintenance.getStatus() == MaintenanceStatus.DONE) {
            throw new IllegalStateException("Une maintenance déjà effectuée ne peut pas être annulée.");
        }

        maintenance.setStatus(MaintenanceStatus.CANCELED);

        Maintenance saved = maintenanceRepository.save(maintenance);

        if (vehicle != null) {
            vehicleStatusService.recalculateVehicleStatus(vehicle.getId());
        }

        publishDashboard(saved);

        return toDTO(saved);
    }

    @Transactional
    public MaintenanceDTO getMaintenanceByIncident(Long incidentId, Authentication auth) {
        markOverdueMaintenances();

        return maintenanceRepository.findFirstByIncidentIdOrderByCreatedAtDesc(incidentId)
                .filter(m -> canCurrentUserSeeMaintenance(m, auth))
                .map(this::toDTO)
                .orElse(null);
    }

    @Transactional
    public void markOverdueMaintenances() {
        LocalDateTime now = LocalDateTime.now();

        List<Maintenance> overdueMaintenances =
                maintenanceRepository.findByStatusAndPlannedDateBefore(
                        MaintenanceStatus.PLANNED,
                        now
                );

        if (overdueMaintenances.isEmpty()) {
            return;
        }

        for (Maintenance maintenance : overdueMaintenances) {
            maintenance.setStatus(MaintenanceStatus.OVERDUE);
        }

        maintenanceRepository.saveAll(overdueMaintenances);

        for (Maintenance maintenance : overdueMaintenances) {
            if (maintenance.getVehicle() != null) {
                vehicleStatusService.recalculateVehicleStatus(maintenance.getVehicle().getId());
                publishDashboard(maintenance);
            }
        }
    }

    private void publishDashboard(Maintenance maintenance) {
        if (
                maintenance != null &&
                        maintenance.getVehicle() != null &&
                        maintenance.getVehicle().getOwner() != null
        ) {
            dashboardWebSocketPublisher.publishOwnerKpi(
                    maintenance.getVehicle().getOwner().getId()
            );
        }
    }

    private void applyIncidentMaintenanceRules(Maintenance maintenance, Incident incident) {
        if (incident.getType() == IncidentType.VEHICLE_BREAKDOWN) {
            maintenance.setType(MaintenanceType.REPAIR);
            maintenance.setPriority(MaintenancePriority.CRITICAL);
            maintenance.setTitle("Réparation suite à une panne véhicule");
            return;
        }

        if (incident.getType() == IncidentType.OBD_ALERT) {
            maintenance.setType(MaintenanceType.ENGINE_CHECK);
            maintenance.setPriority(
                    incident.getSeverity() == IncidentSeverity.CRITICAL
                            ? MaintenancePriority.HIGH
                            : MaintenancePriority.MEDIUM
            );
            maintenance.setTitle("Contrôle moteur suite à alerte OBD");
            return;
        }

        if (incident.getType() == IncidentType.ACCIDENT) {
            maintenance.setType(MaintenanceType.TECHNICAL_INSPECTION);
            maintenance.setPriority(MaintenancePriority.CRITICAL);
            maintenance.setTitle("Inspection véhicule après accident");
            return;
        }

        if (incident.getSeverity() == IncidentSeverity.CRITICAL) {
            maintenance.setType(MaintenanceType.OTHER);
            maintenance.setPriority(MaintenancePriority.HIGH);
            maintenance.setTitle("Maintenance urgente liée à un incident critique");
            return;
        }

        maintenance.setType(MaintenanceType.OTHER);
        maintenance.setPriority(MaintenancePriority.MEDIUM);
        maintenance.setTitle("Maintenance liée à incident");
    }

    private void validateStatusTransition(MaintenanceStatus currentStatus, MaintenanceStatus newStatus) {
        if (currentStatus == null || newStatus == null) {
            throw new IllegalArgumentException("Statut maintenance invalide.");
        }

        if (currentStatus == MaintenanceStatus.CANCELED) {
            throw new IllegalStateException("Une maintenance annulée ne peut plus être modifiée.");
        }

        if (currentStatus == MaintenanceStatus.DONE) {
            throw new IllegalStateException("Une maintenance terminée ne peut plus être modifiée.");
        }

        boolean validTransition = switch (currentStatus) {
            case PLANNED -> newStatus == MaintenanceStatus.PLANNED
                    || newStatus == MaintenanceStatus.IN_PROGRESS
                    || newStatus == MaintenanceStatus.DONE
                    || newStatus == MaintenanceStatus.OVERDUE
                    || newStatus == MaintenanceStatus.CANCELED;

            case OVERDUE -> newStatus == MaintenanceStatus.OVERDUE
                    || newStatus == MaintenanceStatus.IN_PROGRESS
                    || newStatus == MaintenanceStatus.DONE
                    || newStatus == MaintenanceStatus.CANCELED;

            case IN_PROGRESS -> newStatus == MaintenanceStatus.IN_PROGRESS
                    || newStatus == MaintenanceStatus.DONE
                    || newStatus == MaintenanceStatus.CANCELED;

            case DONE, CANCELED -> false;
        };

        if (!validTransition) {
            throw new IllegalStateException(
                    "Transition maintenance invalide : " + currentStatus + " -> " + newStatus
            );
        }
    }

    private boolean canCurrentUserSeeMaintenance(Maintenance maintenance, Authentication auth) {
        if (AuthUtil.isAdmin(auth)) {
            return true;
        }

        if (maintenance.getVehicle() == null) {
            return false;
        }

        try {
            vehicleAccessService.assertCanAccessVehicle(maintenance.getVehicle().getId());
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    private void assertOwnerOrAdmin(Authentication auth) {
        if (!AuthUtil.isAdmin(auth) && !AuthUtil.isOwner(auth)) {
            throw new RuntimeException("Seul ADMIN ou OWNER peut gérer les maintenances.");
        }
    }

    private MaintenanceDTO toDTO(Maintenance maintenance) {
        Vehicle vehicle = maintenance.getVehicle();
        Incident incident = maintenance.getIncident();
        MaintenanceWorkOrder workOrder = maintenance.getWorkOrder();

        return new MaintenanceDTO(
                maintenance.getId(),
                vehicle != null ? vehicle.getId() : null,
                vehicle != null ? vehicle.getRegistrationNumber() : null,
                maintenance.getType(),
                maintenance.getStatus(),
                maintenance.getPriority(),
                maintenance.getTitle(),
                maintenance.getDescription(),
                maintenance.getMaintenanceDate(),
                maintenance.getPlannedDate(),
                maintenance.getCompletedAt(),
                maintenance.getMileage(),
                maintenance.getCost(),
                maintenance.getCreatedByUserId(),
                maintenance.getCreatedByEmail(),
                maintenance.getCreatedAt(),
                maintenance.getUpdatedAt(),
                incident != null ? incident.getId() : null,
                incident != null ? incident.getTitle() : null,
                workOrder != null ? workOrder.getId() : null,
                workOrder != null ? workOrder.getTitle() : null
        );
    }
}