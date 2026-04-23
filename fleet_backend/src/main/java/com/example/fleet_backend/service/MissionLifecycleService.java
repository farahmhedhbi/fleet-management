package com.example.fleet_backend.service;

import com.example.fleet_backend.dto.MissionRoutePointDTO;
import com.example.fleet_backend.exception.ResourceNotFoundException;
import com.example.fleet_backend.model.Driver;
import com.example.fleet_backend.model.Mission;
import com.example.fleet_backend.model.Vehicle;
import com.example.fleet_backend.model.VehicleLiveState;
import com.example.fleet_backend.repository.DriverRepository;
import com.example.fleet_backend.repository.MissionRepository;
import com.example.fleet_backend.repository.VehicleLiveStateRepository;
import com.example.fleet_backend.repository.VehicleRepository;
import com.example.fleet_backend.security.AuthUtil;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

@Service
public class MissionLifecycleService {

    private static final double FINISH_RADIUS_METERS = 30.0;

    private final MissionRepository missionRepository;
    private final DriverRepository driverRepository;
    private final VehicleRepository vehicleRepository;
    private final VehicleLiveStateRepository vehicleLiveStateRepository;
    private final ObjectMapper objectMapper;

    public MissionLifecycleService(MissionRepository missionRepository,
                                   DriverRepository driverRepository,
                                   VehicleRepository vehicleRepository,
                                   VehicleLiveStateRepository vehicleLiveStateRepository,
                                   ObjectMapper objectMapper) {
        this.missionRepository = missionRepository;
        this.driverRepository = driverRepository;
        this.vehicleRepository = vehicleRepository;
        this.vehicleLiveStateRepository = vehicleLiveStateRepository;
        this.objectMapper = objectMapper;
    }

    public Mission startMission(Mission mission, Authentication auth) {
        if (!AuthUtil.hasRole(auth, "DRIVER")) {
            throw new AccessDeniedException("Forbidden");
        }

        Driver driver = driverRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new ResourceNotFoundException("Driver not found"));

        if (mission.getDriver() == null || !mission.getDriver().getId().equals(driver.getId())) {
            throw new AccessDeniedException("Not your mission");
        }

        if (mission.getStatus() != Mission.MissionStatus.PLANNED) {
            throw new IllegalArgumentException("Only planned missions can be started");
        }

        if (mission.getVehicle() == null) {
            throw new IllegalArgumentException("Mission vehicle is missing");
        }

        if (missionRepository.existsByVehicleIdAndStatus(
                mission.getVehicle().getId(),
                Mission.MissionStatus.IN_PROGRESS)) {
            throw new IllegalArgumentException("This vehicle already has an active mission");
        }

        if (missionRepository.existsByDriverIdAndStatus(
                mission.getDriver().getId(),
                Mission.MissionStatus.IN_PROGRESS)) {
            throw new IllegalArgumentException("This driver already has an active mission");
        }

        mission.setStatus(Mission.MissionStatus.IN_PROGRESS);

        if (mission.getStartedAt() == null) {
            mission.setStartedAt(LocalDateTime.now());
        }

        setVehicleStatus(mission.getVehicle(), Vehicle.VehicleStatus.IN_USE);
        mission.setLateAlertSent(false);

        return missionRepository.save(mission);
    }

    public Mission finishMission(Mission mission, Authentication auth) {
        if (!AuthUtil.hasRole(auth, "DRIVER")) {
            throw new AccessDeniedException("Forbidden");
        }

        Driver driver = driverRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new ResourceNotFoundException("Driver not found"));

        if (mission.getDriver() == null || !mission.getDriver().getId().equals(driver.getId())) {
            throw new AccessDeniedException("Not your mission");
        }

        if (mission.getStatus() != Mission.MissionStatus.IN_PROGRESS) {
            throw new IllegalArgumentException("Only missions in progress can be finished");
        }

        if (mission.getVehicle() == null) {
            throw new IllegalArgumentException("Mission vehicle is missing");
        }

        VehicleLiveState liveState = vehicleLiveStateRepository.findByVehicleId(mission.getVehicle().getId())
                .orElseThrow(() -> new IllegalArgumentException("Live GPS position not found for this vehicle"));

        List<MissionRoutePointDTO> route = parseMissionRoute(mission.getRouteJson());
        if (route.isEmpty()) {
            throw new IllegalArgumentException("Mission route is missing");
        }

        MissionRoutePointDTO lastPoint = route.get(route.size() - 1);
        if (lastPoint.getLatitude() == null || lastPoint.getLongitude() == null) {
            throw new IllegalArgumentException("Mission destination coordinates are invalid");
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

        mission.setStatus(Mission.MissionStatus.COMPLETED);

        if (mission.getFinishedAt() == null) {
            mission.setFinishedAt(LocalDateTime.now());
        }

        setVehicleStatus(mission.getVehicle(), Vehicle.VehicleStatus.AVAILABLE);
        mission.setLateAlertSent(false);

        return missionRepository.save(mission);
    }

    public Mission cancelMission(Mission mission) {
        if (mission.getStatus() == Mission.MissionStatus.COMPLETED) {
            throw new IllegalArgumentException("Completed mission cannot be canceled");
        }

        mission.setStatus(Mission.MissionStatus.CANCELED);

        if (mission.getVehicle() != null) {
            setVehicleStatus(mission.getVehicle(), Vehicle.VehicleStatus.AVAILABLE);
        }

        mission.setLateAlertSent(false);

        return missionRepository.save(mission);
    }

    public Mission completeMissionFromGps(Mission mission) {
        if (mission == null) return null;

        Mission managed = missionRepository.findById(mission.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Mission not found"));

        if (managed.getStatus() != Mission.MissionStatus.IN_PROGRESS) {
            return managed;
        }

        managed.setStatus(Mission.MissionStatus.COMPLETED);

        if (managed.getFinishedAt() == null) {
            managed.setFinishedAt(LocalDateTime.now());
        }

        if (managed.getVehicle() != null) {
            setVehicleStatus(managed.getVehicle(), Vehicle.VehicleStatus.AVAILABLE);
        }

        managed.setLateAlertSent(false);

        return missionRepository.save(managed);
    }

    private void setVehicleStatus(Vehicle vehicle, Vehicle.VehicleStatus status) {
        try {
            vehicle.setStatus(status);
            vehicleRepository.save(vehicle);
        } catch (Exception ignored) {
        }
    }

    private List<MissionRoutePointDTO> parseMissionRoute(String routeJson) {
        if (routeJson == null || routeJson.isBlank()) {
            return Collections.emptyList();
        }

        try {
            return objectMapper.readValue(routeJson, new TypeReference<List<MissionRoutePointDTO>>() {});
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    private double distanceMeters(double lat1, double lon1, double lat2, double lon2) {
        double earthRadius = 6371000.0;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);

        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return earthRadius * c;
    }
}