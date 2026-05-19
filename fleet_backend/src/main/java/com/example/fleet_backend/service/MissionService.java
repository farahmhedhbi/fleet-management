package com.example.fleet_backend.service;

import com.example.fleet_backend.dto.MissionDTO;
import com.example.fleet_backend.dto.RouteCheckResultDTO;
import com.example.fleet_backend.exception.ResourceNotFoundException;
import com.example.fleet_backend.model.Driver;
import com.example.fleet_backend.model.Mission;
import com.example.fleet_backend.model.User;
import com.example.fleet_backend.repository.DriverRepository;
import com.example.fleet_backend.repository.MissionRepository;
import com.example.fleet_backend.repository.UserRepository;
import com.example.fleet_backend.security.AuthUtil;
import com.example.fleet_backend.websocket.DashboardWebSocketPublisher;
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
    private final UserRepository userRepository;
    private final DriverRepository driverRepository;

    private final MissionAccessService missionAccessService;
    private final MissionPlanningService missionPlanningService;
    private final MissionLifecycleService missionLifecycleService;
    private final MissionNotificationService missionNotificationService;
    private final RouteVerificationService routeVerificationService;
    private final DashboardWebSocketPublisher dashboardWebSocketPublisher;

    public MissionService(
            MissionRepository missionRepository,
            UserRepository userRepository,
            DriverRepository driverRepository,
            MissionAccessService missionAccessService,
            MissionPlanningService missionPlanningService,
            MissionLifecycleService missionLifecycleService,
            MissionNotificationService missionNotificationService,
            RouteVerificationService routeVerificationService,
            DashboardWebSocketPublisher dashboardWebSocketPublisher
    ) {
        this.missionRepository = missionRepository;
        this.userRepository = userRepository;
        this.driverRepository = driverRepository;
        this.missionAccessService = missionAccessService;
        this.missionPlanningService = missionPlanningService;
        this.missionLifecycleService = missionLifecycleService;
        this.missionNotificationService = missionNotificationService;
        this.routeVerificationService = routeVerificationService;
        this.dashboardWebSocketPublisher = dashboardWebSocketPublisher;
    }

    @Transactional(readOnly = true)
    public List<MissionDTO> getMissions(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            throw new AccessDeniedException("Unauthorized");
        }

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

    @Transactional(readOnly = true)
    public MissionDTO getMissionById(Long missionId, Authentication auth) {
        Mission mission = missionAccessService.getAuthorizedMission(missionId, auth);
        return new MissionDTO(mission);
    }

    @Transactional(readOnly = true)
    public Mission getAuthorizedMission(Long missionId, Authentication auth) {
        return missionAccessService.getAuthorizedMission(missionId, auth);
    }

    public MissionDTO createMission(MissionDTO dto, Authentication auth) {
        if (!AuthUtil.hasRole(auth, "OWNER") && !AuthUtil.hasRole(auth, "ADMIN")) {
            throw new AccessDeniedException("Forbidden");
        }

        Mission saved = missionPlanningService.createMission(dto, auth);
        missionNotificationService.notifyDriverAssigned(saved);

        publishDashboard(saved);

        return new MissionDTO(saved);
    }

    public MissionDTO updateMission(Long missionId, MissionDTO dto, Authentication auth) {
        if (!AuthUtil.hasRole(auth, "OWNER") && !AuthUtil.hasRole(auth, "ADMIN")) {
            throw new AccessDeniedException("Forbidden");
        }

        Mission mission = missionAccessService.getAuthorizedMission(missionId, auth);
        Mission saved = missionPlanningService.updateMission(mission, dto, auth);
        missionNotificationService.notifyDriverUpdated(saved);

        publishDashboard(saved);

        return new MissionDTO(saved);
    }

    public MissionDTO startMission(Long missionId, Authentication auth) {
        if (auth == null || !AuthUtil.hasRole(auth, "DRIVER")) {
            throw new AccessDeniedException("Forbidden");
        }

        Mission mission = missionRepository.findById(missionId)
                .orElseThrow(() -> new ResourceNotFoundException("Mission not found: " + missionId));

        Driver driver = driverRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new ResourceNotFoundException("Driver not found"));

        boolean startedLate = mission.getStartDate() != null
                && LocalDateTime.now().isAfter(mission.getStartDate());

        Mission saved = missionLifecycleService.startMission(mission, auth);

        missionNotificationService.clearDriverLateAlert(saved);
        missionNotificationService.notifyOwnerMissionStarted(saved, driver, startedLate);

        publishDashboard(saved);

        return new MissionDTO(saved);
    }

    public MissionDTO finishMission(Long missionId, Authentication auth) {
        if (auth == null || !AuthUtil.hasRole(auth, "DRIVER")) {
            throw new AccessDeniedException("Forbidden");
        }

        Mission mission = missionRepository.findById(missionId)
                .orElseThrow(() -> new ResourceNotFoundException("Mission not found: " + missionId));

        Mission saved = missionLifecycleService.finishMission(mission, auth);

        missionNotificationService.clearDriverLateAlert(saved);
        missionNotificationService.notifyOwnerMissionFinished(saved);

        publishDashboard(saved);

        return new MissionDTO(saved);
    }

    public Mission completeMissionFromGps(Mission mission) {
        Mission saved = missionLifecycleService.completeMissionFromGps(mission);

        if (saved != null) {
            missionNotificationService.clearDriverLateAlert(saved);
            missionNotificationService.notifyOwnerMissionFinished(saved);

            publishDashboard(saved);
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

        publishDashboard(saved);
    }

    public void deleteMission(Long missionId, Authentication auth) {
        if (!AuthUtil.hasRole(auth, "OWNER") && !AuthUtil.hasRole(auth, "ADMIN")) {
            throw new AccessDeniedException("Forbidden");
        }

        Mission mission = missionAccessService.getAuthorizedMission(missionId, auth);

        if (mission.getStatus() == Mission.MissionStatus.IN_PROGRESS) {
            throw new IllegalArgumentException("Cannot delete an in-progress mission");
        }

        Long ownerId = mission.getOwner() != null ? mission.getOwner().getId() : null;

        missionNotificationService.clearDriverLateAlert(mission);
        missionRepository.delete(mission);

        publishDashboard(ownerId);
    }

    public RouteCheckResultDTO checkRoute(Long missionId, Authentication auth) {
        return routeVerificationService.checkRoute(missionId, auth);
    }

    private void publishDashboard(Mission mission) {
        if (mission != null && mission.getOwner() != null) {
            dashboardWebSocketPublisher.publishOwnerKpi(mission.getOwner().getId());
        }
    }

    private void publishDashboard(Long ownerId) {
        if (ownerId != null) {
            dashboardWebSocketPublisher.publishOwnerKpi(ownerId);
        }
    }
}