package com.example.fleet_backend.service;

import com.example.fleet_backend.dto.GpsIncomingDTO;
import com.example.fleet_backend.dto.GpsPointDTO;
import com.example.fleet_backend.dto.MissionRoutePointDTO;
import com.example.fleet_backend.dto.VehicleLiveStatusDTO;
import com.example.fleet_backend.exception.ResourceNotFoundException;
import com.example.fleet_backend.model.Driver;
import com.example.fleet_backend.model.GpsData;
import com.example.fleet_backend.model.LiveStatus;
import com.example.fleet_backend.model.Mission;
import com.example.fleet_backend.model.Vehicle;
import com.example.fleet_backend.model.VehicleLiveState;
import com.example.fleet_backend.repository.DriverRepository;
import com.example.fleet_backend.repository.GpsDataRepository;
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
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class GpsService {

    private final GpsDataRepository gpsDataRepository;
    private final VehicleRepository vehicleRepository;
    private final MissionRepository missionRepository;
    private final VehicleLiveStateRepository vehicleLiveStateRepository;
    private final VehicleEventService vehicleEventService;
    private final DriverRepository driverRepository;
    private final MissionService missionService;
    private final ObjectMapper objectMapper;

    public GpsService(GpsDataRepository gpsDataRepository,
                      VehicleRepository vehicleRepository,
                      MissionRepository missionRepository,
                      VehicleLiveStateRepository vehicleLiveStateRepository,
                      VehicleEventService vehicleEventService,
                      DriverRepository driverRepository,
                      MissionService missionService,
                      ObjectMapper objectMapper) {
        this.gpsDataRepository = gpsDataRepository;
        this.vehicleRepository = vehicleRepository;
        this.missionRepository = missionRepository;
        this.vehicleLiveStateRepository = vehicleLiveStateRepository;
        this.vehicleEventService = vehicleEventService;
        this.driverRepository = driverRepository;
        this.missionService = missionService;
        this.objectMapper = objectMapper;
    }

    public void processIncomingGps(GpsIncomingDTO dto) {
        validateIncoming(dto);

        Vehicle vehicle = vehicleRepository.findById(dto.getVehicleId())
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found with id: " + dto.getVehicleId()));

        Optional<Mission> activeMissionOpt = missionRepository.findFirstByVehicleIdAndStatus(
                vehicle.getId(),
                Mission.MissionStatus.IN_PROGRESS
        );

        boolean missionActive = activeMissionOpt.isPresent();
        Long missionId = missionActive ? activeMissionOpt.get().getId() : null;

        List<MissionRoutePointDTO> missionRoute = missionActive
                ? parseMissionRoute(activeMissionOpt.get().getRouteJson())
                : Collections.emptyList();

        GpsData previousGps = gpsDataRepository
                .findTopByVehicleIdOrderByTimestampDesc(vehicle.getId())
                .orElse(null);

        GpsData gpsData = new GpsData();
        gpsData.setVehicle(vehicle);
        gpsData.setLatitude(dto.getLatitude());
        gpsData.setLongitude(dto.getLongitude());
        gpsData.setSpeed(dto.getSpeed());
        gpsData.setEngineOn(dto.isEngineOn());
        gpsData.setTimestamp(dto.getTimestamp() != null ? dto.getTimestamp() : LocalDateTime.now());
        gpsData.setRouteId(dto.getRouteId());
        gpsData.setRouteSource(dto.getRouteSource());

        gpsDataRepository.save(gpsData);

        boolean offRoute = missionActive && isOffRoute(dto.getLatitude(), dto.getLongitude(), missionRoute);
        boolean missionCompleted = missionActive && isNearLastPoint(dto.getLatitude(), dto.getLongitude(), missionRoute);

        LiveStatus liveStatus = computeLiveStatus(gpsData, missionActive, offRoute, missionCompleted);

        updateLiveState(vehicle, gpsData, liveStatus, missionId);

        vehicleEventService.analyzeAndCreateEvents(
                vehicle,
                previousGps,
                gpsData,
                missionActive,
                missionId,
                offRoute,
                missionCompleted
        );

        if (missionCompleted && activeMissionOpt.isPresent()) {
            missionService.completeMissionFromGps(activeMissionOpt.get());
        }
    }

    private void validateIncoming(GpsIncomingDTO dto) {
        if (dto.getVehicleId() == null) {
            throw new IllegalArgumentException("vehicleId is required");
        }

        if (dto.getLatitude() == null || dto.getLatitude() < -90 || dto.getLatitude() > 90) {
            throw new IllegalArgumentException("latitude invalid");
        }

        if (dto.getLongitude() == null || dto.getLongitude() < -180 || dto.getLongitude() > 180) {
            throw new IllegalArgumentException("longitude invalid");
        }

        if (dto.getSpeed() == null || dto.getSpeed() < 0) {
            throw new IllegalArgumentException("speed invalid");
        }

        if (dto.getRouteSource() != null
                && !dto.getRouteSource().equals("MISSION")
                && !dto.getRouteSource().equals("STATIC")) {
            throw new IllegalArgumentException("routeSource must be MISSION or STATIC");
        }

        if (dto.getTimestamp() != null) {
            LocalDateTime now = LocalDateTime.now();
            if (dto.getTimestamp().isAfter(now.plusMinutes(5))
                    || dto.getTimestamp().isBefore(now.minusDays(1))) {
                throw new IllegalArgumentException("timestamp invalid");
            }
        }
    }

    public Optional<GpsPointDTO> getLastPositionSecured(Long vehicleId, Authentication auth) {
        ensureAccessToVehicle(vehicleId, auth);

        return gpsDataRepository.findTopByVehicleIdOrderByTimestampDesc(vehicleId)
                .map(this::toGpsPointDTO);
    }

    public List<GpsPointDTO> getHistorySecured(Long vehicleId, Authentication auth) {
        ensureAccessToVehicle(vehicleId, auth);

        return gpsDataRepository.findByVehicleIdOrderByTimestampDesc(vehicleId)
                .stream()
                .map(this::toGpsPointDTO)
                .toList();
    }

    public List<GpsPointDTO> getHistoryRangeSecured(Long vehicleId,
                                                    LocalDateTime from,
                                                    LocalDateTime to,
                                                    Authentication auth) {
        ensureAccessToVehicle(vehicleId, auth);

        return gpsDataRepository.findByVehicleIdAndTimestampBetweenOrderByTimestampAsc(vehicleId, from, to)
                .stream()
                .map(this::toGpsPointDTO)
                .toList();
    }

    public List<VehicleLiveStatusDTO> getLiveFleetSecured(Authentication auth) {
        List<Vehicle> vehicles = getAuthorizedVehicles(auth);
        List<VehicleLiveStatusDTO> result = new ArrayList<>();

        for (Vehicle vehicle : vehicles) {
            Optional<GpsData> lastGpsOpt = gpsDataRepository.findTopByVehicleIdOrderByTimestampDesc(vehicle.getId());
            Optional<Mission> activeMissionOpt = missionRepository.findFirstByVehicleIdAndStatus(
                    vehicle.getId(),
                    Mission.MissionStatus.IN_PROGRESS
            );

            boolean missionActive = activeMissionOpt.isPresent();
            Long missionId = missionActive ? activeMissionOpt.get().getId() : null;
            String currentDriverName = null;
            List<MissionRoutePointDTO> missionRoute = Collections.emptyList();

            if (missionActive) {
                Mission mission = activeMissionOpt.get();

                if (mission.getDriver() != null) {
                    String firstName = mission.getDriver().getFirstName() != null ? mission.getDriver().getFirstName() : "";
                    String lastName = mission.getDriver().getLastName() != null ? mission.getDriver().getLastName() : "";
                    currentDriverName = (firstName + " " + lastName).trim();
                    if (currentDriverName.isBlank()) {
                        currentDriverName = mission.getDriver().getEmail();
                    }
                }

                missionRoute = parseMissionRoute(mission.getRouteJson());
            }

            if (lastGpsOpt.isEmpty()) {
                result.add(new VehicleLiveStatusDTO(
                        vehicle.getId(),
                        resolveVehicleName(vehicle),
                        null,
                        null,
                        0.0,
                        false,
                        null,
                        LiveStatus.NO_DATA.name(),
                        missionActive,
                        missionId,
                        currentDriverName,
                        null,
                        null,
                        missionRoute
                ));
                continue;
            }

            GpsData lastGps = lastGpsOpt.get();
            LiveStatus liveStatus = computeLiveStatus(lastGps, missionActive, false, false);

            result.add(new VehicleLiveStatusDTO(
                    vehicle.getId(),
                    resolveVehicleName(vehicle),
                    lastGps.getLatitude(),
                    lastGps.getLongitude(),
                    lastGps.getSpeed(),
                    lastGps.isEngineOn(),
                    lastGps.getTimestamp(),
                    liveStatus.name(),
                    missionActive,
                    missionId,
                    currentDriverName,
                    lastGps.getRouteId(),
                    lastGps.getRouteSource(),
                    missionRoute
            ));
        }

        return result;
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
            Driver driver = driverRepository.findByEmail(auth.getName())
                    .orElseThrow(() -> new ResourceNotFoundException("Driver not found"));
            return vehicleRepository.findByDriverId(driver.getId());
        }

        throw new AccessDeniedException("Forbidden");
    }

    private void ensureAccessToVehicle(Long vehicleId, Authentication auth) {
        List<Vehicle> authorizedVehicles = getAuthorizedVehicles(auth);
        boolean allowed = authorizedVehicles.stream().anyMatch(v -> v.getId().equals(vehicleId));
        if (!allowed) {
            throw new AccessDeniedException("Forbidden");
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

    private GpsPointDTO toGpsPointDTO(GpsData gps) {
        return new GpsPointDTO(
                gps.getId(),
                gps.getVehicle().getId(),
                gps.getLatitude(),
                gps.getLongitude(),
                gps.getSpeed(),
                gps.isEngineOn(),
                gps.getTimestamp(),
                gps.getRouteId(),
                gps.getRouteSource()
        );
    }

    private String resolveVehicleName(Vehicle vehicle) {
        String registration = vehicle.getRegistrationNumber() != null ? vehicle.getRegistrationNumber() : "";
        String brand = vehicle.getBrand() != null ? vehicle.getBrand() : "";
        String model = vehicle.getModel() != null ? vehicle.getModel() : "";

        String joined = (brand + " " + model + " " + registration).trim();
        return joined.isBlank() ? "Vehicle #" + vehicle.getId() : joined;
    }

    private LiveStatus computeLiveStatus(GpsData gpsData,
                                         boolean missionActive,
                                         boolean offRoute,
                                         boolean missionCompleted) {
        if (gpsData.getTimestamp() == null) {
            return LiveStatus.OFFLINE;
        }

        long minutes = Duration.between(gpsData.getTimestamp(), LocalDateTime.now()).toMinutes();
        if (minutes > 5) {
            return LiveStatus.OFFLINE;
        }

        if (missionCompleted) {
            return LiveStatus.MISSION_COMPLETED;
        }

        if (offRoute) {
            return LiveStatus.OFF_ROUTE;
        }

        if (!gpsData.isEngineOn()) {
            return LiveStatus.ENGINE_OFF;
        }

        if (gpsData.getSpeed() == null || gpsData.getSpeed() == 0.0) {
            return missionActive ? LiveStatus.PAUSED_ON_MISSION : LiveStatus.STOPPED;
        }

        return LiveStatus.MOVING;
    }

    private void updateLiveState(Vehicle vehicle,
                                 GpsData gpsData,
                                 LiveStatus liveStatus,
                                 Long missionId) {
        VehicleLiveState state = vehicleLiveStateRepository.findByVehicleId(vehicle.getId())
                .orElseGet(VehicleLiveState::new);

        state.setVehicle(vehicle);
        state.setLatitude(gpsData.getLatitude());
        state.setLongitude(gpsData.getLongitude());
        state.setSpeed(gpsData.getSpeed());
        state.setEngineOn(gpsData.isEngineOn());
        state.setLastTimestamp(gpsData.getTimestamp());
        state.setLiveStatus(liveStatus);
        state.setMissionId(missionId);
        state.setRouteId(gpsData.getRouteId());
        state.setRouteSource(gpsData.getRouteSource());

        vehicleLiveStateRepository.save(state);
    }

    private boolean isOffRoute(Double lat,
                               Double lng,
                               List<MissionRoutePointDTO> route) {
        if (route == null || route.isEmpty() || lat == null || lng == null) {
            return false;
        }

        double threshold = 0.0025;

        return route.stream().noneMatch(point ->
                point.getLatitude() != null
                        && point.getLongitude() != null
                        && Math.abs(point.getLatitude() - lat) <= threshold
                        && Math.abs(point.getLongitude() - lng) <= threshold
        );
    }

    private boolean isNearLastPoint(Double lat,
                                    Double lng,
                                    List<MissionRoutePointDTO> route) {
        if (route == null || route.isEmpty() || lat == null || lng == null) {
            return false;
        }

        MissionRoutePointDTO last = route.get(route.size() - 1);
        if (last.getLatitude() == null || last.getLongitude() == null) {
            return false;
        }

        return distanceMeters(lat, lng, last.getLatitude(), last.getLongitude()) <= 30.0;
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

    public VehicleLiveStatusDTO getMissionLiveSecured(Long missionId, Authentication auth) {
        Mission mission = missionService.getAuthorizedMission(missionId, auth);

        if (mission.getVehicle() == null) {
            throw new ResourceNotFoundException("No vehicle assigned to this mission");
        }

        Vehicle vehicle = mission.getVehicle();

        Optional<GpsData> lastGpsOpt = gpsDataRepository.findTopByVehicleIdOrderByTimestampDesc(vehicle.getId());

        boolean missionActive = mission.getStatus() == Mission.MissionStatus.IN_PROGRESS;
        Long currentMissionId = mission.getId();

        String currentDriverName = null;
        if (mission.getDriver() != null) {
            String firstName = mission.getDriver().getFirstName() != null ? mission.getDriver().getFirstName() : "";
            String lastName = mission.getDriver().getLastName() != null ? mission.getDriver().getLastName() : "";
            currentDriverName = (firstName + " " + lastName).trim();
            if (currentDriverName.isBlank()) {
                currentDriverName = mission.getDriver().getEmail();
            }
        }

        List<MissionRoutePointDTO> missionRoute = parseMissionRoute(mission.getRouteJson());

        if (lastGpsOpt.isEmpty()) {
            return new VehicleLiveStatusDTO(
                    vehicle.getId(),
                    resolveVehicleName(vehicle),
                    null,
                    null,
                    0.0,
                    false,
                    null,
                    LiveStatus.NO_DATA.name(),
                    missionActive,
                    currentMissionId,
                    currentDriverName,
                    null,
                    null,
                    missionRoute
            );
        }

        GpsData lastGps = lastGpsOpt.get();
        boolean missionCompleted = mission.getStatus() == Mission.MissionStatus.COMPLETED;
        LiveStatus liveStatus = computeLiveStatus(lastGps, missionActive, false, missionCompleted);

        return new VehicleLiveStatusDTO(
                vehicle.getId(),
                resolveVehicleName(vehicle),
                lastGps.getLatitude(),
                lastGps.getLongitude(),
                lastGps.getSpeed(),
                lastGps.isEngineOn(),
                lastGps.getTimestamp(),
                liveStatus.name(),
                missionActive,
                currentMissionId,
                currentDriverName,
                lastGps.getRouteId(),
                lastGps.getRouteSource(),
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

        LocalDateTime effectiveFrom = from;
        LocalDateTime effectiveTo = to;

        if (effectiveFrom == null) {
            effectiveFrom = mission.getStartedAt() != null ? mission.getStartedAt() : mission.getStartDate();
        }

        if (effectiveTo == null) {
            if (mission.getFinishedAt() != null) {
                effectiveTo = mission.getFinishedAt();
            } else {
                effectiveTo = LocalDateTime.now();
            }
        }

        if (effectiveFrom == null) {
            effectiveFrom = mission.getCreatedAt() != null ? mission.getCreatedAt() : LocalDateTime.now().minusDays(1);
        }

        if (effectiveTo.isBefore(effectiveFrom)) {
            effectiveTo = effectiveFrom.plusMinutes(1);
        }

        return gpsDataRepository
                .findByVehicleIdAndTimestampBetweenOrderByTimestampAsc(
                        mission.getVehicle().getId(),
                        effectiveFrom,
                        effectiveTo
                )
                .stream()
                .map(this::toGpsPointDTO)
                .toList();
    }
}