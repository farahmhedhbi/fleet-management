package com.example.fleet_backend.service;

import com.example.fleet_backend.model.*;
import com.example.fleet_backend.repository.IncidentRepository;
import com.example.fleet_backend.repository.MaintenanceRepository;
import com.example.fleet_backend.repository.MissionRepository;
import com.example.fleet_backend.repository.VehicleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class VehicleStatusService {

    private final VehicleRepository vehicleRepository;
    private final MaintenanceRepository maintenanceRepository;
    private final IncidentRepository incidentRepository;
    private final MissionRepository missionRepository;

    public VehicleStatusService(
            VehicleRepository vehicleRepository,
            MaintenanceRepository maintenanceRepository,
            IncidentRepository incidentRepository,
            MissionRepository missionRepository
    ) {
        this.vehicleRepository = vehicleRepository;
        this.maintenanceRepository = maintenanceRepository;
        this.incidentRepository = incidentRepository;
        this.missionRepository = missionRepository;
    }

    @Transactional
    public void recalculateVehicleStatus(Long vehicleId) {
        if (vehicleId == null) return;

        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new RuntimeException("Véhicule introuvable"));

        boolean hasActiveMission =
                missionRepository.existsByVehicleIdAndStatusIn(
                        vehicleId,
                        List.of(Mission.MissionStatus.IN_PROGRESS)
                );

        boolean hasActiveMaintenance =
                maintenanceRepository.existsByVehicleIdAndStatusIn(
                        vehicleId,
                        List.of(MaintenanceStatus.PLANNED, MaintenanceStatus.IN_PROGRESS)
                );

        boolean hasBlockingIncident =
                incidentRepository.existsByVehicleIdAndStatusIn(
                        vehicleId,
                        List.of(IncidentStatus.OPEN, IncidentStatus.IN_PROGRESS)
                );

        if (hasActiveMission) {
            vehicle.setStatus(Vehicle.VehicleStatus.IN_USE);
        } else if (hasActiveMaintenance || hasBlockingIncident) {
            vehicle.setStatus(Vehicle.VehicleStatus.UNDER_MAINTENANCE);
        } else {
            vehicle.setStatus(Vehicle.VehicleStatus.AVAILABLE);
        }

        vehicleRepository.save(vehicle);
    }
}