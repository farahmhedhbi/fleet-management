package com.example.fleet_backend.service;

import com.example.fleet_backend.dto.GpsIncomingDTO;
import com.example.fleet_backend.dto.GpsPointDTO;
import com.example.fleet_backend.dto.MissionRoutePointDTO;
import com.example.fleet_backend.dto.VehicleLiveStatusDTO;
import com.example.fleet_backend.model.GpsData;
import com.example.fleet_backend.model.Mission;
import com.example.fleet_backend.model.Vehicle;
import com.example.fleet_backend.repository.GpsDataRepository;
import com.example.fleet_backend.repository.MissionRepository;
import com.example.fleet_backend.repository.VehicleRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
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
    private final ObjectMapper objectMapper = new ObjectMapper();

    public GpsService(GpsDataRepository gpsDataRepository,
                      VehicleRepository vehicleRepository,
                      MissionRepository missionRepository) {
        this.gpsDataRepository = gpsDataRepository;
        this.vehicleRepository = vehicleRepository;
        this.missionRepository = missionRepository;
    }

    public void processIncomingGps(GpsIncomingDTO dto) {
        validateIncoming(dto);

        Vehicle vehicle = vehicleRepository.findById(dto.getVehicleId())
                .orElseThrow(() -> new RuntimeException("Vehicle not found with id: " + dto.getVehicleId()));

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
    }

    private void validateIncoming(GpsIncomingDTO dto) {
        if (dto.getVehicleId() == null) {
            throw new IllegalArgumentException("vehicleId is required");
        }
        if (dto.getLatitude() == null || dto.getLongitude() == null) {
            throw new IllegalArgumentException("latitude and longitude are required");
        }
        if (dto.getSpeed() == null) {
            throw new IllegalArgumentException("speed is required");
        }
    }

    public Optional<GpsPointDTO> getLastPosition(Long vehicleId) {
        return gpsDataRepository.findTopByVehicleIdOrderByTimestampDesc(vehicleId)
                .map(this::toGpsPointDTO);
    }

    public List<GpsPointDTO> getHistory(Long vehicleId) {
        return gpsDataRepository.findByVehicleIdOrderByTimestampDesc(vehicleId)
                .stream()
                .map(this::toGpsPointDTO)
                .toList();
    }

    private GpsPointDTO toGpsPointDTO(GpsData gpsData) {
        return new GpsPointDTO(
                gpsData.getId(),
                gpsData.getVehicle() != null ? gpsData.getVehicle().getId() : null,
                gpsData.getLatitude(),
                gpsData.getLongitude(),
                gpsData.getSpeed(),
                gpsData.isEngineOn(),
                gpsData.getTimestamp(),
                gpsData.getRouteId(),
                gpsData.getRouteSource()
        );
    }

    public List<VehicleLiveStatusDTO> getLiveFleet() {
        List<Vehicle> vehicles = vehicleRepository.findAll();
        List<VehicleLiveStatusDTO> result = new ArrayList<>();

        for (Vehicle vehicle : vehicles) {
            Optional<GpsData> lastGpsOpt =
                    gpsDataRepository.findTopByVehicleIdOrderByTimestampDesc(vehicle.getId());

            Optional<Mission> activeMissionOpt =
                    missionRepository.findFirstByVehicleIdAndStatus(
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
                    currentDriverName =
                            mission.getDriver().getFirstName() + " " + mission.getDriver().getLastName();
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
                        "OFFLINE",
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

            result.add(new VehicleLiveStatusDTO(
                    vehicle.getId(),
                    resolveVehicleName(vehicle),
                    lastGps.getLatitude(),
                    lastGps.getLongitude(),
                    lastGps.getSpeed(),
                    lastGps.isEngineOn(),
                    lastGps.getTimestamp(),
                    resolveLiveStatus(lastGps, missionActive),
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

    private String resolveVehicleName(Vehicle vehicle) {
        try {
            if (vehicle.getRegistrationNumber() != null && !vehicle.getRegistrationNumber().isBlank()) {
                return vehicle.getRegistrationNumber();
            }
        } catch (Exception ignored) {
        }
        return "Vehicle-" + vehicle.getId();
    }

    private String resolveLiveStatus(GpsData gpsData, boolean missionActive) {
        if (gpsData.getTimestamp() == null) {
            return "OFFLINE";
        }

        long minutes = Duration.between(gpsData.getTimestamp(), LocalDateTime.now()).toMinutes();
        if (minutes > 5) {
            return "OFFLINE";
        }

        if (missionActive) {
            return "EN_MISSION";
        }

        if (gpsData.isEngineOn()) {
            return "HORS_MISSION";
        }

        return "INACTIF";
    }
}