package com.example.fleet_backend.service;

import com.example.fleet_backend.dto.PostMissionDecisionDTO;
import com.example.fleet_backend.model.*;
import com.example.fleet_backend.repository.IncidentRepository;
import com.example.fleet_backend.repository.MaintenanceRepository;
import com.example.fleet_backend.repository.MissionRepository;
import com.example.fleet_backend.repository.VehicleEventRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Service
@Transactional
public class PostMissionDecisionService {

    private static final double LOW_FUEL_THRESHOLD = 15.0;
    private static final int END_OF_DAY_HOUR = 18;

    private final MissionRepository missionRepository;
    private final MaintenanceRepository maintenanceRepository;
    private final IncidentRepository incidentRepository;
    private final VehicleEventRepository vehicleEventRepository;
    private final ReturnDepotService returnDepotService;

    public PostMissionDecisionService(
            MissionRepository missionRepository,
            MaintenanceRepository maintenanceRepository,
            IncidentRepository incidentRepository,
            VehicleEventRepository vehicleEventRepository,
            ReturnDepotService returnDepotService
    ) {
        this.missionRepository = missionRepository;
        this.maintenanceRepository = maintenanceRepository;
        this.incidentRepository = incidentRepository;
        this.vehicleEventRepository = vehicleEventRepository;
        this.returnDepotService = returnDepotService;
    }

    public PostMissionDecisionDTO handleAfterMissionCompleted(Mission mission) {
        if (mission == null || mission.getId() == null) {
            return null;
        }

        Vehicle vehicle = mission.getVehicle();
        Driver driver = mission.getDriver();

        Long vehicleId = vehicle != null ? vehicle.getId() : null;
        Long driverId = driver != null ? driver.getId() : null;

        if (vehicle == null || vehicleId == null) {
            return build(
                    PostMissionDecision.WAIT_ON_FIELD,
                    mission,
                    "Mission completed, but vehicle is missing.",
                    false,
                    false,
                    false
            );
        }

        if (hasCriticalBreakdown(vehicleId)) {
            vehicle.setStatus(Vehicle.VehicleStatus.BROKEN_DOWN);
            vehicle.setParked(false);

            return build(
                    PostMissionDecision.TOW_REQUIRED,
                    mission,
                    "Panne grave détectée. Remorquage vers dépôt requis.",
                    true,
                    false,
                    false
            );
        }

        if (hasOpenCriticalIncident(vehicleId)) {
            returnDepotService.suggestReturnDepot(mission.getId());

            return build(
                    PostMissionDecision.INSPECTION_REQUIRED,
                    mission,
                    "Incident critique ouvert. Inspection au dépôt recommandée.",
                    true,
                    false,
                    false
            );
        }

        if (hasActiveMaintenanceSoon(vehicleId)) {
            returnDepotService.suggestReturnDepot(mission.getId());

            return build(
                    PostMissionDecision.MAINTENANCE_REQUIRED,
                    mission,
                    "Maintenance programmée proche. Retour dépôt recommandé.",
                    true,
                    false,
                    driverIsAssignable(driver)
            );
        }

        if (vehicle.getLastFuelLevel() != null && vehicle.getLastFuelLevel() <= LOW_FUEL_THRESHOLD) {
            return build(
                    PostMissionDecision.REFUEL_REQUIRED,
                    mission,
                    "Carburant faible. Retour dépôt ou station recommandé.",
                    false,
                    true,
                    driverIsAssignable(driver)
            );
        }

        if (driver != null && driver.getStatus() == Driver.DriverStatus.RESTING) {
            return build(
                    PostMissionDecision.REST_REQUIRED,
                    mission,
                    "Driver en repos. Véhicule disponible pour un autre driver.",
                    false,
                    true,
                    false
            );
        }

        if (isEndOfDay()) {
            returnDepotService.suggestReturnDepot(mission.getId());

            return build(
                    PostMissionDecision.END_OF_SHIFT_RETURN,
                    mission,
                    "Fin de journée. Retour dépôt suggéré.",
                    true,
                    true,
                    false
            );
        }

        boolean sameDriverHasNextMission = hasNextPlannedMissionForDriver(driverId);
        if (sameDriverHasNextMission && driverIsAssignable(driver)) {
            return build(
                    PostMissionDecision.ASSIGN_NEXT_MISSION_SAME_DRIVER,
                    mission,
                    "Nouvelle mission proche avec le même driver possible.",
                    false,
                    true,
                    true
            );
        }

        boolean vehicleHasNextMission = hasNextPlannedMissionForVehicle(vehicleId);
        if (vehicleHasNextMission) {
            return build(
                    PostMissionDecision.ASSIGN_NEXT_MISSION_OTHER_DRIVER,
                    mission,
                    "Nouvelle mission avec autre driver possible.",
                    false,
                    true,
                    false
            );
        }

        if (isFarFromDepot(vehicle)) {
            return build(
                    PostMissionDecision.WAIT_ON_FIELD,
                    mission,
                    "Aucune mission immédiate. Véhicule disponible sur terrain.",
                    false,
                    true,
                    driverIsAssignable(driver)
            );
        }

        return build(
                PostMissionDecision.RETURN_TO_DEPOT,
                mission,
                "Aucune mission proche. Retour dépôt suggéré.",
                true,
                true,
                driverIsAssignable(driver)
        );
    }

    public PostMissionDecisionDTO handleNextMissionCancelled(Mission cancelledMission) {
        if (cancelledMission == null || cancelledMission.getId() == null) {
            return null;
        }

        returnDepotService.suggestReturnDepot(cancelledMission.getId());

        return build(
                PostMissionDecision.RETURN_DEPOT_AFTER_CANCELLED_NEXT_MISSION,
                cancelledMission,
                "Mission suivante annulée. Retour dépôt suggéré.",
                true,
                true,
                false
        );
    }

    private boolean hasCriticalBreakdown(Long vehicleId) {
        if (vehicleId == null) return false;

        return vehicleEventRepository
                .findByVehicleIdAndEventTypeAndStatusOrderByCreatedAtDesc(
                        vehicleId,
                        VehicleEventType.ENGINE_FAILURE,
                        VehicleEventStatus.ACTIVE
                )
                .stream()
                .findFirst()
                .isPresent();
    }

    private boolean hasOpenCriticalIncident(Long vehicleId) {
        if (vehicleId == null) return false;

        return incidentRepository.findByVehicleIdOrderByCreatedAtDesc(vehicleId)
                .stream()
                .anyMatch(i ->
                        i.getStatus() == IncidentStatus.OPEN
                                && i.getSeverity() == IncidentSeverity.CRITICAL
                );
    }

    private boolean hasActiveMaintenanceSoon(Long vehicleId) {
        if (vehicleId == null) return false;

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime tomorrow = now.plusDays(1);

        return maintenanceRepository.hasMaintenanceConflict(
                vehicleId,
                List.of(
                        MaintenanceStatus.PLANNED,
                        MaintenanceStatus.IN_PROGRESS,
                        MaintenanceStatus.OVERDUE
                ),
                now,
                tomorrow
        );
    }

    private boolean hasNextPlannedMissionForDriver(Long driverId) {
        if (driverId == null) return false;

        return missionRepository.findTopByDriverIdOrderByEndDateDesc(driverId)
                .filter(m -> m.getStatus() == Mission.MissionStatus.PLANNED)
                .isPresent();
    }

    private boolean hasNextPlannedMissionForVehicle(Long vehicleId) {
        if (vehicleId == null) return false;

        return missionRepository.existsByVehicleIdAndStatus(
                vehicleId,
                Mission.MissionStatus.PLANNED
        );
    }

    private boolean driverIsAssignable(Driver driver) {
        if (driver == null) return false;

        return driver.getStatus() == Driver.DriverStatus.AVAILABLE
                || driver.getStatus() == Driver.DriverStatus.ACTIVE;
    }

    private boolean isEndOfDay() {
        return LocalTime.now().getHour() >= END_OF_DAY_HOUR;
    }

    private boolean isFarFromDepot(Vehicle vehicle) {
        if (vehicle == null) return false;

        if (vehicle.getCurrentLatitude() == null
                || vehicle.getCurrentLongitude() == null
                || vehicle.getHomeDepotLatitude() == null
                || vehicle.getHomeDepotLongitude() == null) {
            return true;
        }

        double distance = distanceMeters(
                vehicle.getCurrentLatitude(),
                vehicle.getCurrentLongitude(),
                vehicle.getHomeDepotLatitude(),
                vehicle.getHomeDepotLongitude()
        );

        return distance > 5000;
    }

    private PostMissionDecisionDTO build(
            PostMissionDecision decision,
            Mission mission,
            String message,
            boolean returnDepotSuggested,
            boolean vehicleAssignable,
            boolean driverAssignable
    ) {
        return new PostMissionDecisionDTO(
                decision,
                mission != null ? mission.getId() : null,
                mission != null && mission.getVehicle() != null ? mission.getVehicle().getId() : null,
                mission != null && mission.getDriver() != null ? mission.getDriver().getId() : null,
                message,
                returnDepotSuggested,
                vehicleAssignable,
                driverAssignable
        );
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