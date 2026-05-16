package com.example.fleet_backend.service;

import com.example.fleet_backend.dto.MissionRoutePointDTO;
import com.example.fleet_backend.exception.ResourceNotFoundException;
import com.example.fleet_backend.model.Driver;
import com.example.fleet_backend.model.MaintenanceStatus;
import com.example.fleet_backend.model.Mission;
import com.example.fleet_backend.model.RouteCheckStatus;
import com.example.fleet_backend.model.Vehicle;
import com.example.fleet_backend.model.VehicleLiveState;
import com.example.fleet_backend.repository.DriverRepository;
import com.example.fleet_backend.repository.MaintenanceRepository;
import com.example.fleet_backend.repository.MissionRepository;
import com.example.fleet_backend.repository.VehicleLiveStateRepository;
import com.example.fleet_backend.repository.VehicleRepository;
import com.example.fleet_backend.security.AuthUtil;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

@Service
@Transactional
public class MissionLifecycleService {

    private static final double FINISH_RADIUS_METERS = 30.0;

    private final MissionRepository missionRepository;
    private final DriverRepository driverRepository;
    private final VehicleRepository vehicleRepository;
    private final VehicleLiveStateRepository vehicleLiveStateRepository;
    private final MaintenanceRepository maintenanceRepository;
    private final ObjectMapper objectMapper;

    public MissionLifecycleService(
            MissionRepository missionRepository,
            DriverRepository driverRepository,
            VehicleRepository vehicleRepository,
            VehicleLiveStateRepository vehicleLiveStateRepository,
            MaintenanceRepository maintenanceRepository,
            ObjectMapper objectMapper
    ) {
        this.missionRepository = missionRepository;
        this.driverRepository = driverRepository;
        this.vehicleRepository = vehicleRepository;
        this.vehicleLiveStateRepository = vehicleLiveStateRepository;
        this.maintenanceRepository = maintenanceRepository;
        this.objectMapper = objectMapper;
    }

    public Mission startMission(Mission mission, Authentication auth) {
        validateDriverAuth(auth);

        if (mission == null || mission.getId() == null) {
            throw new ResourceNotFoundException("Mission not found");
        }

        Driver connectedDriver = driverRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new ResourceNotFoundException("Driver not found"));

        Mission managedMission = missionRepository.findById(mission.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Mission not found"));

        validateMissionBelongsToDriver(managedMission, connectedDriver);

        if (managedMission.getStatus() != Mission.MissionStatus.PLANNED) {
            throw new IllegalArgumentException("Only planned missions can be started");
        }

        if (managedMission.getRouteCheckStatus() == null
                || managedMission.getRouteCheckStatus() == RouteCheckStatus.NOT_CHECKED) {
            throw new IllegalArgumentException("Veuillez vérifier la route avant de commencer la mission.");
        }

        if (managedMission.getVehicle() == null || managedMission.getVehicle().getId() == null) {
            throw new IllegalArgumentException("Mission vehicle is missing");
        }

        if (managedMission.getDriver() == null || managedMission.getDriver().getId() == null) {
            throw new IllegalArgumentException("Mission driver is missing");
        }

        Vehicle vehicle = managedMission.getVehicle();
        Driver driver = managedMission.getDriver();

        if (vehicle.getStatus() == Vehicle.VehicleStatus.OUT_OF_SERVICE) {
            throw new IllegalArgumentException("Ce véhicule est hors service.");
        }

        if (vehicle.getStatus() == Vehicle.VehicleStatus.UNDER_MAINTENANCE) {
            throw new IllegalArgumentException("Ce véhicule est actuellement en maintenance.");
        }

        validateMaintenanceConflictForMission(vehicle, managedMission);

        if (missionRepository.existsByVehicleIdAndStatus(
                vehicle.getId(),
                Mission.MissionStatus.IN_PROGRESS
        )) {
            throw new IllegalArgumentException("This vehicle already has an active mission");
        }

        if (missionRepository.existsByDriverIdAndStatus(
                driver.getId(),
                Mission.MissionStatus.IN_PROGRESS
        )) {
            throw new IllegalArgumentException("This driver already has an active mission");
        }

        if (driver.getStatus() == Driver.DriverStatus.RESTING
                && driver.getAvailableAt() != null
                && driver.getAvailableAt().isAfter(LocalDateTime.now())) {
            throw new IllegalArgumentException(
                    "Ce chauffeur est en repos jusqu'à " + driver.getAvailableAt()
            );
        }

        LocalDateTime now = LocalDateTime.now();

        managedMission.setStatus(Mission.MissionStatus.IN_PROGRESS);

        if (managedMission.getStartedAt() == null) {
            managedMission.setStartedAt(now);
        }

        managedMission.setLateAlertSent(false);

        vehicle.setStatus(Vehicle.VehicleStatus.IN_USE);

        driver.setStatus(Driver.DriverStatus.ON_MISSION);
        driver.setAvailableAt(null);

        vehicleRepository.save(vehicle);
        driverRepository.save(driver);

        return missionRepository.save(managedMission);
    }

    public Mission finishMission(Mission mission, Authentication auth) {
        validateDriverAuth(auth);

        if (mission == null || mission.getId() == null) {
            throw new ResourceNotFoundException("Mission not found");
        }

        Driver connectedDriver = driverRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new ResourceNotFoundException("Driver not found"));

        Mission managedMission = missionRepository.findById(mission.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Mission not found"));

        validateMissionBelongsToDriver(managedMission, connectedDriver);

        if (managedMission.getStatus() != Mission.MissionStatus.IN_PROGRESS) {
            throw new IllegalArgumentException("Only missions in progress can be finished");
        }

        if (managedMission.getVehicle() == null || managedMission.getVehicle().getId() == null) {
            throw new IllegalArgumentException("Mission vehicle is missing");
        }

        VehicleLiveState liveState = vehicleLiveStateRepository
                .findByVehicleId(managedMission.getVehicle().getId())
                .orElseThrow(() -> new IllegalArgumentException(
                        "Live GPS position not found for this vehicle"
                ));

        List<MissionRoutePointDTO> route = parseMissionRoute(managedMission.getRouteJson());

        if (route.isEmpty()) {
            throw new IllegalArgumentException("Mission route is missing");
        }

        MissionRoutePointDTO lastPoint = route.get(route.size() - 1);

        if (lastPoint.getLatitude() == null || lastPoint.getLongitude() == null) {
            throw new IllegalArgumentException("Mission destination coordinates are invalid");
        }

        if (liveState.getLatitude() == null || liveState.getLongitude() == null) {
            throw new IllegalArgumentException("Live GPS coordinates are invalid");
        }

        double remainingDistance = distanceMeters(
                liveState.getLatitude(),
                liveState.getLongitude(),
                lastPoint.getLatitude(),
                lastPoint.getLongitude()
        );

        if (remainingDistance > FINISH_RADIUS_METERS) {
            throw new IllegalArgumentException(
                    "Impossible de terminer la mission : destination non atteinte (" +
                            Math.round(remainingDistance) + " m restants)"
            );
        }

        managedMission.setStatus(Mission.MissionStatus.COMPLETED);

        if (managedMission.getFinishedAt() == null) {
            managedMission.setFinishedAt(LocalDateTime.now());
        }

        updateVehicleLocationAfterMission(managedMission);
        refreshVehicleStatusAfterMission(managedMission.getVehicle());

        if (managedMission.getDriver() != null) {
            applyDriverRestAfterMission(managedMission.getDriver(), managedMission);
        }

        managedMission.setLateAlertSent(false);

        return missionRepository.save(managedMission);
    }

    public Mission cancelMission(Mission mission) {
        if (mission == null || mission.getId() == null) {
            throw new ResourceNotFoundException("Mission not found");
        }

        Mission managedMission = missionRepository.findById(mission.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Mission not found"));

        if (managedMission.getStatus() == Mission.MissionStatus.COMPLETED) {
            throw new IllegalArgumentException("Completed mission cannot be canceled");
        }

        managedMission.setStatus(Mission.MissionStatus.CANCELED);
        managedMission.setLateAlertSent(false);

        if (managedMission.getVehicle() != null) {
            refreshVehicleStatusAfterMission(managedMission.getVehicle());
        }

        if (managedMission.getDriver() != null) {
            managedMission.getDriver().setStatus(Driver.DriverStatus.AVAILABLE);
            managedMission.getDriver().setAvailableAt(null);
            driverRepository.save(managedMission.getDriver());
        }

        return missionRepository.save(managedMission);
    }

    public Mission completeMissionFromGps(Mission mission) {
        if (mission == null || mission.getId() == null) {
            return null;
        }

        Mission managedMission = missionRepository.findById(mission.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Mission not found"));

        if (managedMission.getStatus() != Mission.MissionStatus.IN_PROGRESS) {
            return managedMission;
        }

        managedMission.setStatus(Mission.MissionStatus.COMPLETED);

        if (managedMission.getFinishedAt() == null) {
            managedMission.setFinishedAt(LocalDateTime.now());
        }

        updateVehicleLocationAfterMission(managedMission);

        if (managedMission.getVehicle() != null) {
            refreshVehicleStatusAfterMission(managedMission.getVehicle());
        }

        if (managedMission.getDriver() != null) {
            applyDriverRestAfterMission(managedMission.getDriver(), managedMission);
        }

        managedMission.setLateAlertSent(false);

        return missionRepository.save(managedMission);
    }

    private void updateVehicleLocationAfterMission(Mission mission) {
        if (mission == null || mission.getVehicle() == null) {
            return;
        }

        Vehicle vehicle = mission.getVehicle();

        if (mission.getDestination() != null && !mission.getDestination().isBlank()) {
            vehicle.setCurrentCity(mission.getDestination().trim());
        }

        List<MissionRoutePointDTO> route = parseMissionRoute(mission.getRouteJson());

        if (!route.isEmpty()) {
            MissionRoutePointDTO lastPoint = route.get(route.size() - 1);

            if (lastPoint.getLatitude() != null && lastPoint.getLongitude() != null) {
                vehicle.setCurrentLatitude(lastPoint.getLatitude());
                vehicle.setCurrentLongitude(lastPoint.getLongitude());
            }
        }

        vehicleRepository.save(vehicle);
    }

    private void applyDriverRestAfterMission(Driver driver, Mission mission) {
        if (driver == null || mission == null) {
            return;
        }

        long restMinutes = calculateRestMinutes(mission);

        driver.setStatus(Driver.DriverStatus.RESTING);
        driver.setAvailableAt(LocalDateTime.now().plusMinutes(restMinutes));

        driverRepository.save(driver);
    }

    private long calculateRestMinutes(Mission mission) {
        LocalDateTime start = mission.getStartedAt() != null
                ? mission.getStartedAt()
                : mission.getStartDate();

        LocalDateTime end = mission.getFinishedAt() != null
                ? mission.getFinishedAt()
                : LocalDateTime.now();

        if (start == null) {
            return 20;
        }

        long durationMinutes = Duration.between(start, end).toMinutes();

        if (durationMinutes < 60) {
            return 10;
        }

        if (durationMinutes < 180) {
            return 20;
        }

        if (durationMinutes < 360) {
            return 40;
        }

        return 60;
    }

    private void validateDriverAuth(Authentication auth) {
        if (auth == null || !AuthUtil.hasRole(auth, "DRIVER")) {
            throw new AccessDeniedException("Forbidden");
        }
    }

    private void validateMissionBelongsToDriver(Mission mission, Driver driver) {
        if (mission == null || mission.getId() == null) {
            throw new ResourceNotFoundException("Mission not found");
        }

        if (mission.getDriver() == null
                || driver == null
                || !mission.getDriver().getId().equals(driver.getId())) {
            throw new AccessDeniedException("Not your mission");
        }
    }

    private void validateMaintenanceConflictForMission(Vehicle vehicle, Mission mission) {
        if (vehicle == null || vehicle.getId() == null || mission == null) {
            return;
        }

        boolean maintenanceConflict = maintenanceRepository.hasMaintenanceConflict(
                vehicle.getId(),
                List.of(
                        MaintenanceStatus.PLANNED,
                        MaintenanceStatus.IN_PROGRESS,
                        MaintenanceStatus.OVERDUE
                ),
                mission.getStartDate(),
                mission.getEndDate()
        );

        if (maintenanceConflict) {
            throw new IllegalArgumentException(
                    "Impossible de démarrer la mission : ce véhicule est en maintenance pendant cette période."
            );
        }
    }

    private void refreshVehicleStatusAfterMission(Vehicle vehicle) {
        if (vehicle == null || vehicle.getId() == null) {
            return;
        }

        boolean hasActiveMaintenance = maintenanceRepository.hasActiveMaintenance(
                vehicle.getId(),
                List.of(
                        MaintenanceStatus.PLANNED,
                        MaintenanceStatus.IN_PROGRESS,
                        MaintenanceStatus.OVERDUE
                )
        );

        if (hasActiveMaintenance) {
            setVehicleStatus(vehicle, Vehicle.VehicleStatus.UNDER_MAINTENANCE);
        } else {
            setVehicleStatus(vehicle, Vehicle.VehicleStatus.AVAILABLE);
        }
    }

    private void setVehicleStatus(Vehicle vehicle, Vehicle.VehicleStatus status) {
        vehicle.setStatus(status);
        vehicleRepository.save(vehicle);
    }

    private List<MissionRoutePointDTO> parseMissionRoute(String routeJson) {
        if (routeJson == null || routeJson.isBlank()) {
            return Collections.emptyList();
        }

        try {
            return objectMapper.readValue(
                    routeJson,
                    new TypeReference<List<MissionRoutePointDTO>>() {}
            );
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    private double distanceMeters(
            double lat1,
            double lon1,
            double lat2,
            double lon2
    ) {
        double earthRadius = 6371000.0;

        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);

        double a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2)
                        + Math.cos(Math.toRadians(lat1))
                        * Math.cos(Math.toRadians(lat2))
                        * Math.sin(dLon / 2)
                        * Math.sin(dLon / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return earthRadius * c;
    }
}