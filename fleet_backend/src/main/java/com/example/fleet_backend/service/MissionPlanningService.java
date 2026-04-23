package com.example.fleet_backend.service;

import com.example.fleet_backend.dto.MissionDTO;
import com.example.fleet_backend.exception.ResourceNotFoundException;
import com.example.fleet_backend.model.Driver;
import com.example.fleet_backend.model.Mission;
import com.example.fleet_backend.model.User;
import com.example.fleet_backend.model.Vehicle;
import com.example.fleet_backend.repository.DriverRepository;
import com.example.fleet_backend.repository.MissionRepository;
import com.example.fleet_backend.repository.UserRepository;
import com.example.fleet_backend.repository.VehicleRepository;
import com.example.fleet_backend.security.AuthUtil;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class MissionPlanningService {

    private static final long MIN_DURATION_SECONDS = 300;
    private static final long EXTRA_MARGIN_SECONDS = 300;

    private final MissionRepository missionRepository;
    private final VehicleRepository vehicleRepository;
    private final DriverRepository driverRepository;
    private final UserRepository userRepository;
    private final RoutePlannerService routePlannerService;

    public MissionPlanningService(MissionRepository missionRepository,
                                  VehicleRepository vehicleRepository,
                                  DriverRepository driverRepository,
                                  UserRepository userRepository,
                                  RoutePlannerService routePlannerService) {
        this.missionRepository = missionRepository;
        this.vehicleRepository = vehicleRepository;
        this.driverRepository = driverRepository;
        this.userRepository = userRepository;
        this.routePlannerService = routePlannerService;
    }

    public Mission createMission(MissionDTO dto, Authentication auth) {
        validateMissionInput(dto);

        User owner = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found"));

        Vehicle vehicle = vehicleRepository.findById(dto.getVehicleId())
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found"));

        Driver driver = driverRepository.findById(dto.getDriverId())
                .orElseThrow(() -> new ResourceNotFoundException("Driver not found"));

        if (AuthUtil.hasRole(auth, "OWNER")) {
            if (vehicle.getOwner() == null || !vehicle.getOwner().getId().equals(owner.getId())) {
                throw new AccessDeniedException("You can only use your own vehicles");
            }

            if (driver.getOwner() == null || !driver.getOwner().getId().equals(owner.getId())) {
                throw new AccessDeniedException("You can only use your own drivers");
            }
        }

        RoutePlanResult plan = routePlannerService.buildRoutePlan(
                dto.getDeparture().trim(),
                dto.getDestination().trim()
        );

        long estimatedSeconds = Math.max(MIN_DURATION_SECONDS, plan.getDurationSeconds()) + EXTRA_MARGIN_SECONDS;
        LocalDateTime estimatedEndDate = dto.getStartDate().plusSeconds(estimatedSeconds);

        if (missionRepository.existsVehicleOverlap(vehicle.getId(), dto.getStartDate(), estimatedEndDate)) {
            throw new IllegalArgumentException("Vehicle already assigned on this estimated time range");
        }

        if (missionRepository.existsDriverOverlap(driver.getId(), dto.getStartDate(), estimatedEndDate)) {
            throw new IllegalArgumentException("Driver already assigned on this estimated time range");
        }

        Mission mission = new Mission();
        mission.setTitle(dto.getTitle().trim());
        mission.setDescription(dto.getDescription());
        mission.setDeparture(dto.getDeparture().trim());
        mission.setDestination(dto.getDestination().trim());
        mission.setStartDate(dto.getStartDate());
        mission.setEndDate(estimatedEndDate);
        mission.setOwner(owner);
        mission.setDriver(driver);
        mission.setVehicle(vehicle);
        mission.setRouteJson(plan.getRouteJson());
        mission.setStatus(Mission.MissionStatus.PLANNED);
        mission.setLateAlertSent(false);

        return missionRepository.save(mission);
    }

    public Mission updateMission(Mission mission, MissionDTO dto, Authentication auth) {
        validateMissionInput(dto);

        if (mission.getStatus() != Mission.MissionStatus.PLANNED) {
            throw new IllegalArgumentException("Only planned missions can be edited");
        }

        User owner = mission.getOwner();
        if (owner == null) {
            throw new IllegalArgumentException("Mission owner is missing");
        }

        Vehicle vehicle = vehicleRepository.findById(dto.getVehicleId())
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found"));

        Driver driver = driverRepository.findById(dto.getDriverId())
                .orElseThrow(() -> new ResourceNotFoundException("Driver not found"));

        if (AuthUtil.hasRole(auth, "OWNER")) {
            if (vehicle.getOwner() == null || !vehicle.getOwner().getId().equals(owner.getId())) {
                throw new AccessDeniedException("You can only use your own vehicles");
            }

            if (driver.getOwner() == null || !driver.getOwner().getId().equals(owner.getId())) {
                throw new AccessDeniedException("You can only use your own drivers");
            }
        }

        RoutePlanResult plan = routePlannerService.buildRoutePlan(
                dto.getDeparture().trim(),
                dto.getDestination().trim()
        );

        long estimatedSeconds = Math.max(MIN_DURATION_SECONDS, plan.getDurationSeconds()) + EXTRA_MARGIN_SECONDS;
        LocalDateTime estimatedEndDate = dto.getStartDate().plusSeconds(estimatedSeconds);

        if (missionRepository.existsVehicleOverlapExcludingMission(
                vehicle.getId(), dto.getStartDate(), estimatedEndDate, mission.getId())) {
            throw new IllegalArgumentException("Vehicle already assigned on this estimated time range");
        }

        if (missionRepository.existsDriverOverlapExcludingMission(
                driver.getId(), dto.getStartDate(), estimatedEndDate, mission.getId())) {
            throw new IllegalArgumentException("Driver already assigned on this estimated time range");
        }

        mission.setTitle(dto.getTitle().trim());
        mission.setDescription(dto.getDescription());
        mission.setDeparture(dto.getDeparture().trim());
        mission.setDestination(dto.getDestination().trim());
        mission.setStartDate(dto.getStartDate());
        mission.setEndDate(estimatedEndDate);
        mission.setVehicle(vehicle);
        mission.setDriver(driver);
        mission.setRouteJson(plan.getRouteJson());

        return missionRepository.save(mission);
    }

    private void validateMissionInput(MissionDTO dto) {
        if (dto.getTitle() == null || dto.getTitle().isBlank()) {
            throw new IllegalArgumentException("title is required");
        }
        if (dto.getDeparture() == null || dto.getDeparture().isBlank()) {
            throw new IllegalArgumentException("departure is required");
        }
        if (dto.getDestination() == null || dto.getDestination().isBlank()) {
            throw new IllegalArgumentException("destination is required");
        }
        if (dto.getVehicleId() == null) {
            throw new IllegalArgumentException("vehicleId is required");
        }
        if (dto.getDriverId() == null) {
            throw new IllegalArgumentException("driverId is required");
        }
        if (dto.getStartDate() == null) {
            throw new IllegalArgumentException("startDate is required");
        }
    }
}