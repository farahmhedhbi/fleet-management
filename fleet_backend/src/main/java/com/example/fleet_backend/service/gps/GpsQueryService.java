package com.example.fleet_backend.service.gps;

import com.example.fleet_backend.dto.GpsPointDTO;
import com.example.fleet_backend.dto.MissionRoutePointDTO;
import com.example.fleet_backend.dto.VehicleLiveStatusDTO;
import com.example.fleet_backend.exception.ResourceNotFoundException;
import com.example.fleet_backend.model.GpsData;
import com.example.fleet_backend.model.Mission;
import com.example.fleet_backend.model.Vehicle;
import com.example.fleet_backend.model.VehicleLiveState;
import com.example.fleet_backend.repository.GpsDataRepository;
import com.example.fleet_backend.repository.MissionRepository;
import com.example.fleet_backend.repository.VehicleLiveStateRepository;
import com.example.fleet_backend.repository.VehicleRepository;
import com.example.fleet_backend.security.AuthUtil;
import com.example.fleet_backend.service.MissionService;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

@Service
@Transactional(readOnly = true)
public class GpsQueryService {

    private final GpsDataRepository gpsDataRepository;
    private final VehicleRepository vehicleRepository;
    private final VehicleLiveStateRepository vehicleLiveStateRepository;
    private final MissionRepository missionRepository;
    private final MissionService missionService;
    private final RouteParsingService routeParsingService;
    private final GpsMapperService gpsMapperService;

    public GpsQueryService(GpsDataRepository gpsDataRepository,
                           VehicleRepository vehicleRepository,
                           VehicleLiveStateRepository vehicleLiveStateRepository,
                           MissionRepository missionRepository,
                           MissionService missionService,
                           RouteParsingService routeParsingService,
                           GpsMapperService gpsMapperService) {
        this.gpsDataRepository = gpsDataRepository;
        this.vehicleRepository = vehicleRepository;
        this.vehicleLiveStateRepository = vehicleLiveStateRepository;
        this.missionRepository = missionRepository;
        this.missionService = missionService;
        this.routeParsingService = routeParsingService;
        this.gpsMapperService = gpsMapperService;
    }

    public Optional<GpsPointDTO> getLastPositionSecured(Long vehicleId, Authentication auth) {
        ensureAccessToVehicle(vehicleId, auth);
        return gpsDataRepository.findTopByVehicleIdOrderByTimestampDesc(vehicleId)
                .map(gpsMapperService::toGpsPointDTO);
    }

    public List<GpsPointDTO> getHistorySecured(Long vehicleId, Authentication auth) {
        ensureAccessToVehicle(vehicleId, auth);
        return gpsDataRepository.findByVehicleIdOrderByTimestampDesc(vehicleId)
                .stream()
                .map(gpsMapperService::toGpsPointDTO)
                .toList();
    }

    public List<GpsPointDTO> getHistoryRangeSecured(Long vehicleId,
                                                    LocalDateTime from,
                                                    LocalDateTime to,
                                                    Authentication auth) {
        ensureAccessToVehicle(vehicleId, auth);
        return gpsDataRepository.findByVehicleIdAndTimestampBetweenOrderByTimestampAsc(vehicleId, from, to)
                .stream()
                .map(gpsMapperService::toGpsPointDTO)
                .toList();
    }

    public List<VehicleLiveStatusDTO> getLiveFleetSecured(Authentication auth) {
        List<Vehicle> vehicles = getAuthorizedVehicles(auth);
        List<VehicleLiveStatusDTO> result = new ArrayList<>();

        for (Vehicle vehicle : vehicles) {
            Optional<VehicleLiveState> liveStateOpt = vehicleLiveStateRepository.findByVehicleId(vehicle.getId());
            Optional<Mission> activeMissionOpt = missionRepository.findFirstByVehicleIdAndStatus(
                    vehicle.getId(),
                    Mission.MissionStatus.IN_PROGRESS
            );

            Mission activeMission = activeMissionOpt.orElse(null);
            boolean missionActive = activeMission != null;

            List<MissionRoutePointDTO> missionRoute = activeMission != null
                    ? routeParsingService.parseMissionRoute(activeMission.getRouteJson())
                    : Collections.emptyList();

            if (liveStateOpt.isPresent()) {
                result.add(gpsMapperService.toVehicleLiveStatusDTO(
                        vehicle,
                        liveStateOpt.get(),
                        missionActive,
                        missionRoute
                ));
            } else {
                result.add(gpsMapperService.toNoDataVehicleLiveStatusDTO(
                        vehicle,
                        missionActive,
                        activeMission != null ? activeMission.getId() : null,
                        activeMission != null && activeMission.getStatus() != null ? activeMission.getStatus().name() : null,
                        activeMission != null && activeMission.getDriver() != null ? activeMission.getDriver().getId() : null,
                        buildDriverName(activeMission),
                        missionRoute
                ));
            }
        }

        return result;
    }

    public VehicleLiveStatusDTO getMissionLiveSecured(Long missionId, Authentication auth) {
        Mission mission = missionService.getAuthorizedMission(missionId, auth);

        if (mission == null) {
            throw new ResourceNotFoundException("Mission not found: " + missionId);
        }

        Vehicle vehicle = mission.getVehicle();
        if (vehicle == null) {
            throw new ResourceNotFoundException("No vehicle assigned to this mission");
        }

        boolean missionActive = mission.getStatus() == Mission.MissionStatus.IN_PROGRESS;

        List<MissionRoutePointDTO> missionRoute = routeParsingService.parseMissionRoute(mission.getRouteJson());

        Optional<VehicleLiveState> liveStateOpt = vehicleLiveStateRepository.findByVehicleId(vehicle.getId());

        if (liveStateOpt.isPresent()) {
            VehicleLiveState liveState = liveStateOpt.get();

            return gpsMapperService.toVehicleLiveStatusDTO(
                    vehicle,
                    liveState,
                    missionActive,
                    missionRoute
            );
        }

        return gpsMapperService.toNoDataVehicleLiveStatusDTO(
                vehicle,
                missionActive,
                mission.getId(),
                mission.getStatus() != null ? mission.getStatus().name() : null,
                mission.getDriver() != null ? mission.getDriver().getId() : null,
                buildDriverName(mission),
                missionRoute
        );
    }

    public List<GpsPointDTO> getMissionHistorySecured(Long missionId,
                                                      LocalDateTime from,
                                                      LocalDateTime to,
                                                      Authentication auth) {
        Mission mission = missionService.getAuthorizedMission(missionId, auth);

        if (mission.getVehicle() == null) {
            throw new ResourceNotFoundException("No vehicle assigned to this mission");
        }

        LocalDateTime effectiveFrom = from != null
                ? from
                : (mission.getStartedAt() != null ? mission.getStartedAt() : mission.getStartDate());

        LocalDateTime effectiveTo = to != null
                ? to
                : (mission.getFinishedAt() != null ? mission.getFinishedAt() : LocalDateTime.now());

        if (effectiveFrom == null) {
            effectiveFrom = LocalDateTime.now().minusDays(1);
        }

        if (effectiveTo.isBefore(effectiveFrom)) {
            effectiveTo = effectiveFrom.plusMinutes(1);
        }

        String expectedMissionRouteId = "mission-" + mission.getId();

        List<GpsData> rawPoints = gpsDataRepository.findByVehicleIdAndTimestampBetweenOrderByTimestampAsc(
                mission.getVehicle().getId(),
                effectiveFrom,
                effectiveTo
        );

        List<GpsData> missionTaggedPoints = rawPoints.stream()
                .filter(this::isValidMissionGpsPoint)
                .filter(gps -> "MISSION".equalsIgnoreCase(safe(gps.getRouteSource())))
                .filter(gps -> {
                    String routeId = safe(gps.getRouteId());
                    return routeId.isBlank() || expectedMissionRouteId.equals(routeId);
                })
                .toList();

        if (!missionTaggedPoints.isEmpty()) {
            return missionTaggedPoints.stream()
                    .map(gpsMapperService::toGpsPointDTO)
                    .toList();
        }

        return rawPoints.stream()
                .filter(this::isValidMissionGpsPoint)
                .map(gpsMapperService::toGpsPointDTO)
                .toList();
    }

    private boolean isValidMissionGpsPoint(GpsData gps) {
        if (gps == null) {
            return false;
        }

        Double lat = gps.getLatitude();
        Double lng = gps.getLongitude();

        return lat != null && lng != null
                && lat >= -90 && lat <= 90
                && lng >= -180 && lng <= 180;
    }

    private String safe(String value) {
        return value == null ? "" : value.trim();
    }

    private List<Vehicle> getAuthorizedVehicles(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            throw new AccessDeniedException("Unauthorized");
        }

        if (AuthUtil.isAdmin(auth)) {
            return vehicleRepository.findAll();
        }

        if (AuthUtil.hasRole(auth, "OWNER")) {
            Long ownerId = AuthUtil.userId(auth);
            return vehicleRepository.findByOwnerId(ownerId);
        }

        if (AuthUtil.hasRole(auth, "DRIVER")) {
            Long driverId = AuthUtil.userId(auth);
            return vehicleRepository.findByDriverId(driverId);
        }

        throw new AccessDeniedException("Forbidden");
    }

    private void ensureAccessToVehicle(Long vehicleId, Authentication auth) {
        boolean allowed = getAuthorizedVehicles(auth).stream()
                .anyMatch(v -> v.getId().equals(vehicleId));

        if (!allowed) {
            throw new AccessDeniedException("Forbidden");
        }
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