package com.example.fleet_backend.service;

import com.example.fleet_backend.dto.DashboardKpiDTO;
import com.example.fleet_backend.model.*;
import com.example.fleet_backend.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class DashboardKpiService {

    private final VehicleRepository vehicleRepository;
    private final MissionRepository missionRepository;
    private final IncidentRepository incidentRepository;
    private final MaintenanceRepository maintenanceRepository;
    private final VehicleEventRepository vehicleEventRepository;

    public DashboardKpiService(
            VehicleRepository vehicleRepository,
            MissionRepository missionRepository,
            IncidentRepository incidentRepository,
            MaintenanceRepository maintenanceRepository,
            VehicleEventRepository vehicleEventRepository
    ) {
        this.vehicleRepository = vehicleRepository;
        this.missionRepository = missionRepository;
        this.incidentRepository = incidentRepository;
        this.maintenanceRepository = maintenanceRepository;
        this.vehicleEventRepository = vehicleEventRepository;
    }

    @Transactional(readOnly = true)
    public DashboardKpiDTO getOwnerKpi(Long ownerId) {
        LocalDateTime todayStart = LocalDateTime.now().toLocalDate().atStartOfDay();

        DashboardKpiDTO dto = new DashboardKpiDTO();

        dto.setTotalVehicles(vehicleRepository.countByOwnerId(ownerId));
        dto.setAvailableVehicles(vehicleRepository.countByOwnerIdAndStatus(ownerId, Vehicle.VehicleStatus.AVAILABLE));
        dto.setInUseVehicles(vehicleRepository.countByOwnerIdAndStatus(ownerId, Vehicle.VehicleStatus.IN_USE));
        dto.setMaintenanceVehicles(vehicleRepository.countByOwnerIdAndStatus(ownerId, Vehicle.VehicleStatus.UNDER_MAINTENANCE));
        dto.setReservedVehicles(vehicleRepository.countByOwnerIdAndStatus(ownerId, Vehicle.VehicleStatus.RESERVED));
        dto.setOutOfServiceVehicles(vehicleRepository.countByOwnerIdAndStatus(ownerId, Vehicle.VehicleStatus.OUT_OF_SERVICE));

        dto.setPlannedMissions(missionRepository.countByOwner_IdAndStatus(ownerId, Mission.MissionStatus.PLANNED));
        dto.setActiveMissions(missionRepository.countByOwner_IdAndStatus(ownerId, Mission.MissionStatus.IN_PROGRESS));
        dto.setCompletedMissions(missionRepository.countByOwner_IdAndStatus(ownerId, Mission.MissionStatus.COMPLETED));
        dto.setCanceledMissions(missionRepository.countByOwner_IdAndStatus(ownerId, Mission.MissionStatus.CANCELED));

        dto.setOpenIncidents(incidentRepository.countByVehicleOwnerIdAndStatus(ownerId, IncidentStatus.OPEN));
        dto.setInProgressIncidents(incidentRepository.countByVehicleOwnerIdAndStatus(ownerId, IncidentStatus.IN_PROGRESS));
        dto.setResolvedIncidents(incidentRepository.countByVehicleOwnerIdAndStatus(ownerId, IncidentStatus.RESOLVED));

        dto.setCriticalIncidents(
                incidentRepository.countByVehicleOwnerIdAndSeverityAndStatusIn(
                        ownerId,
                        IncidentSeverity.CRITICAL,
                        List.of(IncidentStatus.OPEN, IncidentStatus.IN_PROGRESS)
                )
        );

        dto.setPlannedMaintenances(maintenanceRepository.countByVehicleOwnerIdAndStatus(ownerId, MaintenanceStatus.PLANNED));
        dto.setInProgressMaintenances(maintenanceRepository.countByVehicleOwnerIdAndStatus(ownerId, MaintenanceStatus.IN_PROGRESS));
        dto.setDoneMaintenances(maintenanceRepository.countByVehicleOwnerIdAndStatus(ownerId, MaintenanceStatus.DONE));
        dto.setOverdueMaintenances(maintenanceRepository.countByVehicleOwnerIdAndStatus(ownerId, MaintenanceStatus.OVERDUE));
        dto.setCanceledMaintenances(maintenanceRepository.countByVehicleOwnerIdAndStatus(ownerId, MaintenanceStatus.CANCELED));

        BigDecimal totalCost = maintenanceRepository.sumCostByOwnerId(ownerId);
        dto.setMaintenanceTotalCost(totalCost != null ? totalCost : BigDecimal.ZERO);

        dto.setCriticalAlertsToday(
                vehicleEventRepository.countByVehicleOwnerIdAndSeverityAndCreatedAtAfter(
                        ownerId,
                        EventSeverity.CRITICAL,
                        todayStart
                )
        );

        dto.setWarningAlertsToday(
                vehicleEventRepository.countByVehicleOwnerIdAndSeverityAndCreatedAtAfter(
                        ownerId,
                        EventSeverity.WARNING,
                        todayStart
                )
        );

        dto.setGeneratedAt(LocalDateTime.now());

        return dto;
    }
}