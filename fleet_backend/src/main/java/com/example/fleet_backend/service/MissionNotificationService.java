package com.example.fleet_backend.service;

import com.example.fleet_backend.model.Driver;
import com.example.fleet_backend.model.Mission;
import com.example.fleet_backend.model.User;
import com.example.fleet_backend.repository.UserRepository;
import org.springframework.stereotype.Service;

@Service
public class MissionNotificationService {

    private final NotificationService notificationService;
    private final UserRepository userRepository;

    public MissionNotificationService(NotificationService notificationService,
                                      UserRepository userRepository) {
        this.notificationService = notificationService;
        this.userRepository = userRepository;
    }

    public void notifyDriverAssigned(Mission mission) {
        User driverUser = findDriverUser(mission);
        if (driverUser == null) return;

        notificationService.createUniqueForUser(
                driverUser.getId(),
                NotificationService.DRIVER_ASSIGNED_TITLE,
                "Une nouvelle mission vous a été assignée : " + safeMissionTitle(mission),
                mission.getId()
        );
    }

    public void notifyDriverUpdated(Mission mission) {
        User driverUser = findDriverUser(mission);
        if (driverUser == null) return;

        notificationService.createForUser(
                driverUser.getId(),
                NotificationService.DRIVER_UPDATED_TITLE,
                "La mission a été modifiée : " + safeMissionTitle(mission),
                mission.getId()
        );
    }

    public void notifyDriverCanceled(Mission mission) {
        User driverUser = findDriverUser(mission);
        if (driverUser == null) return;

        notificationService.createForUser(
                driverUser.getId(),
                NotificationService.DRIVER_CANCELED_TITLE,
                "La mission a été annulée : " + safeMissionTitle(mission),
                mission.getId()
        );
    }

    public void notifyOwnerMissionStarted(Mission mission, Driver driver, boolean startedLate) {
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

    public void notifyOwnerMissionFinished(Mission mission) {
        if (mission.getOwner() == null) return;

        notificationService.createForUser(
                mission.getOwner().getId(),
                NotificationService.OWNER_FINISHED_TITLE,
                "La mission est terminée : " + safeMissionTitle(mission),
                mission.getId()
        );
    }

    public void clearDriverLateAlert(Mission mission) {
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

        String firstName = driver.getFirstName() != null ? driver.getFirstName() : "";
        String lastName = driver.getLastName() != null ? driver.getLastName() : "";
        String fullName = (firstName + " " + lastName).trim();

        if (!fullName.isBlank()) return fullName;
        if (driver.getEmail() != null && !driver.getEmail().isBlank()) return driver.getEmail();

        return "Driver";
    }
}