package com.example.fleet_backend.controller;

import com.example.fleet_backend.dto.PredictiveAlertDTO;
import com.example.fleet_backend.service.PredictiveAnalysisService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/predictive-alerts")
public class PredictiveAlertController {

    private final PredictiveAnalysisService predictiveAnalysisService;

    public PredictiveAlertController(PredictiveAnalysisService predictiveAnalysisService) {
        this.predictiveAnalysisService = predictiveAnalysisService;
    }

    @GetMapping
    public List<PredictiveAlertDTO> getAll() {
        return predictiveAnalysisService.getAll();
    }

    @GetMapping("/active")
    public List<PredictiveAlertDTO> getActiveAlerts() {
        return predictiveAnalysisService.getActiveAlerts();
    }

    @GetMapping("/vehicle/{vehicleId}")
    public List<PredictiveAlertDTO> getByVehicle(@PathVariable Long vehicleId) {
        return predictiveAnalysisService.getByVehicle(vehicleId);
    }

    @PostMapping("/analyze/{vehicleId}")
    public PredictiveAlertDTO analyzeVehicle(@PathVariable Long vehicleId) {
        return predictiveAnalysisService.analyzeVehicle(vehicleId);
    }

    @PatchMapping("/{alertId}/resolve")
    public PredictiveAlertDTO resolveAlert(@PathVariable Long alertId) {
        return predictiveAnalysisService.resolveAlert(alertId);
    }
}