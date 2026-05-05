package com.example.fleet_backend.service;

import com.example.fleet_backend.dto.MaintenanceCreateRequest;
import com.example.fleet_backend.dto.MaintenanceDTO;
import com.example.fleet_backend.dto.MaintenanceUpdateStatusRequest;
import com.example.fleet_backend.model.Maintenance;
import com.example.fleet_backend.model.MaintenanceStatus;
import com.example.fleet_backend.model.Vehicle;
import com.example.fleet_backend.repository.MaintenanceRepository;
import com.example.fleet_backend.repository.VehicleRepository;
import com.example.fleet_backend.security.AuthUtil;
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

    public MaintenanceService(
            MaintenanceRepository maintenanceRepository,
            VehicleRepository vehicleRepository,
            VehicleAccessService vehicleAccessService
    ) {
        this.maintenanceRepository = maintenanceRepository;
        this.vehicleRepository = vehicleRepository;
        this.vehicleAccessService = vehicleAccessService;
    }

    @Transactional
    public MaintenanceDTO createMaintenance(
            MaintenanceCreateRequest request,
            Authentication auth
    ) {
        assertOwnerOrAdmin(auth);

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

        maintenance.setStatus(status);
        maintenance.setMaintenanceDate(request.getMaintenanceDate());
        maintenance.setPlannedDate(request.getPlannedDate());
        maintenance.setMileage(request.getMileage());
        maintenance.setCost(request.getCost());

        maintenance.setCreatedByUserId(AuthUtil.userId(auth));
        maintenance.setCreatedByEmail(AuthUtil.email(auth));

        if (status == MaintenanceStatus.DONE) {
            maintenance.setCompletedAt(LocalDateTime.now());

            if (maintenance.getMaintenanceDate() == null) {
                maintenance.setMaintenanceDate(LocalDateTime.now());
            }
        }

        Maintenance saved = maintenanceRepository.save(maintenance);
        return toDTO(saved);
    }

    @Transactional(readOnly = true)
    public List<MaintenanceDTO> getLatestMaintenances(Authentication auth) {
        return maintenanceRepository.findTop50ByOrderByCreatedAtDesc()
                .stream()
                .filter(maintenance -> canCurrentUserSeeMaintenance(maintenance, auth))
                .map(this::toDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public MaintenanceDTO getMaintenanceById(Long id, Authentication auth) {
        Maintenance maintenance = maintenanceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Maintenance introuvable"));

        if (!canCurrentUserSeeMaintenance(maintenance, auth)) {
            throw new RuntimeException("Accès refusé à cette maintenance");
        }

        return toDTO(maintenance);
    }

    @Transactional(readOnly = true)
    public List<MaintenanceDTO> getMaintenancesByVehicle(Long vehicleId) {
        vehicleAccessService.assertCanAccessVehicle(vehicleId);

        return maintenanceRepository.findByVehicleIdOrderByCreatedAtDesc(vehicleId)
                .stream()
                .map(this::toDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<MaintenanceDTO> getMaintenancesByStatus(
            MaintenanceStatus status,
            Authentication auth
    ) {
        return maintenanceRepository.findByStatusOrderByCreatedAtDesc(status)
                .stream()
                .filter(maintenance -> canCurrentUserSeeMaintenance(maintenance, auth))
                .map(this::toDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<MaintenanceDTO> getUpcomingMaintenances(Authentication auth) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime next30Days = now.plusDays(30);

        return maintenanceRepository
                .findByStatusAndPlannedDateBetweenOrderByPlannedDateAsc(
                        MaintenanceStatus.PLANNED,
                        now,
                        next30Days
                )
                .stream()
                .filter(maintenance -> canCurrentUserSeeMaintenance(maintenance, auth))
                .map(this::toDTO)
                .toList();
    }

    @Transactional
    public MaintenanceDTO updateStatus(
            Long id,
            MaintenanceUpdateStatusRequest request,
            Authentication auth
    ) {
        assertOwnerOrAdmin(auth);

        Maintenance maintenance = maintenanceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Maintenance introuvable"));

        if (maintenance.getVehicle() != null) {
            vehicleAccessService.assertCanAccessVehicle(maintenance.getVehicle().getId());
        }

        MaintenanceStatus newStatus = request.getStatus();

        validateStatusTransition(maintenance.getStatus(), newStatus);

        maintenance.setStatus(newStatus);

        if (newStatus == MaintenanceStatus.DONE) {
            maintenance.setCompletedAt(LocalDateTime.now());

            if (maintenance.getMaintenanceDate() == null) {
                maintenance.setMaintenanceDate(LocalDateTime.now());
            }
        }

        Maintenance saved = maintenanceRepository.save(maintenance);
        return toDTO(saved);
    }

    @Transactional
    public MaintenanceDTO cancelMaintenance(Long id, Authentication auth) {
        assertOwnerOrAdmin(auth);

        Maintenance maintenance = maintenanceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Maintenance introuvable"));

        if (maintenance.getVehicle() != null) {
            vehicleAccessService.assertCanAccessVehicle(maintenance.getVehicle().getId());
        }

        if (maintenance.getStatus() == MaintenanceStatus.DONE) {
            throw new IllegalStateException("Une maintenance déjà effectuée ne peut pas être annulée.");
        }

        maintenance.setStatus(MaintenanceStatus.CANCELED);

        Maintenance saved = maintenanceRepository.save(maintenance);
        return toDTO(saved);
    }

    @Transactional
    public void markOverdueMaintenances() {
        LocalDateTime now = LocalDateTime.now();

        List<Maintenance> overdueMaintenances =
                maintenanceRepository.findByStatusAndPlannedDateBefore(
                        MaintenanceStatus.PLANNED,
                        now
                );

        for (Maintenance maintenance : overdueMaintenances) {
            maintenance.setStatus(MaintenanceStatus.OVERDUE);
        }

        maintenanceRepository.saveAll(overdueMaintenances);
    }

    private void validateStatusTransition(
            MaintenanceStatus currentStatus,
            MaintenanceStatus newStatus
    ) {
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
                    || newStatus == MaintenanceStatus.DONE
                    || newStatus == MaintenanceStatus.OVERDUE
                    || newStatus == MaintenanceStatus.CANCELED;

            case OVERDUE -> newStatus == MaintenanceStatus.OVERDUE
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

    private boolean canCurrentUserSeeMaintenance(
            Maintenance maintenance,
            Authentication auth
    ) {
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

        return new MaintenanceDTO(
                maintenance.getId(),
                vehicle != null ? vehicle.getId() : null,
                vehicle != null ? vehicle.getRegistrationNumber() : null,
                maintenance.getType(),
                maintenance.getStatus(),
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
                maintenance.getUpdatedAt()
        );
    }
}