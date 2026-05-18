package com.example.fleet_backend.controller;

import com.example.fleet_backend.model.Driver;
import com.example.fleet_backend.model.Mission;
import com.example.fleet_backend.repository.DriverRepository;
import com.example.fleet_backend.repository.MissionRepository;
import com.example.fleet_backend.service.DriverRestService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/driver/rest")
public class DriverRestController {

    private final DriverRepository driverRepository;
    private final MissionRepository missionRepository;
    private final DriverRestService driverRestService;

    public DriverRestController(
            DriverRepository driverRepository,
            MissionRepository missionRepository,
            DriverRestService driverRestService
    ) {
        this.driverRepository = driverRepository;
        this.missionRepository = missionRepository;
        this.driverRestService = driverRestService;
    }

    @PostMapping("/ready")
    public String markReady(Authentication auth) {
        Driver driver = driverRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("Driver not found"));

        driverRestService.markDriverReady(driver);

        return "Driver is now AVAILABLE";
    }

    @PostMapping("/middle/{missionId}")
    public String startMiddleRest(
            @PathVariable Long missionId,
            Authentication auth
    ) {
        Driver driver = driverRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("Driver not found"));

        Mission mission = missionRepository.findById(missionId)
                .orElseThrow(() -> new RuntimeException("Mission not found"));

        if (mission.getDriver() == null || !mission.getDriver().getId().equals(driver.getId())) {
            throw new IllegalArgumentException("Cette mission n'appartient pas à ce driver.");
        }

        if (!"IN_PROGRESS".equals(String.valueOf(mission.getStatus()))) {
            throw new IllegalArgumentException("Le repos au milieu est disponible seulement pendant une mission en cours.");
        }

        driverRestService.startMiddleRest(mission);

        return "Middle rest started for 30 minutes";
    }
}