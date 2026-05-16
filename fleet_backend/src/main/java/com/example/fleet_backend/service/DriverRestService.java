package com.example.fleet_backend.service;

import com.example.fleet_backend.model.Driver;
import com.example.fleet_backend.model.Mission;
import com.example.fleet_backend.repository.DriverRepository;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;

@Service
public class DriverRestService {

    private final DriverRepository driverRepository;

    public DriverRestService(DriverRepository driverRepository) {
        this.driverRepository = driverRepository;
    }

    public void startRestAfterMission(Mission mission) {
        Driver driver = mission.getDriver();

        LocalDateTime start = mission.getStartDate();
        LocalDateTime end = mission.getEndDate();

        long missionMinutes = Duration.between(start, end).toMinutes();
        int restMinutes = calculateRestMinutes(missionMinutes);

        driver.setStatus(Driver.DriverStatus.RESTING);
        driver.setRestStartTime(LocalDateTime.now());
        driver.setRestEndTime(LocalDateTime.now().plusMinutes(restMinutes));

        driverRepository.save(driver);
    }

    public int calculateRestMinutes(long missionMinutes) {
        if (missionMinutes < 60) {
            return 10;
        }
        if (missionMinutes <= 180) {
            return 20;
        }
        if (missionMinutes <= 360) {
            return 40;
        }
        return 60;
    }

    public void markDriverReady(Driver driver) {
        if (driver.getRestEndTime() != null &&
                LocalDateTime.now().isBefore(driver.getRestEndTime())) {
            throw new IllegalArgumentException("Le temps de repos n'est pas encore terminé.");
        }

        driver.setStatus(Driver.DriverStatus.AVAILABLE);
        driver.setRestStartTime(null);
        driver.setRestEndTime(null);

        driverRepository.save(driver);
    }
}