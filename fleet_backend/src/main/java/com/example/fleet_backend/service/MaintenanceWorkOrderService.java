package com.example.fleet_backend.service;

import com.example.fleet_backend.dto.MaintenanceDTO;
import com.example.fleet_backend.dto.MaintenanceWorkOrderCreateRequest;
import com.example.fleet_backend.dto.MaintenanceWorkOrderDTO;
import com.example.fleet_backend.dto.MaintenanceWorkOrderStatusRequest;
import com.example.fleet_backend.model.*;
import com.example.fleet_backend.repository.MaintenanceRepository;
import com.example.fleet_backend.repository.MaintenanceWorkOrderRepository;
import com.example.fleet_backend.repository.VehicleRepository;
import com.example.fleet_backend.security.AuthUtil;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class MaintenanceWorkOrderService {

    private final MaintenanceWorkOrderRepository workOrderRepository;
    private final MaintenanceRepository maintenanceRepository;
    private final VehicleRepository vehicleRepository;
    private final VehicleAccessService vehicleAccessService;

    public MaintenanceWorkOrderService(
            MaintenanceWorkOrderRepository workOrderRepository,
            MaintenanceRepository maintenanceRepository,
            VehicleRepository vehicleRepository,
            VehicleAccessService vehicleAccessService
    ) {
        this.workOrderRepository = workOrderRepository;
        this.maintenanceRepository = maintenanceRepository;
        this.vehicleRepository = vehicleRepository;
        this.vehicleAccessService = vehicleAccessService;
    }

    @Transactional
    public MaintenanceWorkOrderDTO create(MaintenanceWorkOrderCreateRequest request, Authentication auth) {
        assertOwnerOrAdmin(auth);

        vehicleAccessService.assertCanAccessVehicle(request.getVehicleId());

        Vehicle vehicle = vehicleRepository.findById(request.getVehicleId())
                .orElseThrow(() -> new RuntimeException("Véhicule introuvable"));

        MaintenanceWorkOrder workOrder = new MaintenanceWorkOrder();
        workOrder.setVehicle(vehicle);
        workOrder.setTitle(request.getTitle());
        workOrder.setGarageName(request.getGarageName());
        workOrder.setNotes(request.getNotes());
        workOrder.setStartDate(request.getStartDate());
        workOrder.setEndDate(request.getEndDate());
        workOrder.setEstimatedDurationDays(request.getEstimatedDurationDays());
        workOrder.setEstimatedCost(request.getEstimatedCost());
        workOrder.setStatus(WorkOrderStatus.PLANNED);
        workOrder.setCreatedByUserId(AuthUtil.userId(auth));
        workOrder.setCreatedByEmail(AuthUtil.email(auth));

        MaintenanceWorkOrder saved = workOrderRepository.save(workOrder);

        if (request.getMaintenanceIds() != null && !request.getMaintenanceIds().isEmpty()) {
            for (Long maintenanceId : request.getMaintenanceIds()) {
                Maintenance maintenance = maintenanceRepository.findById(maintenanceId)
                        .orElseThrow(() -> new RuntimeException("Maintenance introuvable: " + maintenanceId));

                if (maintenance.getVehicle() == null ||
                        !maintenance.getVehicle().getId().equals(vehicle.getId())) {
                    throw new RuntimeException("Toutes les maintenances doivent appartenir au même véhicule.");
                }

                if (maintenance.getStatus() == MaintenanceStatus.DONE ||
                        maintenance.getStatus() == MaintenanceStatus.CANCELED) {
                    throw new RuntimeException("Impossible de regrouper une maintenance terminée ou annulée.");
                }

                maintenance.setWorkOrder(saved);
            }
        }

        return toDTO(saved);
    }

    @Transactional(readOnly = true)
    public List<MaintenanceWorkOrderDTO> getAll(Authentication auth) {
        return workOrderRepository.findTop50ByOrderByCreatedAtDesc()
                .stream()
                .filter(w -> canSeeWorkOrder(w, auth))
                .map(this::toDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public MaintenanceWorkOrderDTO getById(Long id, Authentication auth) {
        MaintenanceWorkOrder workOrder = workOrderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Work order introuvable"));

        if (!canSeeWorkOrder(workOrder, auth)) {
            throw new RuntimeException("Accès refusé");
        }

        return toDTO(workOrder);
    }

    @Transactional(readOnly = true)
    public List<MaintenanceWorkOrderDTO> getByVehicle(Long vehicleId) {
        vehicleAccessService.assertCanAccessVehicle(vehicleId);

        return workOrderRepository.findByVehicleIdOrderByCreatedAtDesc(vehicleId)
                .stream()
                .map(this::toDTO)
                .toList();
    }

    @Transactional
    public MaintenanceWorkOrderDTO updateStatus(
            Long id,
            MaintenanceWorkOrderStatusRequest request,
            Authentication auth
    ) {
        assertOwnerOrAdmin(auth);

        MaintenanceWorkOrder workOrder = workOrderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Work order introuvable"));

        vehicleAccessService.assertCanAccessVehicle(workOrder.getVehicle().getId());

        WorkOrderStatus newStatus = request.getStatus();

        workOrder.setStatus(newStatus);

        if (request.getActualCost() != null) {
            workOrder.setActualCost(request.getActualCost());
        }

        List<Maintenance> maintenances =
                maintenanceRepository.findByWorkOrderIdOrderByCreatedAtAsc(workOrder.getId());

        if (newStatus == WorkOrderStatus.IN_PROGRESS) {
            workOrder.getVehicle().setStatus(Vehicle.VehicleStatus.UNDER_MAINTENANCE);

            for (Maintenance m : maintenances) {
                if (m.getStatus() == MaintenanceStatus.PLANNED ||
                        m.getStatus() == MaintenanceStatus.OVERDUE) {
                    m.setStatus(MaintenanceStatus.IN_PROGRESS);
                }
            }
        }

        if (newStatus == WorkOrderStatus.COMPLETED) {
            for (Maintenance m : maintenances) {
                if (m.getStatus() != MaintenanceStatus.DONE &&
                        m.getStatus() != MaintenanceStatus.CANCELED) {
                    m.setStatus(MaintenanceStatus.DONE);
                    m.setCompletedAt(java.time.LocalDateTime.now());

                    if (m.getMaintenanceDate() == null) {
                        m.setMaintenanceDate(java.time.LocalDateTime.now());
                    }

                    if (m.getIncident() != null &&
                            m.getIncident().getStatus() != IncidentStatus.CLOSED) {
                        m.getIncident().setStatus(IncidentStatus.RESOLVED);
                        m.getIncident().setResolvedAt(java.time.LocalDateTime.now());
                        m.getIncident().setHandledByUserId(AuthUtil.userId(auth));
                        m.getIncident().setHandledByEmail(AuthUtil.email(auth));
                    }
                }
            }

            workOrder.getVehicle().setStatus(Vehicle.VehicleStatus.AVAILABLE);
            workOrder.getVehicle().setLastMaintenanceDate(java.time.LocalDateTime.now());
        }

        if (newStatus == WorkOrderStatus.CANCELED) {
            for (Maintenance m : maintenances) {
                if (m.getStatus() != MaintenanceStatus.DONE) {
                    m.setStatus(MaintenanceStatus.CANCELED);
                }
            }

            workOrder.getVehicle().setStatus(Vehicle.VehicleStatus.AVAILABLE);
        }

        MaintenanceWorkOrder saved = workOrderRepository.save(workOrder);
        return toDTO(saved);
    }

    private boolean canSeeWorkOrder(MaintenanceWorkOrder workOrder, Authentication auth) {
        if (AuthUtil.isAdmin(auth)) {
            return true;
        }

        if (workOrder.getVehicle() == null) {
            return false;
        }

        try {
            vehicleAccessService.assertCanAccessVehicle(workOrder.getVehicle().getId());
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    private void assertOwnerOrAdmin(Authentication auth) {
        if (!AuthUtil.isAdmin(auth) && !AuthUtil.isOwner(auth)) {
            throw new RuntimeException("Seul ADMIN ou OWNER peut gérer les work orders.");
        }
    }

    private MaintenanceWorkOrderDTO toDTO(MaintenanceWorkOrder workOrder) {
        Vehicle vehicle = workOrder.getVehicle();

        List<MaintenanceDTO> maintenanceDTOs =
                maintenanceRepository.findByWorkOrderIdOrderByCreatedAtAsc(workOrder.getId())
                        .stream()
                        .map(this::toMaintenanceDTO)
                        .toList();

        return new MaintenanceWorkOrderDTO(
                workOrder.getId(),
                vehicle != null ? vehicle.getId() : null,
                vehicle != null ? vehicle.getRegistrationNumber() : null,
                workOrder.getStatus(),
                workOrder.getTitle(),
                workOrder.getGarageName(),
                workOrder.getNotes(),
                workOrder.getStartDate(),
                workOrder.getEndDate(),
                workOrder.getEstimatedDurationDays(),
                workOrder.getEstimatedCost(),
                workOrder.getActualCost(),
                workOrder.getCreatedByUserId(),
                workOrder.getCreatedByEmail(),
                workOrder.getCreatedAt(),
                workOrder.getUpdatedAt(),
                maintenanceDTOs
        );
    }

    private MaintenanceDTO toMaintenanceDTO(Maintenance maintenance) {
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