package com.example.fleet_backend.service.gps;

import com.example.fleet_backend.model.Mission;
import com.example.fleet_backend.model.Vehicle;
import com.example.fleet_backend.repository.MissionRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class MissionTrackingService {

    private final MissionRepository missionRepository;
    private final RouteParsingService routeParsingService;

    public MissionTrackingService(MissionRepository missionRepository,
                                  RouteParsingService routeParsingService) {
        this.missionRepository = missionRepository;
        this.routeParsingService = routeParsingService;
    }

    public ActiveMissionContext getActiveMissionContext(Vehicle vehicle) {
        if (vehicle == null || vehicle.getId() == null) {
            return ActiveMissionContext.empty();
        }

        Optional<Mission> activeMissionOpt = missionRepository.findFirstByVehicleIdAndStatus(
                vehicle.getId(),
                Mission.MissionStatus.IN_PROGRESS
        );

        if (activeMissionOpt.isEmpty()) {
            return ActiveMissionContext.empty();
        }

        Mission mission = activeMissionOpt.get();

        Long missionId = mission.getId();
        String missionStatus = mission.getStatus() != null ? mission.getStatus().name() : null;
        Long driverId = mission.getDriver() != null ? mission.getDriver().getId() : null;
        String driverName = buildDriverName(mission);
        List<com.example.fleet_backend.dto.MissionRoutePointDTO> missionRoute =
                routeParsingService.parseMissionRoute(mission.getRouteJson());

        return new ActiveMissionContext(
                mission,
                true,
                missionId,
                missionStatus,
                driverId,
                driverName,
                missionRoute
        );
    }

    private String buildDriverName(Mission mission) {
        if (mission == null || mission.getDriver() == null) {
            return null;
        }

        String firstName = mission.getDriver().getFirstName() != null ? mission.getDriver().getFirstName() : "";
        String lastName = mission.getDriver().getLastName() != null ? mission.getDriver().getLastName() : "";
        String fullName = (firstName + " " + lastName).trim();

        return fullName.isBlank() ? mission.getDriver().getEmail() : fullName;
    }
}