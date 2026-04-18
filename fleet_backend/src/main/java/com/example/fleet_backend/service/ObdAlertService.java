package com.example.fleet_backend.service;

import com.example.fleet_backend.dto.ObdAlertDTO;
import com.example.fleet_backend.dto.VehicleHealthSummaryDTO;
import com.example.fleet_backend.exception.ResourceNotFoundException;
import com.example.fleet_backend.model.VehicleLiveState;
import com.example.fleet_backend.repository.VehicleLiveStateRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ObdAlertService {

    private final VehicleLiveStateRepository vehicleLiveStateRepository;
    private final ObdAnalysisService obdAnalysisService;

    public ObdAlertService(
            VehicleLiveStateRepository vehicleLiveStateRepository,
            ObdAnalysisService obdAnalysisService
    ) {
        this.vehicleLiveStateRepository = vehicleLiveStateRepository;
        this.obdAnalysisService = obdAnalysisService;
    }

    @Transactional(readOnly = true)
    public VehicleHealthSummaryDTO getVehicleSummary(Long vehicleId) {
        VehicleLiveState liveState = vehicleLiveStateRepository.findByVehicleId(vehicleId)
                .orElseThrow(() -> new ResourceNotFoundException("Live state not found for vehicle " + vehicleId));

        List<ObdAlertDTO> alerts = obdAnalysisService.computeAlerts(
                liveState.getFuelLevel(),
                liveState.getEngineTemperature(),
                liveState.getBatteryVoltage(),
                liveState.getCheckEngineOn()
        );

        VehicleHealthSummaryDTO dto = new VehicleHealthSummaryDTO();
        dto.setVehicleId(liveState.getVehicle().getId());
        dto.setRegistrationNumber(liveState.getVehicle().getRegistrationNumber());
        dto.setObdStatus(liveState.getObdStatus());
        dto.setActiveAlertsCount(alerts.size());
        dto.setFuelLevel(liveState.getFuelLevel());
        dto.setEngineTemperature(liveState.getEngineTemperature());
        dto.setBatteryVoltage(liveState.getBatteryVoltage());
        dto.setCheckEngineOn(liveState.getCheckEngineOn());
        dto.setMaintenanceHint(
                obdAnalysisService.buildMaintenanceHint(
                        liveState.getFuelLevel(),
                        liveState.getEngineTemperature(),
                        liveState.getBatteryVoltage(),
                        liveState.getCheckEngineOn()
                )
        );

        return dto;
    }

    @Transactional(readOnly = true)
    public List<ObdAlertDTO> getVehicleAlerts(Long vehicleId) {
        VehicleLiveState liveState = vehicleLiveStateRepository.findByVehicleId(vehicleId)
                .orElseThrow(() -> new ResourceNotFoundException("Live state not found for vehicle " + vehicleId));

        return obdAnalysisService.computeAlerts(
                liveState.getFuelLevel(),
                liveState.getEngineTemperature(),
                liveState.getBatteryVoltage(),
                liveState.getCheckEngineOn()
        );
    }
}