package com.example.fleet_backend.service;

import com.example.fleet_backend.dto.DispatchStepDTO;
import com.example.fleet_backend.dto.DispatchSuggestionDTO;
import com.example.fleet_backend.model.DispatchStepType;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class ReturnDepotService {

    private static final double RETURN_DEPOT_THRESHOLD_KM = 30.0;
    private static final double MIN_FUEL_RESERVE_PERCENT = 15.0;
    private static final double FUEL_CONSUMPTION_PERCENT_PER_100KM = 10.0;

    private final CityDistanceService cityDistanceService;

    public ReturnDepotService(CityDistanceService cityDistanceService) {
        this.cityDistanceService = cityDistanceService;
    }

    public void applyReturnDepotLogic(
            DispatchSuggestionDTO suggestion,
            String lastCity,
            String depotCity,
            Double vehicleLatitude,
            Double vehicleLongitude,
            Double depotLatitude,
            Double depotLongitude,
            LocalDateTime lastEndTime,
            Double currentFuelLevel
    ) {
        if (
                vehicleLatitude == null ||
                        vehicleLongitude == null ||
                        depotLatitude == null ||
                        depotLongitude == null ||
                        lastEndTime == null
        ) {
            suggestion.setReturnToDepotSuggested(false);
            suggestion.setVehicleStaysWithDriver(true);
            suggestion.setNextDayDecisionRequired(true);
            suggestion.setReturnDepotReason("Depot position, vehicle position or end time missing");
            return;
        }

        double distanceToDepot = cityDistanceService.distanceKm(
                vehicleLatitude,
                vehicleLongitude,
                depotLatitude,
                depotLongitude
        );

        int returnDurationMinutes = cityDistanceService.estimateDurationMinutes(
                vehicleLatitude,
                vehicleLongitude,
                depotLatitude,
                depotLongitude
        );

        suggestion.setFinalCity(lastCity);
        suggestion.setDepotCity(depotCity);
        suggestion.setDistanceToDepotKm(distanceToDepot);

        if (distanceToDepot <= 0.2) {
            suggestion.setReturnToDepotSuggested(false);
            suggestion.setVehicleStaysWithDriver(false);
            suggestion.setNextDayDecisionRequired(false);
            suggestion.setReturnDepotReason("Vehicle already at depot");
            return;
        }

        if (distanceToDepot > RETURN_DEPOT_THRESHOLD_KM) {
            suggestion.setReturnToDepotSuggested(false);
            suggestion.setVehicleStaysWithDriver(true);
            suggestion.setNextDayDecisionRequired(true);
            suggestion.setReturnDepotReason("Vehicle too far from depot");
            return;
        }

        double fuelNeeded = estimateFuelNeededPercent(distanceToDepot);

        if (currentFuelLevel != null && currentFuelLevel < fuelNeeded + MIN_FUEL_RESERVE_PERCENT) {
            suggestion.setReturnToDepotSuggested(false);
            suggestion.setVehicleStaysWithDriver(true);
            suggestion.setNextDayDecisionRequired(true);
            suggestion.setReturnDepotReason("Return impossible: insufficient fuel");
            return;
        }

        LocalDateTime returnStart = lastEndTime;
        LocalDateTime returnEnd = lastEndTime.plusMinutes(returnDurationMinutes);

        DispatchStepDTO returnStep = new DispatchStepDTO(
                DispatchStepType.RETURN_TO_DEPOT,
                null,
                "Return vehicle to depot",
                lastCity != null ? lastCity : "Current vehicle position",
                depotCity != null ? depotCity + " Depot" : "Depot",
                returnStart,
                returnEnd,
                returnDurationMinutes
        );

        suggestion.getSteps().add(returnStep);

        suggestion.setReturnToDepotSuggested(true);
        suggestion.setVehicleStaysWithDriver(false);
        suggestion.setNextDayDecisionRequired(false);
        suggestion.setReturnDepotReason("Vehicle close to depot");
    }

    private double estimateFuelNeededPercent(double distanceKm) {
        return (distanceKm / 100.0) * FUEL_CONSUMPTION_PERCENT_PER_100KM;
    }
}