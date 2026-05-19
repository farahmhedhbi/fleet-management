package com.example.fleet_backend.controller;

import com.example.fleet_backend.model.VehicleLiveState;
import com.example.fleet_backend.repository.VehicleLiveStateRepository;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/simulator")
public class SimulatorObdStateController {

    private final VehicleLiveStateRepository vehicleLiveStateRepository;

    public SimulatorObdStateController(VehicleLiveStateRepository vehicleLiveStateRepository) {
        this.vehicleLiveStateRepository = vehicleLiveStateRepository;
    }

    @GetMapping("/vehicles/{vehicleId}/obd-state")
    public Map<String, Object> getSimulatorObdState(@PathVariable Long vehicleId) {
        VehicleLiveState liveState = vehicleLiveStateRepository.findByVehicleId(vehicleId)
                .orElse(null);

        Map<String, Object> response = new HashMap<>();

        if (liveState == null) {
            response.put("exists", false);
            return response;
        }

        response.put("exists", true);
        response.put("fuelLevel", liveState.getFuelLevel());
        response.put("engineTemperature", liveState.getEngineTemperature());
        response.put("batteryVoltage", liveState.getBatteryVoltage());
        response.put("checkEngineOn", liveState.getCheckEngineOn());

        return response;
    }
}