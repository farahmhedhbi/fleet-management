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

    public long getMissionMinutes(Mission mission) {
        if (mission.getStartDate() == null || mission.getEndDate() == null) {
            return 0;
        }
        return Duration.between(mission.getStartDate(), mission.getEndDate()).toMinutes();
    }

    public boolean missionNeedsNoRest(Mission mission) {
        return getMissionMinutes(mission) < 60;
    }

    public boolean missionNeedsRestAfterFinish(Mission mission) {
        long minutes = getMissionMinutes(mission);
        return minutes >= 60 && minutes <= 120;
    }

    public boolean missionNeedsMiddleRest(Mission mission) {
        return getMissionMinutes(mission) > 120;
    }

    public int calculateRestAfterFinishMinutes(Mission mission) {
        if (missionNeedsRestAfterFinish(mission)) {
            return 15;
        }
        return 0;
    }

    public int calculateMiddleRestMinutes(Mission mission) {
        if (missionNeedsMiddleRest(mission)) {
            return 30;
        }
        return 0;
    }

    public void startRestAfterMission(Mission mission) {
        Driver driver = mission.getDriver();

        if (driver == null) {
            throw new IllegalArgumentException("Driver not found for this mission.");
        }

        int restMinutes = calculateRestAfterFinishMinutes(mission);

        if (restMinutes <= 0) {
            driver.setStatus(Driver.DriverStatus.AVAILABLE);
            driver.setRestStartTime(null);
            driver.setRestEndTime(null);
            driverRepository.save(driver);
            return;
        }

        LocalDateTime now = LocalDateTime.now();

        driver.setStatus(Driver.DriverStatus.RESTING);
        driver.setRestStartTime(now);
        driver.setRestEndTime(now.plusMinutes(restMinutes));

        driverRepository.save(driver);
    }

    public void startMiddleRest(Mission mission) {
        Driver driver = mission.getDriver();

        if (driver == null) {
            throw new IllegalArgumentException("Driver not found for this mission.");
        }

        if (!missionNeedsMiddleRest(mission)) {
            throw new IllegalArgumentException("Cette mission ne nécessite pas un repos au milieu.");
        }

        int restMinutes = calculateMiddleRestMinutes(mission);
        LocalDateTime now = LocalDateTime.now();

        driver.setStatus(Driver.DriverStatus.RESTING);
        driver.setRestStartTime(now);
        driver.setRestEndTime(now.plusMinutes(restMinutes));

        driverRepository.save(driver);
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