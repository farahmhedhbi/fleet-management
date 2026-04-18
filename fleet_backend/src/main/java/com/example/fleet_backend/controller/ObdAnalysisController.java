package com.example.fleet_backend.controller;

import com.example.fleet_backend.dto.ObdAlertDTO;
import com.example.fleet_backend.dto.VehicleHealthSummaryDTO;
import com.example.fleet_backend.service.ObdAlertService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/obd")
public class ObdAnalysisController {

    private final ObdAlertService obdAlertService;

    public ObdAnalysisController(ObdAlertService obdAlertService) {
        this.obdAlertService = obdAlertService;
    }

    @GetMapping("/vehicle/{vehicleId}/summary")
    public VehicleHealthSummaryDTO getVehicleSummary(@PathVariable Long vehicleId) {
        return obdAlertService.getVehicleSummary(vehicleId);
    }

    @GetMapping("/vehicle/{vehicleId}/alerts")
    public List<ObdAlertDTO> getVehicleAlerts(@PathVariable Long vehicleId) {
        return obdAlertService.getVehicleAlerts(vehicleId);
    }
}