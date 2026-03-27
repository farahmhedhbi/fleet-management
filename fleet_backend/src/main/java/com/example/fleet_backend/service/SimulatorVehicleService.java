package com.example.fleet_backend.service;

import com.example.fleet_backend.dto.MissionRoutePointDTO;
import com.example.fleet_backend.dto.SimulatorVehicleDTO;
import com.example.fleet_backend.model.Mission;
import com.example.fleet_backend.model.Vehicle;
import com.example.fleet_backend.repository.MissionRepository;
import com.example.fleet_backend.repository.VehicleRepository;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class SimulatorVehicleService {

    private final VehicleRepository vehicleRepository;
    private final MissionRepository missionRepository;

    public SimulatorVehicleService(VehicleRepository vehicleRepository,
                                   MissionRepository missionRepository) {
        this.vehicleRepository = vehicleRepository;
        this.missionRepository = missionRepository;
    }

    public List<SimulatorVehicleDTO> getVehiclesForSimulation() {
        List<Vehicle> vehicles = vehicleRepository.findAll();

        return vehicles.stream()
                .map(this::toSimulatorDTO)
                .collect(Collectors.toList());
    }

    private SimulatorVehicleDTO toSimulatorDTO(Vehicle vehicle) {
        Optional<Mission> activeMissionOpt =
                missionRepository.findFirstByVehicleIdAndStatus(
                        vehicle.getId(),
                        Mission.MissionStatus.IN_PROGRESS
                );

        boolean missionActive = activeMissionOpt.isPresent();
        Long missionId = null;
        String routeSource = "STATIC";
        String routeId = "static-" + vehicle.getId();
        List<MissionRoutePointDTO> missionRoute = Collections.emptyList();

        if (missionActive) {
            Mission mission = activeMissionOpt.get();
            missionId = mission.getId();
            routeSource = "MISSION";
            routeId = "mission-" + mission.getId();

            // IMPORTANT:
            // pour le moment, ta classe Mission ne contient pas de route
            // donc on laisse une liste vide
            missionRoute = Collections.emptyList();
        }

        return new SimulatorVehicleDTO(
                vehicle.getId(),
                safeRegistration(vehicle),
                safeBrand(vehicle),
                safeModel(vehicle),
                missionActive,
                missionId,
                routeSource,
                routeId,
                missionRoute
        );
    }

    private String safeRegistration(Vehicle vehicle) {
        try {
            return vehicle.getRegistrationNumber();
        } catch (Exception e) {
            return null;
        }
    }

    private String safeBrand(Vehicle vehicle) {
        try {
            return vehicle.getBrand();
        } catch (Exception e) {
            return null;
        }
    }

    private String safeModel(Vehicle vehicle) {
        try {
            return vehicle.getModel();
        } catch (Exception e) {
            return null;
        }
    }
}