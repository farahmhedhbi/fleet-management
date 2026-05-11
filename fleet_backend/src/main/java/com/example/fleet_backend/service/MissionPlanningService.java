package com.example.fleet_backend.service;

import com.example.fleet_backend.dto.MissionDTO;
import com.example.fleet_backend.exception.ResourceNotFoundException;
import com.example.fleet_backend.model.Driver;
import com.example.fleet_backend.model.MaintenanceStatus;
import com.example.fleet_backend.model.Mission;
import com.example.fleet_backend.model.User;
import com.example.fleet_backend.model.Vehicle;
import com.example.fleet_backend.repository.DriverRepository;
import com.example.fleet_backend.repository.MaintenanceRepository;
import com.example.fleet_backend.repository.MissionRepository;
import com.example.fleet_backend.repository.UserRepository;
import com.example.fleet_backend.repository.VehicleRepository;
import com.example.fleet_backend.security.AuthUtil;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class MissionPlanningService {

    private static final long MIN_DURATION_SECONDS = 120;

    private final MissionRepository missionRepository;
    private final VehicleRepository vehicleRepository;
    private final DriverRepository driverRepository;
    private final UserRepository userRepository;
    private final RoutePlannerService routePlannerService;
    private final MaintenanceRepository maintenanceRepository;

    public MissionPlanningService(
            MissionRepository missionRepository,
            VehicleRepository vehicleRepository,
            DriverRepository driverRepository,
            UserRepository userRepository,
            RoutePlannerService routePlannerService,
            MaintenanceRepository maintenanceRepository
    ) {
        this.missionRepository = missionRepository;
        this.vehicleRepository = vehicleRepository;
        this.driverRepository = driverRepository;
        this.userRepository = userRepository;
        this.routePlannerService = routePlannerService;
        this.maintenanceRepository = maintenanceRepository;
    }

    public Mission createMission(MissionDTO dto, Authentication auth) {
        validateMissionInput(dto);

        User owner = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found"));

        Vehicle vehicle = vehicleRepository.findById(dto.getVehicleId())
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found"));

        Driver driver = driverRepository.findById(dto.getDriverId())
                .orElseThrow(() -> new ResourceNotFoundException("Driver not found"));

        validateOwnerAccess(auth, owner, vehicle, driver);

        RoutePlanResult plan = routePlannerService.buildRoutePlan(
                dto.getDeparture().trim(),
                dto.getDestination().trim()
        );

        LocalDateTime estimatedEndDate = calculateEstimatedEndDate(
                dto.getStartDate(),
                plan.getDurationSeconds()
        );

        validateDriverLicense(driver, estimatedEndDate);

        validateVehicleAndDriverAvailability(
                vehicle,
                driver.getId(),
                dto.getStartDate(),
                estimatedEndDate,
                null
        );

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

        if (mission == null || mission.getId() == null) {
            throw new ResourceNotFoundException("Mission not found");
        }

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

        validateOwnerAccess(auth, owner, vehicle, driver);

        RoutePlanResult plan = routePlannerService.buildRoutePlan(
                dto.getDeparture().trim(),
                dto.getDestination().trim()
        );

        LocalDateTime estimatedEndDate = calculateEstimatedEndDate(
                dto.getStartDate(),
                plan.getDurationSeconds()
        );

        validateDriverLicense(driver, estimatedEndDate);

        validateVehicleAndDriverAvailability(
                vehicle,
                driver.getId(),
                dto.getStartDate(),
                estimatedEndDate,
                mission.getId()
        );

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

    private void validateOwnerAccess(
            Authentication auth,
            User owner,
            Vehicle vehicle,
            Driver driver
    ) {
        if (!AuthUtil.hasRole(auth, "OWNER")) {
            return;
        }

        if (vehicle.getOwner() == null || !vehicle.getOwner().getId().equals(owner.getId())) {
            throw new AccessDeniedException("You can only use your own vehicles");
        }

        if (driver.getOwner() == null || !driver.getOwner().getId().equals(owner.getId())) {
            throw new AccessDeniedException("You can only use your own drivers");
        }
    }

    private LocalDateTime calculateEstimatedEndDate(
            LocalDateTime startDate,
            long routeDurationSeconds
    ) {
        long baseDuration = Math.max(MIN_DURATION_SECONDS, routeDurationSeconds);
        long estimatedSeconds = baseDuration + Math.round(baseDuration * 0.10);

        return startDate.plusSeconds(estimatedSeconds);
    }

    private void validateDriverLicense(Driver driver, LocalDateTime missionEndDate) {
        if (driver.getStatus() != Driver.DriverStatus.ACTIVE) {
            throw new IllegalArgumentException("Ce chauffeur n'est pas actif");
        }

        if (driver.getLicenseExpiry() == null) {
            throw new IllegalArgumentException("La date d'expiration du permis est manquante");
        }

        if (driver.getLicenseExpiry().isBefore(missionEndDate)
                || driver.getLicenseExpiry().isEqual(missionEndDate)) {
            throw new IllegalArgumentException("Le permis du chauffeur expire avant la fin de la mission");
        }
    }

    private void validateVehicleAndDriverAvailability(
            Vehicle vehicle,
            Long driverId,
            LocalDateTime startDate,
            LocalDateTime endDate,
            Long currentMissionId
    ) {
        if (vehicle == null || vehicle.getId() == null) {
            throw new IllegalArgumentException("Vehicle is required");
        }

        if (driverId == null) {
            throw new IllegalArgumentException("Driver is required");
        }

        Long vehicleId = vehicle.getId();

        if (vehicle.getStatus() == Vehicle.VehicleStatus.OUT_OF_SERVICE) {
            throw new IllegalArgumentException("Ce véhicule est hors service.");
        }

        if (missionRepository.existsByVehicleIdAndStatus(
                vehicleId,
                Mission.MissionStatus.IN_PROGRESS
        )) {
            throw new IllegalArgumentException("Ce véhicule a déjà une mission en cours.");
        }

        if (missionRepository.existsByDriverIdAndStatus(
                driverId,
                Mission.MissionStatus.IN_PROGRESS
        )) {
            throw new IllegalArgumentException("Ce chauffeur a déjà une mission en cours.");
        }

        boolean vehicleOverlap = currentMissionId == null
                ? missionRepository.existsVehicleOverlap(vehicleId, startDate, endDate)
                : missionRepository.existsVehicleOverlapExcludingMission(
                vehicleId,
                startDate,
                endDate,
                currentMissionId
        );

        if (vehicleOverlap) {
            throw new IllegalArgumentException("Ce véhicule est déjà réservé dans cette période.");
        }

        boolean driverOverlap = currentMissionId == null
                ? missionRepository.existsDriverOverlap(driverId, startDate, endDate)
                : missionRepository.existsDriverOverlapExcludingMission(
                driverId,
                startDate,
                endDate,
                currentMissionId
        );

        if (driverOverlap) {
            throw new IllegalArgumentException("Ce chauffeur est déjà réservé dans cette période.");
        }

        boolean maintenanceConflict = maintenanceRepository.hasMaintenanceConflict(
                vehicleId,
                List.of(
                        MaintenanceStatus.PLANNED,
                        MaintenanceStatus.IN_PROGRESS,
                        MaintenanceStatus.OVERDUE
                ),
                startDate,
                endDate
        );

        if (maintenanceConflict) {
            throw new IllegalArgumentException(
                    "Ce véhicule est indisponible pendant cette période car il est en maintenance."
            );
        }
    }

    private void validateMissionInput(MissionDTO dto) {
        if (dto == null) {
            throw new IllegalArgumentException("mission data is required");
        }

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

        if (dto.getStartDate().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("startDate cannot be in the past");
        }
    }
}