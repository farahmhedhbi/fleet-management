package com.example.fleet_backend.controller;

import com.example.fleet_backend.dto.VehicleObdLiveDTO;
import com.example.fleet_backend.service.TelemetryProcessingService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/obd")
public class ObdController {

    private final TelemetryProcessingService telemetryProcessingService;

    public ObdController(TelemetryProcessingService telemetryProcessingService) {
        this.telemetryProcessingService = telemetryProcessingService;
    }

    @GetMapping("/vehicle/{vehicleId}/live")
    public VehicleObdLiveDTO getVehicleObdLive(@PathVariable Long vehicleId) {
        return telemetryProcessingService.getVehicleObdLive(vehicleId);
    }
}