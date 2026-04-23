package com.example.fleet_backend.service;

import com.example.fleet_backend.dto.MissionDTO;
import com.example.fleet_backend.exception.ResourceNotFoundException;
import com.example.fleet_backend.model.Driver;
import com.example.fleet_backend.model.Mission;
import com.example.fleet_backend.model.User;
import com.example.fleet_backend.repository.DriverRepository;
import com.example.fleet_backend.repository.MissionRepository;
import com.example.fleet_backend.repository.UserRepository;
import com.example.fleet_backend.security.AuthUtil;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class MissionService {

    private final MissionRepository missionRepository;
    private final UserRepository userRepository;
    private final DriverRepository driverRepository;

    private final MissionAccessService missionAccessService;
    private final MissionPlanningService missionPlanningService;
    private final MissionLifecycleService missionLifecycleService;
    private final MissionNotificationService missionNotificationService;

    public MissionService(MissionRepository missionRepository,
                          UserRepository userRepository,
                          DriverRepository driverRepository,
                          MissionAccessService missionAccessService,
                          MissionPlanningService missionPlanningService,
                          MissionLifecycleService missionLifecycleService,
                          MissionNotificationService missionNotificationService) {
        this.missionRepository = missionRepository;
        this.userRepository = userRepository;
        this.driverRepository = driverRepository;
        this.missionAccessService = missionAccessService;
        this.missionPlanningService = missionPlanningService;
        this.missionLifecycleService = missionLifecycleService;
        this.missionNotificationService = missionNotificationService;
    }

    public List<MissionDTO> getMissions(Authentication auth) {
        if (AuthUtil.hasRole(auth, "ADMIN")) {
            return missionRepository.findAll().stream().map(MissionDTO::new).collect(Collectors.toList());
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
        Mission mission = missionAccessService.getAuthorizedMission(missionId, auth);
        return new MissionDTO(mission);
    }

    public Mission getAuthorizedMission(Long missionId, Authentication auth) {
        return missionAccessService.getAuthorizedMission(missionId, auth);
    }

    public MissionDTO createMission(MissionDTO dto, Authentication auth) {
        if (!AuthUtil.hasRole(auth, "OWNER") && !AuthUtil.hasRole(auth, "ADMIN")) {
            throw new AccessDeniedException("Forbidden");
        }

        Mission saved = missionPlanningService.createMission(dto, auth);
        missionNotificationService.notifyDriverAssigned(saved);
        return new MissionDTO(saved);
    }

    public MissionDTO updateMission(Long missionId, MissionDTO dto, Authentication auth) {
        if (!AuthUtil.hasRole(auth, "OWNER") && !AuthUtil.hasRole(auth, "ADMIN")) {
            throw new AccessDeniedException("Forbidden");
        }

        Mission mission = missionAccessService.getAuthorizedMission(missionId, auth);
        Mission saved = missionPlanningService.updateMission(mission, dto, auth);
        missionNotificationService.notifyDriverUpdated(saved);
        return new MissionDTO(saved);
    }

    public MissionDTO startMission(Long missionId, Authentication auth) {
        Mission mission = missionRepository.findById(missionId)
                .orElseThrow(() -> new ResourceNotFoundException("Mission not found: " + missionId));

        Driver driver = driverRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new ResourceNotFoundException("Driver not found"));

        boolean startedLate = mission.getStartDate() != null && java.time.LocalDateTime.now().isAfter(mission.getStartDate());

        Mission saved = missionLifecycleService.startMission(mission, auth);
        missionNotificationService.clearDriverLateAlert(saved);
        missionNotificationService.notifyOwnerMissionStarted(saved, driver, startedLate);

        return new MissionDTO(saved);
    }

    public MissionDTO finishMission(Long missionId, Authentication auth) {
        Mission mission = missionRepository.findById(missionId)
                .orElseThrow(() -> new ResourceNotFoundException("Mission not found: " + missionId));

        Mission saved = missionLifecycleService.finishMission(mission, auth);
        missionNotificationService.clearDriverLateAlert(saved);
        missionNotificationService.notifyOwnerMissionFinished(saved);

        return new MissionDTO(saved);
    }

    public Mission completeMissionFromGps(Mission mission) {
        Mission saved = missionLifecycleService.completeMissionFromGps(mission);
        if (saved != null) {
            missionNotificationService.clearDriverLateAlert(saved);
            missionNotificationService.notifyOwnerMissionFinished(saved);
        }
        return saved;
    }

    public void cancelMission(Long missionId, Authentication auth) {
        if (!AuthUtil.hasRole(auth, "OWNER") && !AuthUtil.hasRole(auth, "ADMIN")) {
            throw new AccessDeniedException("Forbidden");
        }

        Mission mission = missionAccessService.getAuthorizedMission(missionId, auth);
        Mission saved = missionLifecycleService.cancelMission(mission);
        missionNotificationService.clearDriverLateAlert(saved);
        missionNotificationService.notifyDriverCanceled(saved);
    }

    public void deleteMission(Long missionId, Authentication auth) {
        if (!AuthUtil.hasRole(auth, "OWNER") && !AuthUtil.hasRole(auth, "ADMIN")) {
            throw new AccessDeniedException("Forbidden");
        }

        Mission mission = missionAccessService.getAuthorizedMission(missionId, auth);

        if (mission.getStatus() == Mission.MissionStatus.IN_PROGRESS) {
            throw new IllegalArgumentException("Cannot delete an in-progress mission");
        }

        missionNotificationService.clearDriverLateAlert(mission);
        missionRepository.delete(mission);
    }
}