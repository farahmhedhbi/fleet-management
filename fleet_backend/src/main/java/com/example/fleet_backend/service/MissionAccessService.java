package com.example.fleet_backend.service;

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
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class MissionAccessService {

    private final MissionRepository missionRepository;
    private final UserRepository userRepository;
    private final DriverRepository driverRepository;

    public MissionAccessService(MissionRepository missionRepository,
                                UserRepository userRepository,
                                DriverRepository driverRepository) {
        this.missionRepository = missionRepository;
        this.userRepository = userRepository;
        this.driverRepository = driverRepository;
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
}