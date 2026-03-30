package com.example.fleet_backend.service;

import com.example.fleet_backend.dto.MissionRoutePointDTO;
import com.example.fleet_backend.dto.SimulatorVehicleDTO;
import com.example.fleet_backend.exception.ResourceNotFoundException;
import com.example.fleet_backend.model.Driver;
import com.example.fleet_backend.model.Mission;
import com.example.fleet_backend.model.Vehicle;
import com.example.fleet_backend.repository.DriverRepository;
import com.example.fleet_backend.repository.MissionRepository;
import com.example.fleet_backend.repository.VehicleRepository;
import com.example.fleet_backend.security.AuthUtil;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class SimulatorVehicleService {

    private final VehicleRepository vehicleRepository;
    private final MissionRepository missionRepository;
    private final DriverRepository driverRepository;
    private final ObjectMapper objectMapper;

    public SimulatorVehicleService(VehicleRepository vehicleRepository,
                                   MissionRepository missionRepository,
                                   DriverRepository driverRepository,
                                   ObjectMapper objectMapper) {
        this.vehicleRepository = vehicleRepository;
        this.missionRepository = missionRepository;
        this.driverRepository = driverRepository;
        this.objectMapper = objectMapper;
    }

    public List<SimulatorVehicleDTO> getVehiclesForSimulationSecured(Authentication auth) {
        List<Vehicle> vehicles = getAuthorizedVehicles(auth);

        return vehicles.stream()
                .map(this::toSimulatorDTO)
                .collect(Collectors.toList());
    }

    private List<Vehicle> getAuthorizedVehicles(Authentication auth) {
        if (auth == null || !auth.isAuthenticated() || auth instanceof AnonymousAuthenticationToken) {
            return vehicleRepository.findAll();
        }

        if (AuthUtil.isAdmin(auth)) {
            return vehicleRepository.findAll();
        }

        if (AuthUtil.hasRole(auth, "OWNER")) {
            Long ownerId = AuthUtil.userId(auth);
            return vehicleRepository.findByOwnerId(ownerId);
        }

        if (AuthUtil.hasRole(auth, "DRIVER")) {
            String email = auth.getName();

            Driver driver = driverRepository.findByEmail(email)
                    .orElseThrow(() ->
                            new ResourceNotFoundException("Driver not found for email: " + email));

            return vehicleRepository.findByDriverId(driver.getId());
        }

        throw new AccessDeniedException("Forbidden");
    }

    private SimulatorVehicleDTO toSimulatorDTO(Vehicle vehicle) {
        Optional<Mission> activeMissionOpt = missionRepository.findFirstByVehicleIdAndStatus(
                vehicle.getId(),
                Mission.MissionStatus.IN_PROGRESS
        );

        boolean missionActive = activeMissionOpt.isPresent();
        Long missionId = null;
        String routeId = "static-" + vehicle.getId();
        String routeSource = "STATIC";
        List<MissionRoutePointDTO> missionRoute = Collections.emptyList();

        if (missionActive) {
            Mission mission = activeMissionOpt.get();
            missionId = mission.getId();
            routeId = "mission-" + mission.getId();
            routeSource = "MISSION";
            missionRoute = parseMissionRoute(mission.getRouteJson());
        }

        return new SimulatorVehicleDTO(
                vehicle.getId(),
                safeRegistration(vehicle),
                safeBrand(vehicle),
                safeModel(vehicle),
                missionActive,
                missionId,
                routeId,
                routeSource,
                missionRoute
        );
    }

    private List<MissionRoutePointDTO> parseMissionRoute(String routeJson) {
        if (routeJson == null || routeJson.isBlank()) {
            return Collections.emptyList();
        }

        try {
            return objectMapper.readValue(
                    routeJson,
                    new TypeReference<List<MissionRoutePointDTO>>() {}
            );
        } catch (Exception e) {
            return Collections.emptyList();
        }
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