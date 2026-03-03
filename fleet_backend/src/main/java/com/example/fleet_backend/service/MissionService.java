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

    public MissionService(
            MissionRepository missionRepository,
            VehicleRepository vehicleRepository,
            DriverRepository driverRepository,
            UserRepository userRepository,
            NotificationService notificationService
    ) {
        this.missionRepository = missionRepository;
        this.vehicleRepository = vehicleRepository;
        this.driverRepository = driverRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    public List<MissionDTO> list(Authentication auth) {
        if (AuthUtil.isAdmin(auth)) {
            return missionRepository.findAll().stream().map(MissionDTO::new).collect(Collectors.toList());
        }

        if (AuthUtil.hasRole(auth, "OWNER")) {
            Long ownerId = AuthUtil.userId(auth);
            return missionRepository.findByOwnerId(ownerId).stream().map(MissionDTO::new).collect(Collectors.toList());
        }

        if (AuthUtil.hasRole(auth, "DRIVER")) {
            String email = auth.getName();
            Driver driver = driverRepository.findByEmail(email)
                    .orElseThrow(() -> new ResourceNotFoundException("Driver not found for email: " + email));
            return missionRepository.findByDriverId(driver.getId()).stream().map(MissionDTO::new).collect(Collectors.toList());
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

        Vehicle v = vehicleRepository.findById(dto.getVehicleId())
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found: " + dto.getVehicleId()));

        Driver d = driverRepository.findById(dto.getDriverId())
                .orElseThrow(() -> new ResourceNotFoundException("Driver not found: " + dto.getDriverId()));

        // ✅ OWNER create: check ownership of vehicle
        if (!AuthUtil.isAdmin(auth)) {
            Long ownerId = AuthUtil.userId(auth);
            if (v.getOwner() == null || !v.getOwner().getId().equals(ownerId)) {
                throw new AccessDeniedException("Not your vehicle");
            }
        }

        // ✅ Overlap checks (ignore DONE/CANCELED)
        if (missionRepository.existsVehicleOverlap(v.getId(), dto.getStartDate(), dto.getEndDate())) {
            throw new IllegalArgumentException("Vehicle is already assigned to another mission in this period");
        }
        if (missionRepository.existsDriverOverlap(d.getId(), dto.getStartDate(), dto.getEndDate())) {
            throw new IllegalArgumentException("Driver is already assigned to another mission in this period");
        }

        // ✅ owner = vehicle.owner (IMPORTANT especially if ADMIN creates)
        if (v.getOwner() == null) {
            throw new IllegalArgumentException("Vehicle has no owner");
        }
        User owner = userRepository.findById(v.getOwner().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Owner user not found: " + v.getOwner().getId()));

        Mission m = new Mission();
        m.setTitle(dto.getTitle() == null || dto.getTitle().isBlank() ? "Mission" : dto.getTitle());
        m.setDescription(dto.getDescription());
        m.setStartDate(dto.getStartDate());
        m.setEndDate(dto.getEndDate());
        m.setStatus(dto.getStatus() == null ? Mission.MissionStatus.PLANNED : dto.getStatus());
        m.setVehicle(v);
        m.setDriver(d);
        m.setOwner(owner);

        Mission saved = missionRepository.save(m);

        // ✅ Notify DRIVER ONLY (owner will NOT receive this)
        User driverUser = userRepository.findByEmail(d.getEmail()).orElse(null);
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
        Mission m = missionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Mission not found: " + id));

        // ✅ ADMIN ok
        if (AuthUtil.isAdmin(auth)) {
            m.setStatus(status);
            return new MissionDTO(missionRepository.save(m));
        }

        // ✅ OWNER: only own missions
        if (AuthUtil.hasRole(auth, "OWNER")) {
            Long ownerId = AuthUtil.userId(auth);
            if (m.getOwner() == null || !m.getOwner().getId().equals(ownerId)) {
                throw new AccessDeniedException("Not your mission");
            }
            m.setStatus(status);
            return new MissionDTO(missionRepository.save(m));
        }

        // ✅ DRIVER: only his missions
        if (AuthUtil.hasRole(auth, "DRIVER")) {
            String email = auth.getName();
            Driver driver = driverRepository.findByEmail(email)
                    .orElseThrow(() -> new ResourceNotFoundException("Driver not found for email: " + email));
            if (m.getDriver() == null || !m.getDriver().getId().equals(driver.getId())) {
                throw new AccessDeniedException("Not your mission");
            }
            m.setStatus(status);
            return new MissionDTO(missionRepository.save(m));
        }

        throw new AccessDeniedException("Forbidden");
    }

    public void delete(Long id, Authentication auth) {
        Mission m = missionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Mission not found: " + id));

        // ✅ Keep info BEFORE delete
        Driver driver = m.getDriver();
        User owner = m.getOwner();
        String missionTitle = m.getTitle();
        Long missionId = m.getId();

        // ✅ ADMIN can delete any
        if (AuthUtil.isAdmin(auth)) {
            missionRepository.delete(m);

            // (OPTIONNEL) notify driver even when admin deletes
            if (driver != null && driver.getEmail() != null) {
                User driverUser = userRepository.findByEmail(driver.getEmail()).orElse(null);
                if (driverUser != null) {
                    notificationService.createForUser(
                            driverUser.getId(),
                            "Mission canceled",
                            "Mission was canceled: " + (missionTitle != null ? missionTitle : ("#" + missionId)),
                            null // mission deleted, so no missionId link
                    );
                }
            }
            return;
        }

        // ✅ OWNER can delete only own missions
        if (AuthUtil.hasRole(auth, "OWNER")) {
            Long ownerId = AuthUtil.userId(auth);
            if (owner == null || !owner.getId().equals(ownerId)) {
                throw new AccessDeniedException("Not your mission");
            }

            missionRepository.delete(m);

            // ✅ Notify DRIVER (owner deleted mission)
            if (driver != null && driver.getEmail() != null) {
                User driverUser = userRepository.findByEmail(driver.getEmail()).orElse(null);
                if (driverUser != null) {
                    notificationService.createForUser(
                            driverUser.getId(),
                            "Mission canceled",
                            "Owner canceled mission: " + (missionTitle != null ? missionTitle : ("#" + missionId)),
                            null // mission removed => no link
                    );
                }
            }
            return;
        }

        throw new AccessDeniedException("Forbidden");
    }

    public MissionDTO startMission(Long missionId, Authentication auth) {
        Mission m = missionRepository.findById(missionId)
                .orElseThrow(() -> new ResourceNotFoundException("Mission not found: " + missionId));

        if (!AuthUtil.hasRole(auth, "DRIVER")) throw new AccessDeniedException("Forbidden");

        String email = auth.getName();
        Driver driver = driverRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Driver not found for email: " + email));

        if (m.getDriver() == null || !m.getDriver().getId().equals(driver.getId())) {
            throw new AccessDeniedException("Not your mission");
        }

        if (m.getStatus() == Mission.MissionStatus.DONE || m.getStatus() == Mission.MissionStatus.CANCELED) {
            throw new IllegalArgumentException("Mission already finished/canceled");
        }

        m.setStatus(Mission.MissionStatus.IN_PROGRESS);
        if (m.getStartedAt() == null) m.setStartedAt(LocalDateTime.now());

        Mission saved = missionRepository.save(m);

        // ✅ Notify OWNER ONLY (driver will NOT receive this)
        Long ownerId = saved.getOwner().getId();
        notificationService.createForUser(
                ownerId,
                "Mission started",
                "Driver started mission: " + saved.getTitle(),
                saved.getId()
        );

        return new MissionDTO(saved);
    }

    public MissionDTO finishMission(Long missionId, Authentication auth) {
        Mission m = missionRepository.findById(missionId)
                .orElseThrow(() -> new ResourceNotFoundException("Mission not found: " + missionId));

        if (!AuthUtil.hasRole(auth, "DRIVER")) throw new AccessDeniedException("Forbidden");

        String email = auth.getName();
        Driver driver = driverRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Driver not found for email: " + email));

        if (m.getDriver() == null || !m.getDriver().getId().equals(driver.getId())) {
            throw new AccessDeniedException("Not your mission");
        }

        if (m.getStatus() == Mission.MissionStatus.DONE) throw new IllegalArgumentException("Already done");
        if (m.getStatus() == Mission.MissionStatus.CANCELED) throw new IllegalArgumentException("Canceled");

        m.setStatus(Mission.MissionStatus.DONE);
        if (m.getFinishedAt() == null) m.setFinishedAt(LocalDateTime.now());

        Mission saved = missionRepository.save(m);

        // ✅ Notify OWNER ONLY
        Long ownerId = saved.getOwner().getId();
        notificationService.createForUser(
                ownerId,
                "Mission finished",
                "Driver finished mission: " + saved.getTitle(),
                saved.getId()
        );

        return new MissionDTO(saved);
    }
}