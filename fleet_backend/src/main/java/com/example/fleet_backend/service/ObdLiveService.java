package com.example.fleet_backend.service;

import com.example.fleet_backend.dto.VehicleObdLiveDTO;
import com.example.fleet_backend.exception.ResourceNotFoundException;
import com.example.fleet_backend.model.Vehicle;
import com.example.fleet_backend.model.VehicleLiveState;
import com.example.fleet_backend.repository.VehicleLiveStateRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ObdLiveService {

    private final VehicleLiveStateRepository vehicleLiveStateRepository;
    private final VehicleAccessService vehicleAccessService;
    private final ObdAnalysisService obdAnalysisService;

    public ObdLiveService(VehicleLiveStateRepository vehicleLiveStateRepository,
                          VehicleAccessService vehicleAccessService,
                          ObdAnalysisService obdAnalysisService) {
        this.vehicleLiveStateRepository = vehicleLiveStateRepository;
        this.vehicleAccessService = vehicleAccessService;
        this.obdAnalysisService = obdAnalysisService;
    }

    @Transactional(readOnly = true)
    public VehicleObdLiveDTO getVehicleObdLive(Long vehicleId) {
        Vehicle vehicle = vehicleAccessService.getAuthorizedVehicle(vehicleId);

        VehicleLiveState liveState = vehicleLiveStateRepository.findByVehicleId(vehicleId)
                .orElseThrow(() -> new ResourceNotFoundException("Live OBD state not found for vehicle " + vehicleId));

        VehicleObdLiveDTO dto = new VehicleObdLiveDTO();
        dto.setVehicleId(vehicle.getId());
        dto.setRegistrationNumber(vehicle.getRegistrationNumber());
        dto.setEngineOn(liveState.isEngineOn());
        dto.setEngineRpm(liveState.getEngineRpm());
        dto.setFuelLevel(liveState.getFuelLevel());
        dto.setEngineTemperature(liveState.getEngineTemperature());
        dto.setBatteryVoltage(liveState.getBatteryVoltage());
        dto.setEngineLoad(liveState.getEngineLoad());
        dto.setCheckEngineOn(Boolean.TRUE.equals(liveState.getCheckEngineOn()));

        dto.setObdStatus(obdAnalysisService.computeObdStatus(
                liveState.getFuelLevel(),
                liveState.getEngineTemperature(),
                liveState.getBatteryVoltage(),
                liveState.getCheckEngineOn()
        ));

        dto.setTimestamp(liveState.getLastTimestamp());
        return dto;
    }
}