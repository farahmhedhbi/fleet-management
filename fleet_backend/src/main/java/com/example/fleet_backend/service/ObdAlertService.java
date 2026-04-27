package com.example.fleet_backend.service;

import com.example.fleet_backend.dto.ObdAlertDTO;
import com.example.fleet_backend.dto.VehicleHealthSummaryDTO;
import com.example.fleet_backend.exception.ResourceNotFoundException;
import com.example.fleet_backend.model.Vehicle;
import com.example.fleet_backend.model.VehicleLiveState;
import com.example.fleet_backend.repository.VehicleLiveStateRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ObdAlertService {

    private final VehicleLiveStateRepository vehicleLiveStateRepository;
    private final ObdAnalysisService obdAnalysisService;
    private final VehicleAccessService vehicleAccessService;

    public ObdAlertService(VehicleLiveStateRepository vehicleLiveStateRepository,
                           ObdAnalysisService obdAnalysisService,
                           VehicleAccessService vehicleAccessService) {
        this.vehicleLiveStateRepository = vehicleLiveStateRepository;
        this.obdAnalysisService = obdAnalysisService;
        this.vehicleAccessService = vehicleAccessService;
    }

    @Transactional(readOnly = true)
    public VehicleHealthSummaryDTO getVehicleSummary(Long vehicleId) {
        Vehicle vehicle = vehicleAccessService.getAuthorizedVehicle(vehicleId);

        VehicleLiveState liveState = vehicleLiveStateRepository.findByVehicleId(vehicleId)
                .orElseThrow(() -> new ResourceNotFoundException("Live state not found for vehicle " + vehicleId));

        List<ObdAlertDTO> alerts = getAlertsFromLiveState(liveState);

        VehicleHealthSummaryDTO dto = new VehicleHealthSummaryDTO();

        dto.setVehicleId(vehicle.getId());
        dto.setRegistrationNumber(vehicle.getRegistrationNumber());

        dto.setObdStatus(obdAnalysisService.computeObdStatus(
                liveState.getFuelLevel(),
                liveState.getEngineTemperature(),
                liveState.getBatteryVoltage(),
                liveState.getCheckEngineOn()
        ));

        dto.setHealthState(
                liveState.getHealthState() != null
                        ? liveState.getHealthState().name()
                        : "UNKNOWN"
        );
        dto.setHealthReason(liveState.getHealthReason());

        dto.setActiveAlertsCount(alerts.size());
        dto.setFuelLevel(liveState.getFuelLevel());
        dto.setEngineTemperature(liveState.getEngineTemperature());
        dto.setBatteryVoltage(liveState.getBatteryVoltage());
        dto.setCheckEngineOn(Boolean.TRUE.equals(liveState.getCheckEngineOn()));

        dto.setMaintenanceHint(obdAnalysisService.buildMaintenanceHint(
                liveState.getFuelLevel(),
                liveState.getEngineTemperature(),
                liveState.getBatteryVoltage(),
                liveState.getCheckEngineOn()
        ));

        return dto;
    }

    @Transactional(readOnly = true)
    public List<ObdAlertDTO> getVehicleAlerts(Long vehicleId) {
        vehicleAccessService.getAuthorizedVehicle(vehicleId);

        VehicleLiveState liveState = vehicleLiveStateRepository.findByVehicleId(vehicleId)
                .orElseThrow(() -> new ResourceNotFoundException("Live state not found for vehicle " + vehicleId));

        return getAlertsFromLiveState(liveState);
    }

    private List<ObdAlertDTO> getAlertsFromLiveState(VehicleLiveState liveState) {
        return obdAnalysisService.computeAlerts(
                liveState.getFuelLevel(),
                liveState.getEngineTemperature(),
                liveState.getBatteryVoltage(),
                liveState.getCheckEngineOn()
        );
    }
}