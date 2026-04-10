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
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class MissionService {

    private static final long MIN_DURATION_SECONDS = 300;
    private static final long EXTRA_MARGIN_SECONDS = 300;

    private final MissionRepository missionRepository;
    private final VehicleRepository vehicleRepository;
    private final DriverRepository driverRepository;
    private final UserRepository userRepository;
    private final RoutePlannerService routePlannerService;
    private final NotificationService notificationService;

    public MissionService(MissionRepository missionRepository,
                          VehicleRepository vehicleRepository,
                          DriverRepository driverRepository,
                          UserRepository userRepository,
                          RoutePlannerService routePlannerService,
                          NotificationService notificationService) {
        this.missionRepository = missionRepository;
        this.vehicleRepository = vehicleRepository;
        this.driverRepository = driverRepository;
        this.userRepository = userRepository;
        this.routePlannerService = routePlannerService;
        this.notificationService = notificationService;
    }

    public List<MissionDTO> getMissions(Authentication auth) {
        if (AuthUtil.hasRole(auth, "ADMIN")) {
            return missionRepository.findAll()
                    .stream()
                    .map(MissionDTO::new)
                    .collect(Collectors.toList());
        }

        if (AuthUtil.hasRole(auth, "OWNER")) {
            User owner = userRepository.findByEmail(auth.getName())
                    .orElseThrow(() -> new ResourceNotFoundException("Owner not found"));

            return missionRepository.findByOwner_Id(owner.getId())
                    .stream()
                    .map(MissionDTO::new)
                    .collect(Collectors.toList());
        }

        if (AuthUtil.hasRole(auth, "DRIVER")) {
            Driver driver = driverRepository.findByEmail(auth.getName())
                    .orElseThrow(() -> new ResourceNotFoundException("Driver not found"));

            return missionRepository.findByDriver_Id(driver.getId())
                    .stream()
                    .map(MissionDTO::new)
                    .collect(Collectors.toList());
        }

        throw new AccessDeniedException("Forbidden");
    }

    public MissionDTO getMissionById(Long missionId, Authentication auth) {
        Mission mission = getAuthorizedMission(missionId, auth);
        return new MissionDTO(mission);
    }

    public Mission getAuthorizedMission(Long missionId, Authentication auth) {
        Mission mission = missionRepository.findById(missionId)
                .orElseThrow(() -> new ResourceNotFoundException("Mission not found: " + missionId));

        if (auth == null || !auth.isAuthenticated()) {
            throw new AccessDeniedException("Unauthorized");
        }

        if (AuthUtil.hasRole(auth, "ADMIN")) {
            return mission;
        }

        if (AuthUtil.hasRole(auth, "OWNER")) {
            User owner = userRepository.findByEmail(auth.getName())
                    .orElseThrow(() -> new ResourceNotFoundException("Owner not found"));

            if (mission.getOwner() == null || !mission.getOwner().getId().equals(owner.getId())) {
                throw new AccessDeniedException("Not your mission");
            }

            return mission;
        }

        if (AuthUtil.hasRole(auth, "DRIVER")) {
            Driver driver = driverRepository.findByEmail(auth.getName())
                    .orElseThrow(() -> new ResourceNotFoundException("Driver not found"));

            if (mission.getDriver() == null || !mission.getDriver().getId().equals(driver.getId())) {
                throw new AccessDeniedException("Not your mission");
            }

            return mission;
        }

        throw new AccessDeniedException("Forbidden");
    }

    public MissionDTO createMission(MissionDTO dto, Authentication auth) {
        if (!AuthUtil.hasRole(auth, "OWNER") && !AuthUtil.hasRole(auth, "ADMIN")) {
            throw new AccessDeniedException("Forbidden");
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

        Mission saved = missionRepository.save(mission);

        notifyDriverAssigned(saved);

        return new MissionDTO(saved);
    }

    public MissionDTO startMission(Long missionId, Authentication auth) {
        Mission mission = missionRepository.findById(missionId)
                .orElseThrow(() -> new ResourceNotFoundException("Mission not found: " + missionId));

        if (!AuthUtil.hasRole(auth, "DRIVER")) {
            throw new AccessDeniedException("Forbidden");
        }

        Driver driver = driverRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new ResourceNotFoundException("Driver not found"));

        if (mission.getDriver() == null || !mission.getDriver().getId().equals(driver.getId())) {
            throw new AccessDeniedException("Not your mission");
        }

        if (mission.getStatus() != Mission.MissionStatus.PLANNED) {
            throw new IllegalArgumentException("Only planned missions can be started");
        }

        if (mission.getVehicle() == null) {
            throw new IllegalArgumentException("Mission vehicle is missing");
        }

        if (missionRepository.existsByVehicleIdAndStatus(
                mission.getVehicle().getId(),
                Mission.MissionStatus.IN_PROGRESS)) {
            throw new IllegalArgumentException("This vehicle already has an active mission");
        }

        if (missionRepository.existsByDriverIdAndStatus(
                mission.getDriver().getId(),
                Mission.MissionStatus.IN_PROGRESS)) {
            throw new IllegalArgumentException("This driver already has an active mission");
        }

        LocalDateTime now = LocalDateTime.now();
        boolean startedLate = mission.getStartDate() != null && now.isAfter(mission.getStartDate());

        mission.setStatus(Mission.MissionStatus.IN_PROGRESS);

        if (mission.getStartedAt() == null) {
            mission.setStartedAt(now);
        }

        setVehicleInUse(mission.getVehicle());
        mission.setLateAlertSent(false);

        Mission saved = missionRepository.save(mission);

        clearDriverLateAlert(saved);
        notifyOwnerMissionStarted(saved, driver, startedLate);

        return new MissionDTO(saved);
    }

    public MissionDTO finishMission(Long missionId, Authentication auth) {
        Mission mission = missionRepository.findById(missionId)
                .orElseThrow(() -> new ResourceNotFoundException("Mission not found: " + missionId));

        if (!AuthUtil.hasRole(auth, "DRIVER")) {
            throw new AccessDeniedException("Forbidden");
        }

        Driver driver = driverRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new ResourceNotFoundException("Driver not found"));

        if (mission.getDriver() == null || !mission.getDriver().getId().equals(driver.getId())) {
            throw new AccessDeniedException("Not your mission");
        }

        if (mission.getStatus() != Mission.MissionStatus.IN_PROGRESS) {
            throw new IllegalArgumentException("Only missions in progress can be finished");
        }

        mission.setStatus(Mission.MissionStatus.COMPLETED);

        if (mission.getFinishedAt() == null) {
            mission.setFinishedAt(LocalDateTime.now());
        }

        if (mission.getVehicle() != null) {
            setVehicleAvailable(mission.getVehicle());
        }

        mission.setLateAlertSent(false);

        Mission saved = missionRepository.save(mission);

        clearDriverLateAlert(saved);
        notifyOwnerMissionFinished(saved);

        return new MissionDTO(saved);
    }

    public Mission completeMissionFromGps(Mission mission) {
        if (mission == null) {
            return null;
        }

        Mission managed = missionRepository.findById(mission.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Mission not found"));

        if (managed.getStatus() != Mission.MissionStatus.IN_PROGRESS) {
            return managed;
        }

        managed.setStatus(Mission.MissionStatus.COMPLETED);

        if (managed.getFinishedAt() == null) {
            managed.setFinishedAt(LocalDateTime.now());
        }

        if (managed.getVehicle() != null) {
            setVehicleAvailable(managed.getVehicle());
        }

        managed.setLateAlertSent(false);

        Mission saved = missionRepository.save(managed);

        clearDriverLateAlert(saved);
        notifyOwnerMissionFinished(saved);

        return saved;
    }

    public void cancelMission(Long missionId, Authentication auth) {
        Mission mission = missionRepository.findById(missionId)
                .orElseThrow(() -> new ResourceNotFoundException("Mission not found: " + missionId));

        if (!AuthUtil.hasRole(auth, "OWNER") && !AuthUtil.hasRole(auth, "ADMIN")) {
            throw new AccessDeniedException("Forbidden");
        }

        if (AuthUtil.hasRole(auth, "OWNER")) {
            User owner = userRepository.findByEmail(auth.getName())
                    .orElseThrow(() -> new ResourceNotFoundException("Owner not found"));

            if (mission.getOwner() == null || !mission.getOwner().getId().equals(owner.getId())) {
                throw new AccessDeniedException("Not your mission");
            }
        }

        if (mission.getStatus() == Mission.MissionStatus.COMPLETED) {
            throw new IllegalArgumentException("Completed mission cannot be canceled");
        }

        mission.setStatus(Mission.MissionStatus.CANCELED);

        if (mission.getVehicle() != null) {
            setVehicleAvailable(mission.getVehicle());
        }

        mission.setLateAlertSent(false);

        Mission saved = missionRepository.save(mission);

        clearDriverLateAlert(saved);
        notifyDriverCanceled(saved);
    }

    public void deleteMission(Long missionId, Authentication auth) {
        Mission mission = missionRepository.findById(missionId)
                .orElseThrow(() -> new ResourceNotFoundException("Mission not found: " + missionId));

        if (!AuthUtil.hasRole(auth, "OWNER") && !AuthUtil.hasRole(auth, "ADMIN")) {
            throw new AccessDeniedException("Forbidden");
        }

        if (AuthUtil.hasRole(auth, "OWNER")) {
            User owner = userRepository.findByEmail(auth.getName())
                    .orElseThrow(() -> new ResourceNotFoundException("Owner not found"));

            if (mission.getOwner() == null || !mission.getOwner().getId().equals(owner.getId())) {
                throw new AccessDeniedException("Not your mission");
            }
        }

        if (mission.getStatus() == Mission.MissionStatus.IN_PROGRESS) {
            throw new IllegalArgumentException("Cannot delete an in-progress mission");
        }

        clearDriverLateAlert(mission);
        missionRepository.delete(mission);
    }

    public MissionDTO updateMission(Long missionId, MissionDTO dto, Authentication auth) {
        if (!AuthUtil.hasRole(auth, "OWNER") && !AuthUtil.hasRole(auth, "ADMIN")) {
            throw new AccessDeniedException("Forbidden");
        }

        Mission mission = getAuthorizedMission(missionId, auth);

        if (mission.getStatus() != Mission.MissionStatus.PLANNED) {
            throw new IllegalArgumentException("Only planned missions can be edited");
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

        Mission saved = missionRepository.save(mission);

        notifyDriverUpdated(saved);

        return new MissionDTO(saved);
    }

    private void setVehicleInUse(Vehicle vehicle) {
        try {
            vehicle.setStatus(Vehicle.VehicleStatus.IN_USE);
            vehicleRepository.save(vehicle);
        } catch (Exception ignored) {
        }
    }

    private void setVehicleAvailable(Vehicle vehicle) {
        try {
            vehicle.setStatus(Vehicle.VehicleStatus.AVAILABLE);
            vehicleRepository.save(vehicle);
        } catch (Exception ignored) {
        }
    }

    private void notifyDriverAssigned(Mission mission) {
        User driverUser = findDriverUser(mission);
        if (driverUser == null) return;

        notificationService.createUniqueForUser(
                driverUser.getId(),
                NotificationService.DRIVER_ASSIGNED_TITLE,
                "Une nouvelle mission vous a été assignée : " + safeMissionTitle(mission),
                mission.getId()
        );
    }

    private void notifyDriverUpdated(Mission mission) {
        User driverUser = findDriverUser(mission);
        if (driverUser == null) return;

        notificationService.createForUser(
                driverUser.getId(),
                NotificationService.DRIVER_UPDATED_TITLE,
                "La mission a été modifiée : " + safeMissionTitle(mission),
                mission.getId()
        );
    }

    private void notifyDriverCanceled(Mission mission) {
        User driverUser = findDriverUser(mission);
        if (driverUser == null) return;

        notificationService.createForUser(
                driverUser.getId(),
                NotificationService.DRIVER_CANCELED_TITLE,
                "La mission a été annulée : " + safeMissionTitle(mission),
                mission.getId()
        );
    }

    private void notifyOwnerMissionStarted(Mission mission, Driver driver, boolean startedLate) {
        if (mission.getOwner() == null) return;

        notificationService.createForUser(
                mission.getOwner().getId(),
                NotificationService.OWNER_STARTED_TITLE,
                "La mission a démarré : " + safeMissionTitle(mission),
                mission.getId()
        );

        if (startedLate) {
            notificationService.createUniqueForUser(
                    mission.getOwner().getId(),
                    NotificationService.OWNER_LATE_START_TITLE,
                    "Le driver " + buildDriverName(driver) + " a démarré en retard la mission : " + safeMissionTitle(mission),
                    mission.getId()
            );
        }
    }

    private void notifyOwnerMissionFinished(Mission mission) {
        if (mission.getOwner() == null) return;

        notificationService.createForUser(
                mission.getOwner().getId(),
                NotificationService.OWNER_FINISHED_TITLE,
                "La mission est terminée : " + safeMissionTitle(mission),
                mission.getId()
        );
    }

    private void clearDriverLateAlert(Mission mission) {
        User driverUser = findDriverUser(mission);
        if (driverUser == null || mission.getId() == null) return;

        notificationService.clearNotificationByTitle(
                driverUser.getId(),
                mission.getId(),
                NotificationService.DRIVER_LATE_ALERT_TITLE
        );
    }

    private User findDriverUser(Mission mission) {
        if (mission == null || mission.getDriver() == null) return null;

        String email = mission.getDriver().getEmail();
        if (email == null || email.isBlank()) return null;

        return userRepository.findByEmail(email).orElse(null);
    }

    private String safeMissionTitle(Mission mission) {
        if (mission == null) return "Mission";
        if (mission.getTitle() != null && !mission.getTitle().isBlank()) {
            return mission.getTitle();
        }
        return "Mission #" + mission.getId();
    }

    private String buildDriverName(Driver driver) {
        if (driver == null) return "Driver";

        String firstName = null;
        String lastName = null;

        try {
            firstName = driver.getFirstName();
            lastName = driver.getLastName();
        } catch (Exception ignored) {
        }

        String fullName = ((firstName != null ? firstName : "") + " " + (lastName != null ? lastName : "")).trim();

        if (!fullName.isBlank()) {
            return fullName;
        }

        if (driver.getEmail() != null && !driver.getEmail().isBlank()) {
            return driver.getEmail();
        }

        return "Driver";
    }
}