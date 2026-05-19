package com.example.fleet_backend.service;

import com.example.fleet_backend.dto.DispatchSuggestionDTO;
import com.example.fleet_backend.model.Mission;
import com.example.fleet_backend.model.Vehicle;
import com.example.fleet_backend.repository.MissionRepository;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DriverReturnDepotService {

    private final MissionRepository missionRepository;
    private final ReturnDepotService returnDepotService;

    public DriverReturnDepotService(
            MissionRepository missionRepository,
            ReturnDepotService returnDepotService
    ) {
        this.missionRepository = missionRepository;
        this.returnDepotService = returnDepotService;
    }

    @Transactional
    public DispatchSuggestionDTO requestReturnToDepot(
            Long missionId,
            Authentication authentication
    ) {
        Mission mission = missionRepository.findById(missionId)
                .orElseThrow(() -> new RuntimeException("Mission not found"));

        if (mission.getStatus() == null ||
                !mission.getStatus().name().equals("COMPLETED")) {
            throw new RuntimeException("Return depot is allowed only after mission completion");
        }

        Vehicle vehicle = mission.getVehicle();

        if (vehicle == null) {
            throw new RuntimeException("Mission vehicle not found");
        }

        DispatchSuggestionDTO suggestion = new DispatchSuggestionDTO();

        String lastCity = mission.getDestination();
        String depotCity = vehicle.getHomeDepotCity();

        Double vehicleLatitude = vehicle.getCurrentLatitude();
        Double vehicleLongitude = vehicle.getCurrentLongitude();

        Double depotLatitude = vehicle.getHomeDepotLatitude();
        Double depotLongitude = vehicle.getHomeDepotLongitude();

        Double currentFuelLevel = null;

        returnDepotService.applyReturnDepotLogic(
                suggestion,
                lastCity,
                depotCity,
                vehicleLatitude,
                vehicleLongitude,
                depotLatitude,
                depotLongitude,
                mission.getEndDate(),
                currentFuelLevel
        );

        suggestion.setVehicleId(vehicle.getId());

        suggestion.setDriverId(
                mission.getDriver() != null ? mission.getDriver().getId() : null
        );

        return suggestion;
    }
}