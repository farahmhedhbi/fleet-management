package com.example.fleet_backend.service;

import com.example.fleet_backend.model.Driver;
import com.example.fleet_backend.model.Mission;
import com.example.fleet_backend.model.User;
import com.example.fleet_backend.repository.MissionRepository;
import com.example.fleet_backend.repository.UserRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Component
public class MissionLateAlertScheduler {

    private final MissionRepository missionRepository;
    private final NotificationService notificationService;
    private final UserRepository userRepository;

    public MissionLateAlertScheduler(MissionRepository missionRepository,
                                     NotificationService notificationService,
                                     UserRepository userRepository) {
        this.missionRepository = missionRepository;
        this.notificationService = notificationService;
        this.userRepository = userRepository;
    }

    @Scheduled(fixedDelay = 60000)
    @Transactional
    public void checkLateMissions() {
        LocalDateTime now = LocalDateTime.now();

        List<Mission> latePlannedMissions =
                missionRepository.findByStatusAndStartDateBefore(Mission.MissionStatus.PLANNED, now);

        for (Mission mission : latePlannedMissions) {
            if (mission == null || mission.getId() == null) {
                continue;
            }
            if (mission.isLateAlertSent()) {
                continue;
            }

            Driver driver = mission.getDriver();
            if (driver == null || driver.getEmail() == null || driver.getEmail().isBlank()) {
                continue;
            }

            User driverUser = userRepository.findByEmail(driver.getEmail()).orElse(null);
            if (driverUser == null) {
                continue;
            }

            String missionTitle = mission.getTitle() != null && !mission.getTitle().isBlank()
                    ? mission.getTitle()
                    : "Mission #" + mission.getId();

            notificationService.createUniqueForUser(
                    driverUser.getId(),
                    NotificationService.DRIVER_LATE_ALERT_TITLE,
                    "Vous êtes en retard pour démarrer la mission : " + missionTitle,
                    mission.getId()
            );

            mission.setLateAlertSent(true);
            missionRepository.save(mission);
        }
    }
}