package com.example.fleet_backend.service;

import com.example.fleet_backend.dto.TelemetryMessage;
import com.example.fleet_backend.dto.VehicleObdLiveDTO;
import com.example.fleet_backend.exception.ResourceNotFoundException;
import com.example.fleet_backend.model.Mission;
import com.example.fleet_backend.model.TelemetryData;
import com.example.fleet_backend.model.Vehicle;
import com.example.fleet_backend.model.VehicleLiveState;
import com.example.fleet_backend.repository.MissionRepository;
import com.example.fleet_backend.repository.TelemetryDataRepository;
import com.example.fleet_backend.repository.VehicleLiveStateRepository;
import com.example.fleet_backend.repository.VehicleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class TelemetryProcessingService {

    private final VehicleRepository vehicleRepository;
    private final MissionRepository missionRepository;
    private final TelemetryDataRepository telemetryDataRepository;
    private final VehicleLiveStateRepository vehicleLiveStateRepository;
    private final ObdAnalysisService obdAnalysisService;

    public TelemetryProcessingService(
            VehicleRepository vehicleRepository,
            MissionRepository missionRepository,
            TelemetryDataRepository telemetryDataRepository,
            VehicleLiveStateRepository vehicleLiveStateRepository,
            ObdAnalysisService obdAnalysisService
    ) {
        this.vehicleRepository = vehicleRepository;
        this.missionRepository = missionRepository;
        this.telemetryDataRepository = telemetryDataRepository;
        this.vehicleLiveStateRepository = vehicleLiveStateRepository;
        this.obdAnalysisService = obdAnalysisService;
    }

    @Transactional
    public void process(TelemetryMessage msg) {
        Vehicle vehicle = vehicleRepository.findById(msg.getVehicleId())
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found: " + msg.getVehicleId()));

        Optional<Mission> activeMission = missionRepository
                .findFirstByVehicleIdAndStatusOrderByStartDateDesc(
                        vehicle.getId(),
                        Mission.MissionStatus.IN_PROGRESS
                );

        TelemetryData data = new TelemetryData();
        data.setVehicle(vehicle);
        data.setMissionId(activeMission.map(Mission::getId).orElse(null));
        data.setTimestamp(msg.getTimestamp() != null ? msg.getTimestamp() : LocalDateTime.now());
        data.setLatitude(msg.getLatitude());
        data.setLongitude(msg.getLongitude());
        data.setSpeed(msg.getSpeed());
        data.setEngineOn(msg.getEngineOn());
        data.setEngineRpm(msg.getEngineRpm());
        data.setFuelLevel(msg.getFuelLevel());
        data.setEngineTemperature(msg.getEngineTemperature());
        data.setBatteryVoltage(msg.getBatteryVoltage());
        data.setEngineLoad(msg.getEngineLoad());
        data.setCheckEngineOn(msg.getCheckEngineOn());

        if (activeMission.isPresent()) {
            data.setRouteSource("MISSION");
            data.setRouteId(String.valueOf(activeMission.get().getId()));
        } else {
            data.setRouteSource("STATIC");
            data.setRouteId("default");
        }

        telemetryDataRepository.save(data);

        VehicleLiveState liveState = vehicleLiveStateRepository.findByVehicleId(vehicle.getId())
                .orElseGet(() -> {
                    VehicleLiveState state = new VehicleLiveState();
                    state.setVehicle(vehicle);
                    return state;
                });

        liveState.setLatitude(msg.getLatitude());
        liveState.setLongitude(msg.getLongitude());
        liveState.setSpeed(msg.getSpeed());
        liveState.setEngineOn(Boolean.TRUE.equals(msg.getEngineOn()));
        liveState.setLastTimestamp(data.getTimestamp());
        liveState.setMissionId(activeMission.map(Mission::getId).orElse(null));
        liveState.setRouteId(data.getRouteId());
        liveState.setRouteSource(data.getRouteSource());

        liveState.setEngineRpm(msg.getEngineRpm());
        liveState.setFuelLevel(msg.getFuelLevel());
        liveState.setEngineTemperature(msg.getEngineTemperature());
        liveState.setBatteryVoltage(msg.getBatteryVoltage());
        liveState.setEngineLoad(msg.getEngineLoad());
        liveState.setCheckEngineOn(msg.getCheckEngineOn());

        String obdStatus = obdAnalysisService.computeObdStatus(
                msg.getFuelLevel(),
                msg.getEngineTemperature(),
                msg.getBatteryVoltage(),
                msg.getCheckEngineOn()
        );

        liveState.setObdStatus(obdStatus);
        vehicleLiveStateRepository.save(liveState);
    }

    @Transactional(readOnly = true)
    public VehicleObdLiveDTO getVehicleObdLive(Long vehicleId) {
        VehicleLiveState liveState = vehicleLiveStateRepository.findByVehicleId(vehicleId)
                .orElseThrow(() -> new ResourceNotFoundException("Live state not found for vehicle " + vehicleId));

        VehicleObdLiveDTO dto = new VehicleObdLiveDTO();
        dto.setVehicleId(liveState.getVehicle().getId());
        dto.setRegistrationNumber(liveState.getVehicle().getRegistrationNumber());
        dto.setEngineOn(liveState.isEngineOn());
        dto.setEngineRpm(liveState.getEngineRpm());
        dto.setFuelLevel(liveState.getFuelLevel());
        dto.setEngineTemperature(liveState.getEngineTemperature());
        dto.setBatteryVoltage(liveState.getBatteryVoltage());
        dto.setEngineLoad(liveState.getEngineLoad());
        dto.setCheckEngineOn(liveState.getCheckEngineOn());
        dto.setObdStatus(liveState.getObdStatus());
        dto.setTimestamp(liveState.getLastTimestamp());

        return dto;
    }
}