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

    public MissionService(MissionRepository missionRepository,
                          VehicleRepository vehicleRepository,
                          DriverRepository driverRepository,
                          UserRepository userRepository) {
        this.missionRepository = missionRepository;
        this.vehicleRepository = vehicleRepository;
        this.driverRepository = driverRepository;
        this.userRepository = userRepository;
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

    public MissionDTO createMission(MissionDTO dto, Authentication auth) {
        if (!AuthUtil.hasRole(auth, "OWNER") && !AuthUtil.hasRole(auth, "ADMIN")) {
            throw new AccessDeniedException("Forbidden");
        }

        if (dto.getVehicleId() == null) {
            throw new IllegalArgumentException("vehicleId is required");
        }
        if (dto.getDriverId() == null) {
            throw new IllegalArgumentException("driverId is required");
        }
        if (dto.getStartDate() == null || dto.getEndDate() == null) {
            throw new IllegalArgumentException("startDate and endDate are required");
        }
        if (!dto.getEndDate().isAfter(dto.getStartDate())) {
            throw new IllegalArgumentException("endDate must be after startDate");
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
        }

        if (missionRepository.existsVehicleOverlap(vehicle.getId(), dto.getStartDate(), dto.getEndDate())) {
            throw new IllegalArgumentException("Vehicle already assigned on this time range");
        }

        if (missionRepository.existsDriverOverlap(driver.getId(), dto.getStartDate(), dto.getEndDate())) {
            throw new IllegalArgumentException("Driver already assigned on this time range");
        }

        Mission mission = new Mission();
        mission.setTitle(dto.getTitle());
        mission.setDescription(dto.getDescription());
        mission.setDeparture(dto.getDeparture());
        mission.setDestination(dto.getDestination());
        mission.setStartDate(dto.getStartDate());
        mission.setEndDate(dto.getEndDate());
        mission.setOwner(owner);
        mission.setDriver(driver);
        mission.setVehicle(vehicle);
        mission.setRouteJson(dto.getRouteJson());
        mission.setStatus(Mission.MissionStatus.PLANNED);
        mission.setLateAlertSent(false);

        Mission saved = missionRepository.save(mission);
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

        mission.setStatus(Mission.MissionStatus.IN_PROGRESS);
        if (mission.getStartedAt() == null) {
            mission.setStartedAt(LocalDateTime.now());
        }

        if (mission.getVehicle() != null) {
            setVehicleInUse(mission.getVehicle());
        }

        Mission saved = missionRepository.save(mission);
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

        Mission saved = missionRepository.save(mission);
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

        return missionRepository.save(managed);
    }

    public void cancelMission(Long missionId, Authentication auth) {
        Mission mission = missionRepository.findById(missionId)
                .orElseThrow(() -> new ResourceNotFoundException("Mission not found"));

        if (!AuthUtil.hasRole(auth, "OWNER") && !AuthUtil.hasRole(auth, "ADMIN")) {
            throw new AccessDeniedException("Forbidden");
        }

        if (AuthUtil.hasRole(auth, "OWNER")) {
            User owner = userRepository.findByEmail(auth.getName())
                    .orElseThrow(() -> new ResourceNotFoundException("Owner not found"));
            if (mission.getOwner() == null || !mission.getOwner().getId().equals(owner.getId())) {
                throw new AccessDeniedException("Forbidden");
            }
        }

        mission.setStatus(Mission.MissionStatus.CANCELED);
        if (mission.getVehicle() != null) {
            setVehicleAvailable(mission.getVehicle());
        }
        missionRepository.save(mission);
    }

    public void deleteMission(Long missionId, Authentication auth) {
        Mission mission = missionRepository.findById(missionId)
                .orElseThrow(() -> new ResourceNotFoundException("Mission not found"));

        if (!AuthUtil.hasRole(auth, "OWNER") && !AuthUtil.hasRole(auth, "ADMIN")) {
            throw new AccessDeniedException("Forbidden");
        }

        if (AuthUtil.hasRole(auth, "OWNER")) {
            User owner = userRepository.findByEmail(auth.getName())
                    .orElseThrow(() -> new ResourceNotFoundException("Owner not found"));
            if (mission.getOwner() == null || !mission.getOwner().getId().equals(owner.getId())) {
                throw new AccessDeniedException("Forbidden");
            }
        }

        missionRepository.delete(mission);
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