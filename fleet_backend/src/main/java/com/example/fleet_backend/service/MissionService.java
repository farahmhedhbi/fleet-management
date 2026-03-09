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

    private final MissionRepository missionRepository;
    private final VehicleRepository vehicleRepository;
    private final DriverRepository driverRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public MissionService(MissionRepository missionRepository,
                          VehicleRepository vehicleRepository,
                          DriverRepository driverRepository,
                          UserRepository userRepository,
                          NotificationService notificationService) {
        this.missionRepository = missionRepository;
        this.vehicleRepository = vehicleRepository;
        this.driverRepository = driverRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    public List<MissionDTO> list(Authentication auth) {
        if (AuthUtil.isAdmin(auth)) {
            return missionRepository.findAll()
                    .stream()
                    .map(MissionDTO::new)
                    .collect(Collectors.toList());
        }

        if (AuthUtil.hasRole(auth, "OWNER")) {
            Long ownerId = AuthUtil.userId(auth);
            return missionRepository.findByOwnerId(ownerId)
                    .stream()
                    .map(MissionDTO::new)
                    .collect(Collectors.toList());
        }

        if (AuthUtil.hasRole(auth, "DRIVER")) {
            String email = auth.getName();
            Driver driver = driverRepository.findByEmail(email)
                    .orElseThrow(() -> new ResourceNotFoundException("Driver not found for email: " + email));

            return missionRepository.findByDriverId(driver.getId())
                    .stream()
                    .map(MissionDTO::new)
                    .collect(Collectors.toList());
        }

        throw new AccessDeniedException("Forbidden");
    }

    public MissionDTO create(MissionDTO dto, Authentication auth) {
        if (!(AuthUtil.isAdmin(auth) || AuthUtil.hasRole(auth, "OWNER"))) {
            throw new AccessDeniedException("Forbidden");
        }

        if (dto.getStartDate() == null || dto.getEndDate() == null) {
            throw new IllegalArgumentException("startDate and endDate are required");
        }

        if (!dto.getEndDate().isAfter(dto.getStartDate())) {
            throw new IllegalArgumentException("endDate must be after startDate");
        }

        if (dto.getVehicleId() == null || dto.getDriverId() == null) {
            throw new IllegalArgumentException("vehicleId and driverId are required");
        }

        Vehicle vehicle = vehicleRepository.findById(dto.getVehicleId())
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found: " + dto.getVehicleId()));

        Driver driver = driverRepository.findById(dto.getDriverId())
                .orElseThrow(() -> new ResourceNotFoundException("Driver not found: " + dto.getDriverId()));

        if (!AuthUtil.isAdmin(auth)) {
            Long ownerId = AuthUtil.userId(auth);
            if (vehicle.getOwner() == null || !vehicle.getOwner().getId().equals(ownerId)) {
                throw new AccessDeniedException("Not your vehicle");
            }
        }

        if (missionRepository.existsVehicleOverlap(vehicle.getId(), dto.getStartDate(), dto.getEndDate())) {
            throw new IllegalArgumentException("Vehicle is already assigned to another mission in this period");
        }

        if (missionRepository.existsDriverOverlap(driver.getId(), dto.getStartDate(), dto.getEndDate())) {
            throw new IllegalArgumentException("Driver is already assigned to another mission in this period");
        }

        if (vehicle.getOwner() == null) {
            throw new IllegalArgumentException("Vehicle has no owner");
        }

        User owner = userRepository.findById(vehicle.getOwner().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Owner user not found: " + vehicle.getOwner().getId()));

        Mission mission = new Mission();
        mission.setTitle(dto.getTitle() == null || dto.getTitle().isBlank() ? "Mission" : dto.getTitle());
        mission.setDescription(dto.getDescription());
        mission.setStartDate(dto.getStartDate());
        mission.setEndDate(dto.getEndDate());
        mission.setStatus(dto.getStatus() == null ? Mission.MissionStatus.PLANNED : dto.getStatus());
        mission.setVehicle(vehicle);
        mission.setDriver(driver);
        mission.setOwner(owner);
        mission.setLateAlertSent(false);

        Mission saved = missionRepository.save(mission);

        User driverUser = userRepository.findByEmail(driver.getEmail()).orElse(null);
        if (driverUser != null) {
            notificationService.createForUser(
                    driverUser.getId(),
                    "New mission assigned",
                    "You have been assigned to mission: " + saved.getTitle(),
                    saved.getId()
            );
        }

        return new MissionDTO(saved);
    }

    public MissionDTO updateStatus(Long id, Mission.MissionStatus status, Authentication auth) {
        Mission mission = missionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Mission not found: " + id));

        if (AuthUtil.isAdmin(auth)) {
            applyStatusSideEffects(mission, status);
            return new MissionDTO(missionRepository.save(mission));
        }

        if (AuthUtil.hasRole(auth, "OWNER")) {
            Long ownerId = AuthUtil.userId(auth);
            if (mission.getOwner() == null || !mission.getOwner().getId().equals(ownerId)) {
                throw new AccessDeniedException("Not your mission");
            }

            applyStatusSideEffects(mission, status);
            return new MissionDTO(missionRepository.save(mission));
        }

        if (AuthUtil.hasRole(auth, "DRIVER")) {
            throw new AccessDeniedException("Driver cannot update mission status manually");
        }

        throw new AccessDeniedException("Forbidden");
    }

    public void delete(Long id, Authentication auth) {
        Mission mission = missionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Mission not found: " + id));

        Driver driver = mission.getDriver();
        String missionTitle = mission.getTitle();
        Long missionId = mission.getId();
        Vehicle vehicle = mission.getVehicle();

        if (AuthUtil.isAdmin(auth)) {
            clearDriverLateAlert(driver, missionId);

            if (vehicle != null) {
                setVehicleAvailable(vehicle);
            }

            missionRepository.delete(mission);

            if (driver != null && driver.getEmail() != null) {
                User driverUser = userRepository.findByEmail(driver.getEmail()).orElse(null);
                if (driverUser != null) {
                    notificationService.createForUser(
                            driverUser.getId(),
                            "Mission canceled",
                            "Mission was canceled: " + (missionTitle != null ? missionTitle : ("#" + missionId)),
                            null
                    );
                }
            }
            return;
        }

        if (AuthUtil.hasRole(auth, "OWNER")) {
            Long ownerId = AuthUtil.userId(auth);
            if (mission.getOwner() == null || !mission.getOwner().getId().equals(ownerId)) {
                throw new AccessDeniedException("Not your mission");
            }

            clearDriverLateAlert(driver, missionId);

            if (vehicle != null) {
                setVehicleAvailable(vehicle);
            }

            missionRepository.delete(mission);

            if (driver != null && driver.getEmail() != null) {
                User driverUser = userRepository.findByEmail(driver.getEmail()).orElse(null);
                if (driverUser != null) {
                    notificationService.createForUser(
                            driverUser.getId(),
                            "Mission canceled",
                            "Owner canceled mission: " + (missionTitle != null ? missionTitle : ("#" + missionId)),
                            null
                    );
                }
            }
            return;
        }

        throw new AccessDeniedException("Forbidden");
    }

    public MissionDTO startMission(Long missionId, Authentication auth) {
        Mission mission = missionRepository.findById(missionId)
                .orElseThrow(() -> new ResourceNotFoundException("Mission not found: " + missionId));

        if (!AuthUtil.hasRole(auth, "DRIVER")) {
            throw new AccessDeniedException("Forbidden");
        }

        String email = auth.getName();
        Driver driver = driverRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Driver not found for email: " + email));

        if (mission.getDriver() == null || !mission.getDriver().getId().equals(driver.getId())) {
            throw new AccessDeniedException("Not your mission");
        }

        if (mission.getStatus() == Mission.MissionStatus.DONE) {
            throw new IllegalArgumentException("Mission already finished");
        }

        if (mission.getStatus() == Mission.MissionStatus.CANCELED) {
            throw new IllegalArgumentException("Mission is canceled");
        }

        if (mission.getStatus() == Mission.MissionStatus.IN_PROGRESS) {
            throw new IllegalArgumentException("Mission already started");
        }

        if (mission.getStatus() != Mission.MissionStatus.PLANNED) {
            throw new IllegalArgumentException("Only planned missions can be started");
        }

        if (mission.getStartDate() != null && LocalDateTime.now().isBefore(mission.getStartDate())) {
            throw new IllegalArgumentException(
                    "This mission cannot be started before its scheduled start time: " + mission.getStartDate()
            );
        }

        // ✅ vérifier si le démarrage est en retard
        boolean startedLate = mission.getStartDate() != null && LocalDateTime.now().isAfter(mission.getStartDate());

        mission.setStatus(Mission.MissionStatus.IN_PROGRESS);

        if (mission.getStartedAt() == null) {
            mission.setStartedAt(LocalDateTime.now());
        }

        if (mission.getVehicle() != null) {
            setVehicleInUse(mission.getVehicle());
        }

        mission.setLateAlertSent(false);
        clearDriverLateAlert(driver, mission.getId());

        Mission saved = missionRepository.save(mission);

        // ✅ notifier le owner seulement si la mission a démarré en retard
        if (startedLate && saved.getOwner() != null) {
            String driverName = buildDriverName(driver);
            notificationService.createForUser(
                    saved.getOwner().getId(),
                    "Mission démarrée en retard",
                    "Le driver " + driverName + " a démarré en retard la mission : " + saved.getTitle(),
                    saved.getId()
            );
        }

        return new MissionDTO(saved);
    }

    public MissionDTO finishMission(Long missionId, Authentication auth) {
        Mission mission = missionRepository.findById(missionId)
                .orElseThrow(() -> new ResourceNotFoundException("Mission not found: " + missionId));

        if (!AuthUtil.hasRole(auth, "DRIVER")) {
            throw new AccessDeniedException("Forbidden");
        }

        String email = auth.getName();
        Driver driver = driverRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Driver not found for email: " + email));

        if (mission.getDriver() == null || !mission.getDriver().getId().equals(driver.getId())) {
            throw new AccessDeniedException("Not your mission");
        }

        if (mission.getStatus() == Mission.MissionStatus.DONE) {
            throw new IllegalArgumentException("Mission already finished");
        }

        if (mission.getStatus() == Mission.MissionStatus.CANCELED) {
            throw new IllegalArgumentException("Mission is canceled");
        }

        if (mission.getStatus() != Mission.MissionStatus.IN_PROGRESS) {
            throw new IllegalArgumentException("Only missions in progress can be finished");
        }

        if (mission.getEndDate() != null && LocalDateTime.now().isBefore(mission.getEndDate())) {
            throw new IllegalArgumentException(
                    "You can finish this mission only at " + mission.getEndDate()
            );
        }

        mission.setStatus(Mission.MissionStatus.DONE);

        if (mission.getFinishedAt() == null) {
            mission.setFinishedAt(LocalDateTime.now());
        }

        if (mission.getVehicle() != null) {
            setVehicleAvailable(mission.getVehicle());
        }

        mission.setLateAlertSent(false);
        clearDriverLateAlert(driver, mission.getId());

        Mission saved = missionRepository.save(mission);
        return new MissionDTO(saved);
    }

    private void applyStatusSideEffects(Mission mission, Mission.MissionStatus status) {
        mission.setStatus(status);

        if (status == Mission.MissionStatus.IN_PROGRESS) {
            if (mission.getStartedAt() == null) {
                mission.setStartedAt(LocalDateTime.now());
            }
            if (mission.getVehicle() != null) {
                setVehicleInUse(mission.getVehicle());
            }
            mission.setLateAlertSent(false);
            clearDriverLateAlert(mission.getDriver(), mission.getId());
        }

        if (status == Mission.MissionStatus.DONE) {
            if (mission.getFinishedAt() == null) {
                mission.setFinishedAt(LocalDateTime.now());
            }
            if (mission.getVehicle() != null) {
                setVehicleAvailable(mission.getVehicle());
            }
            mission.setLateAlertSent(false);
            clearDriverLateAlert(mission.getDriver(), mission.getId());
        }

        if (status == Mission.MissionStatus.CANCELED) {
            if (mission.getVehicle() != null) {
                setVehicleAvailable(mission.getVehicle());
            }
            mission.setLateAlertSent(false);
            clearDriverLateAlert(mission.getDriver(), mission.getId());
        }
    }

    private void clearDriverLateAlert(Driver driver, Long missionId) {
        if (driver == null || driver.getEmail() == null || driver.getEmail().isBlank() || missionId == null) {
            return;
        }

        User driverUser = userRepository.findByEmail(driver.getEmail()).orElse(null);
        if (driverUser == null) {
            return;
        }

        notificationService.clearNotificationByTitle(
                driverUser.getId(),
                missionId,
                NotificationService.DRIVER_LATE_ALERT_TITLE
        );
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

    private void setVehicleInUse(Vehicle vehicle) {
        vehicle.setStatus(Vehicle.VehicleStatus.IN_USE);
        vehicleRepository.save(vehicle);
    }

    private void setVehicleAvailable(Vehicle vehicle) {
        vehicle.setStatus(Vehicle.VehicleStatus.AVAILABLE);
        vehicleRepository.save(vehicle);
    }
}